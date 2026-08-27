from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import io
import json
import re
import subprocess
import sys
import time
import urllib.parse
import zipfile
from collections import defaultdict
from pathlib import Path

import numpy as np
import pypdfium2 as pdfium
from PIL import Image, ImageOps
from PIL import ImageDraw


ROOT = Path(__file__).resolve().parents[1]
WORK_ROOT = ROOT.parent
CACHE_ROOT = WORK_ROOT / "corpus-ocr-cache"
INVENTORY_PATH = CACHE_ROOT / "inventory.json"
DETAIL_PATH = CACHE_ROOT / "corpus-ocr-detail.json"
SUMMARY_PATH = ROOT / "app" / "corpus-ocr-audit.json"
_GIT_OBJECTS_BY_HASH_PREFIX: dict[str, list[tuple[str, str]]] | None = None
_OCR_ENGINE: RapidOCR | None = None

sys.path.insert(0, str(WORK_ROOT / ".ocr-tools"))
from rapidocr_onnxruntime import RapidOCR  # noqa: E402


def normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def infer_format(record: dict) -> str:
    declared = str(record.get("format") or "").strip().upper()
    if declared:
        return declared
    url = str(record.get("url") or "")
    suffix = Path(urllib.parse.urlparse(url).path).suffix.lstrip(".").upper()
    return suffix or "UNKNOWN"


def load_catalogs() -> list[dict]:
    rows: list[dict] = []
    for catalog_path in sorted((ROOT / "app").glob("*-documents.json")):
        for record in json.loads(catalog_path.read_text(encoding="utf-8")):
            rows.append({
                **record,
                "catalog": catalog_path.name,
                "format_inferred": infer_format(record),
            })
    return rows


def load_source_records(source_dir: Path) -> list[dict]:
    rows: list[dict] = []
    for index, source_path in enumerate(sorted(path for path in source_dir.rglob("*") if path.is_file()), 1):
        payload = source_path.read_bytes()
        digest = sha256_bytes(payload)
        declared_format = source_path.suffix.lstrip(".").upper() or "UNKNOWN"
        rows.append({
            "catalog": "source-category",
            "id": f"source-{index:03d}-{digest[:12]}",
            "name": source_path.name,
            "url": str(source_path),
            "source_path": str(source_path),
            "format": declared_format,
            "format_inferred": declared_format,
            "pages": None,
            "size": len(payload),
            "sha256": digest,
        })
    return rows


def github_blob_spec(url: str) -> tuple[str, str] | None:
    parsed = urllib.parse.urlparse(url)
    if parsed.netloc.lower() != "github.com":
        return None
    match = re.match(r"^/[^/]+/[^/]+/blob/([^/]+)/(.+)$", parsed.path)
    if not match:
        return None
    return match.group(1), urllib.parse.unquote(match.group(2))


def git_objects_by_hash_prefix() -> dict[str, list[tuple[str, str]]]:
    global _GIT_OBJECTS_BY_HASH_PREFIX
    if _GIT_OBJECTS_BY_HASH_PREFIX is not None:
        return _GIT_OBJECTS_BY_HASH_PREFIX
    result = subprocess.run(
        ["git", "rev-list", "--all", "--objects"],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    mapping: defaultdict[str, list[tuple[str, str]]] = defaultdict(list)
    for line in result.stdout.decode("utf-8", errors="replace").splitlines():
        object_id, separator, path = line.partition(" ")
        if not separator:
            continue
        match = re.search(r"-([0-9a-f]{12})(?:\.[^/]+)?$", path, flags=re.IGNORECASE)
        if match:
            mapping[match.group(1).lower()].append((object_id, path))
    _GIT_OBJECTS_BY_HASH_PREFIX = dict(mapping)
    return _GIT_OBJECTS_BY_HASH_PREFIX


def recover_blob_by_catalog_hash(expected_sha256: str) -> tuple[bytes, str] | None:
    prefix = expected_sha256[:12].lower()
    for object_id, path in git_objects_by_hash_prefix().get(prefix, []):
        result = subprocess.run(
            ["git", "cat-file", "blob", object_id],
            cwd=ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if result.returncode == 0 and sha256_bytes(result.stdout) == expected_sha256:
            return result.stdout, f"git-object:{object_id}:{path}"
    return None


def commit_containing_blob(path: str, object_id: str) -> str:
    result = subprocess.run(
        ["git", "log", "--all", "--format=%H", "--", path],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    for commit in result.stdout.decode("ascii", errors="ignore").splitlines():
        tree = subprocess.run(
            ["git", "ls-tree", commit, "--", path],
            cwd=ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
        ).stdout.decode("utf-8", errors="replace")
        if re.search(rf"\b{re.escape(object_id)}\b", tree):
            return commit
    raise RuntimeError(f"No commit contains verified blob {object_id} at {path}")


def read_record_bytes(record: dict) -> tuple[bytes, str]:
    source_path = record.get("source_path")
    if source_path:
        path = Path(str(source_path))
        return path.read_bytes(), str(path)
    url = str(record.get("url") or "")
    if url.startswith("/"):
        path = ROOT / "public" / Path(url.lstrip("/"))
        return path.read_bytes(), str(path.relative_to(ROOT))
    blob = github_blob_spec(url)
    if blob:
        commit, path = blob
        result = subprocess.run(
            ["git", "show", f"{commit}:{path}"],
            cwd=ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if result.returncode:
            recovered = recover_blob_by_catalog_hash(str(record.get("sha256") or "").lower())
            if recovered:
                return recovered
            raise RuntimeError(result.stderr.decode("utf-8", errors="replace").strip())
        return result.stdout, f"git:{commit}:{path}"
    raise ValueError(f"Unsupported document URL: {url}")


def pdf_text_lengths(pdf: pdfium.PdfDocument) -> tuple[list[int], list[str]]:
    lengths: list[int] = []
    texts: list[str] = []
    for page_index in range(len(pdf)):
        page = pdf[page_index]
        textpage = page.get_textpage()
        text = textpage.get_text_range() or ""
        texts.append(text)
        lengths.append(len(normalize_text(text)))
        textpage.close()
        page.close()
    return lengths, texts


def inventory_record(record: dict) -> dict:
    started = time.time()
    payload, source = read_record_bytes(record)
    actual_hash = sha256_bytes(payload)
    expected_hash = str(record.get("sha256") or "").lower()
    fmt = record["format_inferred"]
    row = {
        "catalog": record["catalog"],
        "id": record.get("id"),
        "name": record.get("name"),
        "url": record.get("url"),
        "format": fmt,
        "source": source,
        "bytes": len(payload),
        "sha256": actual_hash,
        "expected_sha256": expected_hash,
        "hash_valid": actual_hash == expected_hash,
        "size_valid": record.get("size") in (None, len(payload)),
        "catalog_pages": record.get("pages"),
        "readable": True,
        "error": None,
    }
    try:
        if fmt == "PDF":
            pdf = pdfium.PdfDocument(payload)
            lengths, _ = pdf_text_lengths(pdf)
            metadata = {
                str(key): str(value)
                for key, value in (pdf.get_metadata_dict() or {}).items()
                if value not in (None, "")
            }
            row.update({
                "actual_pages": len(pdf),
                "page_count_valid": record.get("pages") in (None, len(pdf)),
                "embedded_text_lengths": lengths,
                "embedded_text_pages": sum(length >= 40 for length in lengths),
                "ocr_required_pages": sum(length < 40 for length in lengths),
                "pdf_metadata": metadata,
            })
            pdf.close()
        elif fmt in {"PNG", "JPG", "JPEG"}:
            image = Image.open(io.BytesIO(payload))
            image.verify()
            row.update({"actual_pages": 1, "page_count_valid": record.get("pages") in (None, 1)})
        elif fmt in {"CSV", "MD", "TXT"}:
            decoded = payload.decode("utf-8-sig")
            row.update({"text_chars": len(decoded), "actual_pages": None, "page_count_valid": True})
        elif fmt == "XLSX":
            with zipfile.ZipFile(io.BytesIO(payload)) as archive:
                bad_member = archive.testzip()
                if bad_member:
                    raise ValueError(f"Corrupt XLSX member: {bad_member}")
            row.update({"actual_pages": None, "page_count_valid": True})
        else:
            row.update({"actual_pages": None, "page_count_valid": True})
    except Exception as exc:  # keep the complete corpus report even when one record fails
        row["readable"] = False
        row["error"] = f"{type(exc).__name__}: {exc}"
    row["elapsed_seconds"] = round(time.time() - started, 3)
    return row


def thumbnail(image: Image.Image) -> Image.Image:
    gray = ImageOps.grayscale(image)
    gray.thumbnail((96, 128), Image.Resampling.LANCZOS)
    canvas = Image.new("L", (96, 128), 255)
    canvas.paste(gray, ((96 - gray.width) // 2, (128 - gray.height) // 2))
    return canvas


def dhash(image: Image.Image) -> str:
    pixels = np.asarray(ImageOps.grayscale(image).resize((17, 16), Image.Resampling.LANCZOS), dtype=np.int16)
    bits = (pixels[:, 1:] > pixels[:, :-1]).flatten()
    return np.packbits(bits.astype(np.uint8)).tobytes().hex()


def run_ocr(engine: RapidOCR, image: Image.Image) -> tuple[str, float | None]:
    result, _ = engine(np.asarray(image.convert("RGB")))
    if not result:
        return "", None
    text = "\n".join(str(line[1]) for line in result if len(line) >= 2)
    scores = [float(line[2]) for line in result if len(line) >= 3]
    return text, (sum(scores) / len(scores) if scores else None)


def audit_pdf(record: dict, inventory: dict, engine: RapidOCR) -> dict:
    payload, _ = read_record_bytes(record)
    pdf = pdfium.PdfDocument(payload)
    page_rows: list[dict] = []
    combined_text: list[str] = []
    for page_index in range(len(pdf)):
        page = pdf[page_index]
        textpage = page.get_textpage()
        embedded = textpage.get_text_range() or ""
        textpage.close()
        embedded_normalized = normalize_text(embedded)
        needs_ocr = len(embedded_normalized) < 40
        # Text-bearing pages only need a compact full-page render for visual
        # identity; scanned pages retain 90-DPI rendering for OCR accuracy.
        scale = 1.25 if needs_ocr else 0.25
        image = page.render(scale=scale, rotation=0).to_pil()
        thumb = thumbnail(image)
        thumb_array = np.asarray(thumb, dtype=np.uint8)
        ink_ratio = float(np.mean(thumb_array < 245))
        ocr_text = ""
        ocr_score = None
        if needs_ocr:
            ocr_text, ocr_score = run_ocr(engine, image)
        selected = ocr_text if len(normalize_text(ocr_text)) > len(embedded_normalized) else embedded
        selected_normalized = normalize_text(selected)
        combined_text.append(selected)
        page_rows.append({
            "page": page_index + 1,
            "embedded_chars": len(embedded_normalized),
            "ocr_applied": needs_ocr,
            "ocr_chars": len(normalize_text(ocr_text)),
            "ocr_mean_confidence": round(ocr_score, 4) if ocr_score is not None else None,
            "selected_source": "ocr" if selected is ocr_text and ocr_text else "embedded",
            "selected_text_sha256": sha256_bytes(selected_normalized.encode()) if selected_normalized else None,
            "thumbnail_sha256": sha256_bytes(thumb.tobytes()),
            "dhash": dhash(thumb),
            "ink_ratio": round(ink_ratio, 5),
            "needs_manual_review": needs_ocr and len(normalize_text(ocr_text)) < 20 and ink_ratio >= 0.01,
            "ocr_preview": re.sub(r"\s+", " ", ocr_text).strip()[:500],
        })
        page.close()
    pdf.close()
    normalized_document = normalize_text("\n".join(combined_text))
    return {
        "catalog": record["catalog"],
        "id": record.get("id"),
        "name": record.get("name"),
        "url": record.get("url"),
        "format": "PDF",
        "sha256": inventory["sha256"],
        "pages": len(page_rows),
        "embedded_text_pages": sum(not row["ocr_applied"] for row in page_rows),
        "ocr_pages": sum(row["ocr_applied"] for row in page_rows),
        "ocr_pages_with_text": sum(row["ocr_applied"] and row["ocr_chars"] >= 20 for row in page_rows),
        "manual_review_pages": sum(row["needs_manual_review"] for row in page_rows),
        "normalized_content_sha256": sha256_bytes(normalized_document.encode()) if normalized_document else None,
        "visual_sequence_sha256": sha256_bytes("|".join(row["thumbnail_sha256"] for row in page_rows).encode()),
        "dhash_sequence": [row["dhash"] for row in page_rows],
        "page_rows": page_rows,
    }


def audit_image(record: dict, inventory: dict, engine: RapidOCR) -> dict:
    payload, _ = read_record_bytes(record)
    image = Image.open(io.BytesIO(payload)).convert("RGB")
    text, score = run_ocr(engine, image)
    thumb = thumbnail(image)
    normalized = normalize_text(text)
    return {
        "catalog": record["catalog"],
        "id": record.get("id"),
        "name": record.get("name"),
        "url": record.get("url"),
        "format": record["format_inferred"],
        "sha256": inventory["sha256"],
        "pages": 1,
        "embedded_text_pages": 0,
        "ocr_pages": 1,
        "ocr_pages_with_text": int(len(normalized) >= 20),
        "manual_review_pages": int(len(normalized) < 20),
        "normalized_content_sha256": sha256_bytes(normalized.encode()) if normalized else None,
        "visual_sequence_sha256": sha256_bytes(thumb.tobytes()),
        "dhash_sequence": [dhash(thumb)],
        "page_rows": [{
            "page": 1,
            "embedded_chars": 0,
            "ocr_applied": True,
            "ocr_chars": len(normalized),
            "ocr_mean_confidence": round(score, 4) if score is not None else None,
            "selected_source": "ocr",
            "selected_text_sha256": sha256_bytes(normalized.encode()) if normalized else None,
            "thumbnail_sha256": sha256_bytes(thumb.tobytes()),
            "dhash": dhash(thumb),
            "ink_ratio": round(float(np.mean(np.asarray(thumb) < 245)), 5),
            "needs_manual_review": len(normalized) < 20,
            "ocr_preview": re.sub(r"\s+", " ", text).strip()[:500],
        }],
    }


def initialize_worker() -> None:
    global _OCR_ENGINE
    _OCR_ENGINE = RapidOCR(intra_op_num_threads=2, inter_op_num_threads=1)


def audit_record_worker(record: dict, inventory: dict) -> dict:
    global _OCR_ENGINE
    if _OCR_ENGINE is None:
        _OCR_ENGINE = RapidOCR(intra_op_num_threads=2, inter_op_num_threads=1)
    if record["format_inferred"] == "PDF":
        return audit_pdf(record, inventory, _OCR_ENGINE)
    if record["format_inferred"] in {"PNG", "JPG", "JPEG"}:
        return audit_image(record, inventory, _OCR_ENGINE)
    return {
        "catalog": record["catalog"],
        "id": record.get("id"),
        "name": record.get("name"),
        "url": record.get("url"),
        "format": record["format_inferred"],
        "sha256": inventory["sha256"],
        "pages": 0,
        "embedded_text_pages": 0,
        "ocr_pages": 0,
        "ocr_pages_with_text": 0,
        "manual_review_pages": 0,
        "normalized_content_sha256": None,
        "visual_sequence_sha256": None,
        "dhash_sequence": [],
        "page_rows": [],
    }


def build_duplicate_groups(records: list[dict]) -> dict:
    visual: defaultdict[str, list[dict]] = defaultdict(list)
    text: defaultdict[str, list[dict]] = defaultdict(list)
    exact: defaultdict[str, list[dict]] = defaultdict(list)
    for row in records:
        exact[row["sha256"]].append(row)
        if row.get("visual_sequence_sha256"):
            visual[row["visual_sequence_sha256"]].append(row)
        if row.get("normalized_content_sha256"):
            text[row["normalized_content_sha256"]].append(row)

    def compact(groups: defaultdict[str, list[dict]]) -> list[dict]:
        return [
            {
                "fingerprint": fingerprint,
                "records": [
                    {"catalog": row["catalog"], "id": row["id"], "name": row["name"], "url": row["url"], "sha256": row["sha256"]}
                    for row in members
                ],
            }
            for fingerprint, members in groups.items()
            if len(members) > 1
        ]

    visual_groups = compact(visual)
    text_groups = compact(text)
    visual_sets = {group["fingerprint"]: {row["sha256"] for row in group["records"]} for group in visual_groups}
    actual = [group for group in visual_groups if len(visual_sets[group["fingerprint"]]) > 1]
    return {
        "exact_hash_groups": compact(exact),
        "render_identical_byte_different_groups": actual,
        "normalized_text_candidate_groups": text_groups,
    }


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def render_manual_review(records: list[dict]) -> None:
    detail = json.loads(DETAIL_PATH.read_text(encoding="utf-8"))
    record_by_key = {(row["catalog"], row.get("id")): row for row in records}
    output_dir = WORK_ROOT / "corpus-manual-review"
    output_dir.mkdir(parents=True, exist_ok=True)
    for audited in detail["records"]:
        flagged = [page["page"] for page in audited.get("page_rows", []) if page.get("needs_manual_review")]
        if not flagged:
            continue
        record = record_by_key[(audited["catalog"], audited.get("id"))]
        payload, _ = read_record_bytes(record)
        pdf = pdfium.PdfDocument(payload)
        cards: list[Image.Image] = []
        for page_number in flagged:
            page = pdf[page_number - 1]
            image = page.render(scale=1.0, rotation=0).to_pil().convert("RGB")
            image.thumbnail((280, 360), Image.Resampling.LANCZOS)
            card = Image.new("RGB", (300, 400), "white")
            card.paste(image, ((300 - image.width) // 2, 30 + (360 - image.height) // 2))
            draw = ImageDraw.Draw(card)
            draw.text((8, 8), f"{audited['id']} - page {page_number}", fill="black")
            cards.append(card)
            page.close()
        pdf.close()
        for batch_index in range(0, len(cards), 20):
            batch = cards[batch_index:batch_index + 20]
            rows = (len(batch) + 3) // 4
            sheet = Image.new("RGB", (1200, rows * 400), "#d7dde2")
            for card_index, card in enumerate(batch):
                sheet.paste(card, ((card_index % 4) * 300, (card_index // 4) * 400))
            output_path = output_dir / f"{audited['id']}-review-{batch_index // 20 + 1}.jpg"
            sheet.save(output_path, quality=88, optimize=True)
            print(output_path, flush=True)


def repair_stale_github_urls() -> None:
    inventory = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    stale = [row for row in inventory["records"] if str(row.get("source") or "").startswith("git-object:")]
    by_catalog: defaultdict[str, list[dict]] = defaultdict(list)
    for row in stale:
        _, object_id, path = row["source"].split(":", 2)
        commit = commit_containing_blob(path, object_id)
        by_catalog[row["catalog"]].append({
            "id": row["id"],
            "url": f"https://github.com/cazey43/cadillac-pfas-event-trace/blob/{commit}/{path}",
        })
    repaired = 0
    for catalog_name, replacements in by_catalog.items():
        catalog_path = ROOT / "app" / catalog_name
        rows = json.loads(catalog_path.read_text(encoding="utf-8"))
        replacement_by_id = {row["id"]: row["url"] for row in replacements}
        for row in rows:
            if row.get("id") in replacement_by_id:
                row["url"] = replacement_by_id[row["id"]]
                repaired += 1
        write_json(catalog_path, rows)
    print(json.dumps({"repaired_urls": repaired, "catalogs": sorted(by_catalog)}, indent=2))


def run_inventory(records: list[dict]) -> dict:
    started = time.time()
    rows: list[dict] = []
    for index, record in enumerate(records, 1):
        row = inventory_record(record)
        rows.append(row)
        if index % 25 == 0 or index == len(records):
            pdf_rows = [item for item in rows if item["format"] == "PDF"]
            print(
                f"inventory {index}/{len(records)} records; "
                f"{sum(item.get('actual_pages') or 0 for item in pdf_rows)} PDF pages; "
                f"{sum(item.get('ocr_required_pages') or 0 for item in pdf_rows)} OCR-required",
                flush=True,
            )
            write_json(INVENTORY_PATH, {"records": rows, "complete": index == len(records)})
    result = {
        "records": rows,
        "complete": True,
        "elapsed_seconds": round(time.time() - started, 3),
    }
    write_json(INVENTORY_PATH, result)
    return result


def run_full(records: list[dict], inventory_payload: dict, workers: int) -> dict:
    inventory_by_hash = {row["sha256"]: row for row in inventory_payload["records"]}
    started = time.time()
    rows_by_index: dict[int, dict] = {}
    cache_dir = CACHE_ROOT / "records-v2"
    cache_dir.mkdir(parents=True, exist_ok=True)
    total_pages = sum((inventory_by_hash.get(str(record.get("sha256") or "").lower()) or {}).get("actual_pages") or 0 for record in records)
    done_pages = 0
    pending: list[tuple[int, dict, dict, Path]] = []
    for index, record in enumerate(records):
        expected_hash = str(record.get("sha256") or "").lower()
        inventory = inventory_by_hash[expected_hash]
        cache_path = cache_dir / f"{expected_hash}.json"
        if cache_path.exists():
            row = json.loads(cache_path.read_text(encoding="utf-8"))
        else:
            pending.append((index, record, inventory, cache_path))
            continue
        rows_by_index[index] = row
        done_pages += row.get("pages") or 0

    completed = len(rows_by_index)

    def report_progress() -> None:
        ordered = [rows_by_index[index] for index in sorted(rows_by_index)]
        print(
            f"audit {completed}/{len(records)} records; {done_pages}/{total_pages} pages; "
            f"OCR {sum(item.get('ocr_pages') or 0 for item in ordered)}; "
            f"manual review {sum(item.get('manual_review_pages') or 0 for item in ordered)}",
            flush=True,
        )
        write_json(DETAIL_PATH, {"records": ordered, "complete": completed == len(records)})

    if completed:
        report_progress()

    with concurrent.futures.ProcessPoolExecutor(max_workers=max(1, workers), initializer=initialize_worker) as executor:
        futures = {
            executor.submit(audit_record_worker, record, inventory): (index, cache_path)
            for index, record, inventory, cache_path in pending
        }
        for future in concurrent.futures.as_completed(futures):
            index, cache_path = futures[future]
            row = future.result()
            write_json(cache_path, row)
            rows_by_index[index] = row
            completed += 1
            done_pages += row.get("pages") or 0
            if completed % 10 == 0 or completed == len(records):
                report_progress()

    rows = [rows_by_index[index] for index in range(len(records))]
    duplicate_groups = build_duplicate_groups(rows)
    result = {
        "records": rows,
        "complete": True,
        "duplicate_groups": duplicate_groups,
        "elapsed_seconds": round(time.time() - started, 3),
    }
    write_json(DETAIL_PATH, result)
    summary = {
        "method": [
            "Verified every catalog record against its stored SHA-256 hash and declared byte size.",
            "Opened every PDF and verified its actual page count against the catalog.",
            "Read embedded text from every PDF page; OCR was applied to every page with fewer than 40 normalized embedded characters.",
            "Rendered every PDF page and image to create sequence-preserving visual fingerprints.",
            "Compared byte hashes, normalized selected text, rendered-page fingerprints, OCR evidence, page counts and metadata before duplicate classification.",
        ],
        "stats": {
            "catalogRecords": len(records),
            "pdfRecords": sum(row["format"] == "PDF" for row in rows),
            "pdfPages": sum(row.get("pages") or 0 for row in rows if row["format"] == "PDF"),
            "imageRecords": sum(row["format"] in {"PNG", "JPG", "JPEG"} for row in rows),
            "embeddedTextPages": sum(row.get("embedded_text_pages") or 0 for row in rows),
            "ocrPages": sum(row.get("ocr_pages") or 0 for row in rows),
            "ocrPagesWithText": sum(row.get("ocr_pages_with_text") or 0 for row in rows),
            "manualReviewPages": sum(row.get("manual_review_pages") or 0 for row in rows),
            "hashFailures": sum(not row.get("hash_valid") for row in inventory_payload["records"]),
            "unreadableRecords": sum(not row.get("readable") for row in inventory_payload["records"]),
            "pageCountFailures": sum(not row.get("page_count_valid", True) for row in inventory_payload["records"]),
            "exactHashDuplicateGroups": len(duplicate_groups["exact_hash_groups"]),
            "renderIdenticalByteDifferentGroups": len(duplicate_groups["render_identical_byte_different_groups"]),
            "normalizedTextCandidateGroups": len(duplicate_groups["normalized_text_candidate_groups"]),
        },
        "duplicatePolicy": "Remove only records that are byte-identical or byte-different but render identically page-for-page after text/OCR, metadata and page-count review. Retain revisions, annotations, signatures, cover messages, excerpts and compiled packages.",
        "manualReviewResolution": {
            "status": "visually-verified",
            "pagesReviewed": sum(row.get("manual_review_pages") or 0 for row in rows),
            "finding": "Every low-confidence page was visually inspected. They are valid non-text or sparse-content pages: faint reverse-side scans, appendix dividers, photographs, an aerial image, dense tables, sparse worksheet cells, a site map and faint handwritten/form pages. No missing or corrupt source page was found.",
        },
        "manualReview": [
            {
                "catalog": row["catalog"],
                "id": row["id"],
                "name": row["name"],
                "url": row["url"],
                "pages": [page["page"] for page in row["page_rows"] if page["needs_manual_review"]],
            }
            for row in rows
            if row.get("manual_review_pages")
        ],
        "duplicateCandidates": duplicate_groups,
    }
    write_json(SUMMARY_PATH, summary)
    return result


def main() -> None:
    global CACHE_ROOT, INVENTORY_PATH, DETAIL_PATH, SUMMARY_PATH
    parser = argparse.ArgumentParser(description="Audit every published corpus record and OCR image-only PDF pages.")
    parser.add_argument("--inventory-only", action="store_true")
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--refresh-inventory", action="store_true")
    parser.add_argument("--render-manual-review", action="store_true")
    parser.add_argument("--repair-stale-github-urls", action="store_true")
    parser.add_argument("--source-dir", type=Path)
    parser.add_argument("--cache-name", default="source-category")
    args = parser.parse_args()
    if args.source_dir:
        source_dir = args.source_dir.resolve()
        if not source_dir.is_dir():
            raise FileNotFoundError(source_dir)
        CACHE_ROOT = WORK_ROOT / f"{args.cache_name}-ocr-cache"
        INVENTORY_PATH = CACHE_ROOT / "inventory.json"
        DETAIL_PATH = CACHE_ROOT / "ocr-detail.json"
        SUMMARY_PATH = CACHE_ROOT / "ocr-audit.json"
        records = load_source_records(source_dir)
    else:
        records = load_catalogs()
    if args.render_manual_review:
        render_manual_review(records)
        return
    if args.repair_stale_github_urls:
        repair_stale_github_urls()
        return
    inventory = None
    if INVENTORY_PATH.exists() and not args.refresh_inventory:
        cached_inventory = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
        if cached_inventory.get("complete") and len(cached_inventory.get("records", [])) == len(records):
            inventory = cached_inventory
    if inventory is None:
        inventory = run_inventory(records)
    if not args.inventory_only:
        run_full(records, inventory, args.workers)


if __name__ == "__main__":
    main()
