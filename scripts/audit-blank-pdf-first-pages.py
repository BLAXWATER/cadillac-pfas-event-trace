"""Render PDF first pages and report conservative blank-page candidates.

The audit intentionally treats text extraction as supporting evidence only.  Its
primary signal is a grayscale Poppler render, so image-only and faint scans are
not mistaken for blank pages merely because they lack extractable text.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
from pathlib import Path
import subprocess
import tempfile

from pypdf import PdfReader


def read_pgm(path: Path) -> tuple[int, int, bytes]:
    data = path.read_bytes()
    if not data.startswith(b"P5"):
        raise ValueError(f"Unexpected PGM header in {path}")

    index = 2
    tokens: list[bytes] = []
    while len(tokens) < 3:
        while index < len(data) and data[index] in b" \t\r\n":
            index += 1
        if index < len(data) and data[index] == ord("#"):
            index = data.find(b"\n", index) + 1
            continue
        end = index
        while end < len(data) and data[end] not in b" \t\r\n":
            end += 1
        tokens.append(data[index:end])
        index = end

    while index < len(data) and data[index] in b" \t\r\n":
        index += 1
    width, height, maximum = map(int, tokens)
    if maximum != 255:
        raise ValueError(f"Unsupported PGM maximum {maximum} in {path}")
    pixels = data[index : index + width * height]
    if len(pixels) != width * height:
        raise ValueError(f"Incomplete PGM pixels in {path}")
    return width, height, pixels


def audit_pdf(args: tuple[str, str, int]) -> dict[str, object]:
    pdf_path_raw, poppler_raw, dpi = args
    pdf_path = Path(pdf_path_raw)
    result: dict[str, object] = {"path": pdf_path.as_posix()}

    try:
        reader = PdfReader(str(pdf_path), strict=False)
        result["pages"] = len(reader.pages)
        result["text_chars"] = len((reader.pages[0].extract_text() or "").strip())
    except Exception as exc:  # pragma: no cover - corruption is audit output
        result["metadata_error"] = str(exc)

    try:
        with tempfile.TemporaryDirectory(prefix="cadillac-pdf-page-") as tmp:
            output_base = Path(tmp) / "first"
            completed = subprocess.run(
                [
                    poppler_raw,
                    "-f",
                    "1",
                    "-l",
                    "1",
                    "-singlefile",
                    "-r",
                    str(dpi),
                    "-gray",
                    str(pdf_path),
                    str(output_base),
                ],
                capture_output=True,
                text=True,
                timeout=90,
                check=False,
            )
            pgm_path = output_base.with_suffix(".pgm")
            if completed.returncode != 0 or not pgm_path.exists():
                raise RuntimeError(completed.stderr.strip() or "Poppler render failed")

            width, height, pixels = read_pgm(pgm_path)
            total = len(pixels)
            result.update(
                {
                    "width": width,
                    "height": height,
                    "mean_gray": round(sum(pixels) / total, 4),
                    "ink_lt_250": round(sum(value < 250 for value in pixels) / total, 8),
                    "ink_lt_245": round(sum(value < 245 for value in pixels) / total, 8),
                    "ink_lt_225": round(sum(value < 225 for value in pixels) / total, 8),
                    "ink_lt_180": round(sum(value < 180 for value in pixels) / total, 8),
                }
            )
            result["blank_candidate"] = bool(
                result.get("text_chars") == 0
                and result["mean_gray"] >= 254.5
                and result["ink_lt_245"] <= 0.002
                and result["ink_lt_225"] <= 0.001
            )
    except Exception as exc:  # pragma: no cover - corruption is audit output
        result["render_error"] = str(exc)

    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--poppler", required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--dpi", type=int, default=48)
    parser.add_argument("--workers", type=int, default=max(2, min(8, os.cpu_count() or 2)))
    options = parser.parse_args()

    pdfs = sorted(options.root.rglob("*.pdf"), key=lambda path: path.as_posix().lower())
    work = [(str(path), options.poppler, options.dpi) for path in pdfs]
    with concurrent.futures.ThreadPoolExecutor(max_workers=options.workers) as executor:
        results = list(executor.map(audit_pdf, work))

    results.sort(key=lambda item: (item.get("ink_lt_245", 1), item["path"]))
    options.output.parent.mkdir(parents=True, exist_ok=True)
    options.output.write_text(json.dumps(results, indent=2), encoding="utf-8")
    errors = sum("render_error" in item or "metadata_error" in item for item in results)
    print(json.dumps({"pdfs": len(results), "errors": errors, "output": str(options.output)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
