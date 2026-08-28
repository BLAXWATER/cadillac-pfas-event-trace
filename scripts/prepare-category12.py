from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORK_ROOT = ROOT.parent
SOURCE = Path(r"F:\MASTER-FILE-CATEGORIZED\12 - Wexford Landfill & Leachate")
INVENTORY = WORK_ROOT / "category12-source-ocr-cache" / "inventory.json"
DETAIL = WORK_ROOT / "category12-source-ocr-cache" / "ocr-detail.json"
GLOBAL_DETAIL = WORK_ROOT / "corpus-ocr-cache" / "corpus-ocr-detail.json"
SELECTION = WORK_ROOT / "category12-selection.json"
ASSET_DIR = ROOT / "public" / "wexford-docs"
CATALOG = ROOT / "app" / "wexford-documents.json"


TIMELINE_LEACHATE_HASH = "c2eaedede443068e6a0adf05354e28393bff6424989e5bd00698db301e59d0fc"

EXCLUDED_NON_PRIMARY = {
    "08-06-2026 - CADILLAC-SPILL-1.docx",
    "SOURCE_INDEX_AND_LINKS.md",
    "2018-11-29__792182164173532957__J17646-1 UDS Level 2 Report Final Report (Leachate).pdf v1.pdf.json",
    "01-12-2016 - S1_Key_Pages_Exhibit_Extract.pdf",
    "08-13-2026 - History - Wexford_Cadillac.pdf",
    "Cadillac_WWTP_All_Leachate_Records.pdf",
    "Cadillac_WWTP_Landfill_Leachate_AFFF_Findings.pdf",
    "Cadillac_WWTP_Leachate_Report.pdf",
    "Exhibit-D_IPR-Landfill-History-1970s.pdf",
}

EXCLUDED_ACTUAL_DUPLICATES = {
    "Duplicates_2019-03-20_Wexford_County_BOC_Minutes.pdf",
    "Duplicates_2019-05-01_Wexford_County_BOC_Minutes.pdf",
    "Duplicates_2019-05-15_Wexford_County_BOC_Minutes.pdf",
    "Duplicates_2019-07-03_Wexford_County_BOC_Minutes.pdf",
    "2025-05-08__3641815345960060490__Air Renewable Operating Permit (ROP) Notification of Change (Rule 215)_Wexford County Landfill (N3862)HQC-E6M3-FCV5K_v1.pdf",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def clean_display_name(name: str) -> str:
    cleaned = re.sub(r"^Duplicates?_", "", name, flags=re.IGNORECASE)
    stem, suffix = Path(cleaned).stem, Path(cleaned).suffix
    stem = re.sub(r"\s*~\d+$", "", stem)
    stem = re.sub(r"\s*\((?:copy\s*)?\d+\)$", "", stem, flags=re.IGNORECASE)
    stem = re.sub(r"\s{2,}", " ", stem).strip()
    return f"{stem}{suffix}"


def infer_year(name: str, metadata: dict) -> str:
    match = re.search(r"(?:19|20)\d{2}", name)
    if match:
        return match.group(0)
    for key in ("CreationDate", "ModDate"):
        match = re.search(r"(?:19|20)\d{2}", str(metadata.get(key) or ""))
        if match:
            return match.group(0)
    return "Undated"


def infer_type(name: str) -> str:
    value = name.lower()
    if any(word in value for word in ("board of commissioners", "boc_minutes", "agenda", "materials_management")):
        return "County proceedings"
    if any(word in value for word in ("flare", "gccs", "gas migration", "gas monitoring", "sem report", "air quality", "renewable operating permit", "rop ", "asbestos")):
        return "Air and landfill-gas record"
    if any(word in value for word in ("compliance", "inspection", "violation", "vn response", "test observation")):
        return "Compliance and inspection"
    if any(word in value for word in ("storm water", "stormwater", "noi", "coc", "termination")):
        return "Stormwater record"
    if any(word in value for word in ("lab", "j17646", "test report", "results letter", "performance test")):
        return "Laboratory and test results"
    if any(word in value for word in ("permit", "fact sheet", "injection", "part 625", "license")):
        return "Permit and licensing"
    if any(word in value for word in ("groundwater", "ground water", "water well", "wellhead")):
        return "Groundwater record"
    if any(word in value for word in ("court", "hissong")):
        return "Legal record"
    if any(word in value for word in ("web record", "screencapture", "site-site")):
        return "Official site registry"
    if "minutes" in value:
        return "County proceedings"
    return "Landfill record"


def description_for(name: str, record_type: str, metadata: dict) -> str:
    title = str(metadata.get("Title") or "").strip()
    if not title or title.lower() in {"(null)", "null"}:
        title = Path(name).stem
    title = re.sub(r"[_]+", " ", title)
    title = re.sub(r"\s{2,}", " ", title).strip(" .")
    return (
        f"{title}. Verified as a distinct {record_type.lower()} after file-hash, rendered-page, "
        "OCR-text and metadata comparison."
    )


def build_selection() -> list[dict]:
    inventory = load_json(INVENTORY)["records"]
    detail = {row["name"]: row for row in load_json(DETAIL)["records"]}
    existing_hashes = {row["sha256"] for row in load_json(GLOBAL_DETAIL)["records"]}
    existing_hashes.add(TIMELINE_LEACHATE_HASH)

    selected = []
    for source in inventory:
        name = source["name"]
        if source["sha256"] in existing_hashes:
            continue
        if name in EXCLUDED_NON_PRIMARY or name in EXCLUDED_ACTUAL_DUPLICATES:
            continue
        if source["format"] not in {"PDF", "PNG", "JPG", "JPEG"}:
            continue
        row_detail = detail[name]
        selected.append({
            "source": source["source"],
            "sourceName": name,
            "name": clean_display_name(name),
            "format": source["format"],
            "pages": source["actual_pages"] or 1,
            "size": source["bytes"],
            "sha256": source["sha256"],
            "embeddedTextPages": row_detail["embedded_text_pages"],
            "ocrPages": row_detail["ocr_pages"],
            "ocrPagesWithText": row_detail["ocr_pages_with_text"],
            "manualReviewPages": row_detail["manual_review_pages"],
            "pdfMetadata": source.get("pdf_metadata") or {},
        })

    if len(selected) != 81:
        raise RuntimeError(f"Expected 81 selected records, found {len(selected)}")
    if len({row["sha256"] for row in selected}) != len(selected):
        raise RuntimeError("Selected records contain duplicate hashes")
    return selected


def command_copy() -> None:
    selected = build_selection()
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    for index, row in enumerate(selected, 20):
        suffix = Path(row["sourceName"]).suffix.lower()
        asset_name = f"{index:03d}-{row['sha256'][:12]}{suffix}"
        target = ASSET_DIR / asset_name
        shutil.copyfile(row["source"], target)
        row["id"] = f"{index:03d}-{row['sha256'][:12]}"
        row["assetName"] = asset_name
    SELECTION.write_text(json.dumps(selected, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Copied {len(selected)} records ({sum(row['size'] for row in selected)} bytes) to {ASSET_DIR}")


def command_catalog(commit: str) -> None:
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("--commit must be a full 40-character Git commit")
    selected = load_json(SELECTION)
    existing = load_json(CATALOG)
    additions = []
    for row in selected:
        record_type = infer_type(row["name"])
        additions.append({
            "id": row["id"],
            "name": row["name"],
            "url": f"https://github.com/cazey43/cadillac-pfas-event-trace/blob/{commit}/public/wexford-docs/{row['assetName']}",
            "year": infer_year(row["name"], row["pdfMetadata"]),
            "type": record_type,
            "format": row["format"],
            "pages": row["pages"],
            "size": row["size"],
            "sha256": row["sha256"],
            "description": description_for(row["name"], record_type, row["pdfMetadata"]),
        })
    catalog = existing + additions
    if len(catalog) != 100:
        raise RuntimeError(f"Expected 100 Wexford records, found {len(catalog)}")
    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(catalog)} records to {CATALOG}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("copy", "catalog"))
    parser.add_argument("--commit")
    args = parser.parse_args()
    if args.command == "copy":
        command_copy()
    else:
        if not args.commit:
            parser.error("catalog requires --commit")
        command_catalog(args.commit)


if __name__ == "__main__":
    main()
