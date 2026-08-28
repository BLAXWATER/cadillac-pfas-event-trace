from __future__ import annotations

import argparse
import concurrent.futures
import io
import json
import re
import sys
import time
import zipfile
from collections import defaultdict
from pathlib import Path

import numpy as np
import pypdfium2 as pdfium
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
WORK_ROOT = ROOT.parent
sys.path.insert(0, str(WORK_ROOT / ".ocr-tools"))

from rapidocr_onnxruntime import RapidOCR  # noqa: E402


TOPIC_PATTERNS = {
    "pfas": re.compile(r"\b(?:pfas|pfos|pfoa)\b|perfluoro|polyfluoro", re.I),
    "landfill_leachate": re.compile(
        r"wexford\s+(?:county\s+)?landfill|landfill.{0,80}leachate|leachate",
        re.I | re.S,
    ),
    "cadillac_wwtp": re.compile(
        r"cadillac.{0,40}(?:wwtp|wastewater\s+treatment)|"
        r"(?:wwtp|wastewater\s+treatment).{0,40}cadillac|"
        r"1121\s+plett|water\s+resources\s+department",
        re.I | re.S,
    ),
    "water_compliance": re.compile(
        r"\bnpdes\b|industrial\s+pretreatment|\bipp\b|biosolids|"
        r"sanitary\s+sewer\s+overflow|\bsso\b|discharge\s+monitoring\s+report|"
        r"\bdmr\b|significant\s+noncompliance|\bsnc\b|spill\s+notification|"
        r"sewer\s+use\s+ordinance",
        re.I,
    ),
    "groundwater_response": re.compile(
        r"groundwater.{0,120}(?:contamin|remediat|cleanup|investigat|monitor)|"
        r"(?:contamin|remediat|cleanup|investigat|monitor).{0,120}groundwater|"
        r"wellfield\s+relocation|municipal\s+well|private\s+well|hydrogeolog",
        re.I | re.S,
    ),
    "ldfa_industrial_park": re.compile(
        r"\bldfa\b.{0,120}(?:groundwater|pfas|cleanup|remediat|discharg|monitor)|"
        r"(?:groundwater|pfas|cleanup|remediat|discharg|monitor).{0,120}\bldfa\b|"
        r"cadillac\s+industrial\s+park",
        re.I | re.S,
    ),
    "clam_river_receptor": re.compile(
        r"clam\s+river.{0,120}(?:discharg|spill|contamin|storm|wastewater|pfas)|"
        r"(?:discharg|spill|contamin|storm|wastewater|pfas).{0,120}clam\s+river",
        re.I | re.S,
    ),
}


_OCR_ENGINE: RapidOCR | None = None


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def context_for_match(text: str, match: re.Match[str], radius: int = 280) -> str:
    start = max(0, match.start() - radius)
    end = min(len(text), match.end() + radius)
    return normalize_space(text[start:end])


def ocr_image(image: Image.Image) -> tuple[str, float | None]:
    global _OCR_ENGINE
    if _OCR_ENGINE is None:
        _OCR_ENGINE = RapidOCR(intra_op_num_threads=2, inter_op_num_threads=1)
    result, _ = _OCR_ENGINE(np.asarray(image.convert("RGB")))
    if not result:
        return "", None
    text = "\n".join(str(line[1]) for line in result if len(line) >= 2)
    scores = [float(line[2]) for line in result if len(line) >= 3]
    return text, (sum(scores) / len(scores) if scores else None)


def page_topic_hits(text: str) -> dict[str, list[str]]:
    hits: dict[str, list[str]] = {}
    for topic, pattern in TOPIC_PATTERNS.items():
        contexts: list[str] = []
        seen: set[str] = set()
        for match in pattern.finditer(text):
            context = context_for_match(text, match)
            key = context.lower()
            if key not in seen:
                contexts.append(context)
                seen.add(key)
            if len(contexts) >= 3:
                break
        if contexts:
            hits[topic] = contexts
    return hits


def classify_pdf(path_text: str, page_rows: list[dict]) -> dict:
    path = Path(path_text)
    pdf = pdfium.PdfDocument(str(path))
    topic_pages: defaultdict[str, list[dict]] = defaultdict(list)
    ocr_pages = 0
    ocr_pages_with_text = 0
    try:
        for page_index in range(len(pdf)):
            page = pdf[page_index]
            textpage = page.get_textpage()
            embedded = textpage.get_text_range() or ""
            textpage.close()
            row = page_rows[page_index] if page_index < len(page_rows) else {}
            used_ocr = bool(row.get("ocr_applied"))
            confidence = None
            selected = embedded
            if used_ocr:
                image = page.render(scale=1.25, rotation=0).to_pil()
                ocr_text, confidence = ocr_image(image)
                ocr_pages += 1
                if normalize_space(ocr_text):
                    ocr_pages_with_text += 1
                if len(re.sub(r"[^a-z0-9]+", "", ocr_text.lower())) > len(
                    re.sub(r"[^a-z0-9]+", "", embedded.lower())
                ):
                    selected = ocr_text
            hits = page_topic_hits(selected)
            for topic, contexts in hits.items():
                topic_pages[topic].append(
                    {
                        "page": page_index + 1,
                        "source": "ocr" if used_ocr and selected != embedded else "embedded",
                        "ocr_mean_confidence": round(confidence, 4) if confidence is not None else None,
                        "contexts": contexts,
                    }
                )
            page.close()
    finally:
        pdf.close()
    return {
        "path": str(path),
        "name": path.name,
        "format": "PDF",
        "pages": len(page_rows),
        "ocr_pages_reprocessed": ocr_pages,
        "ocr_pages_with_text": ocr_pages_with_text,
        "topics": dict(topic_pages),
    }


def extract_docx_text(path: Path) -> str:
    with zipfile.ZipFile(path) as archive:
        document = archive.read("word/document.xml").decode("utf-8", errors="replace")
    document = re.sub(r"</w:p>", "\n", document)
    return re.sub(r"<[^>]+>", "", document)


def classify_docx_container(path: Path) -> dict:
    text = extract_docx_text(path)
    return {
        "path": str(path),
        "name": path.name,
        "format": "DOCX",
        "pages": None,
        "ocr_pages_reprocessed": 0,
        "ocr_pages_with_text": 0,
        "topics": {
            topic: [{"page": None, "source": "native", "ocr_mean_confidence": None, "contexts": contexts}]
            for topic, contexts in page_topic_hits(text).items()
        },
    }


def worker(payload: tuple[str, list[dict]]) -> dict:
    path_text, page_rows = payload
    path = Path(path_text)
    if path.suffix.lower() == ".pdf":
        return classify_pdf(path_text, page_rows)
    if path.suffix.lower() == ".bin":
        return classify_docx_container(path)
    raise ValueError(f"Unsupported worker input: {path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--detail", required=True, type=Path)
    parser.add_argument("--source-dir", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()

    started = time.time()
    detail = json.loads(args.detail.read_text(encoding="utf-8"))
    rows_by_path = {
        str(Path(record["url"]).resolve()): record.get("page_rows", [])
        for record in detail["records"]
        if record.get("format") == "PDF"
    }
    jobs: list[tuple[str, list[dict]]] = []
    for path in sorted(path for path in args.source_dir.rglob("*") if path.is_file()):
        resolved = str(path.resolve())
        if path.suffix.lower() == ".pdf":
            jobs.append((resolved, rows_by_path.get(resolved, [])))
        elif path.suffix.lower() == ".bin":
            jobs.append((resolved, []))

    results: list[dict] = []
    with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(worker, job): job[0] for job in jobs}
        total = len(futures)
        for index, future in enumerate(concurrent.futures.as_completed(futures), 1):
            result = future.result()
            results.append(result)
            if index % 10 == 0 or index == total:
                print(f"classified {index}/{total}: {result['name']}", flush=True)

    results.sort(key=lambda row: row["path"].lower())
    topic_counts = {
        topic: sum(bool(row["topics"].get(topic)) for row in results)
        for topic in TOPIC_PATTERNS
    }
    output = {
        "complete": True,
        "source_dir": str(args.source_dir.resolve()),
        "records": len(results),
        "records_with_topics": sum(bool(row["topics"]) for row in results),
        "ocr_pages_reprocessed": sum(row["ocr_pages_reprocessed"] for row in results),
        "ocr_pages_with_text": sum(row["ocr_pages_with_text"] for row in results),
        "topic_record_counts": topic_counts,
        "elapsed_seconds": round(time.time() - started, 3),
        "results": results,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({key: output[key] for key in output if key != "results"}, indent=2), flush=True)


if __name__ == "__main__":
    main()
