"""Render and content-deduplicate a first-page WebP preview for every PDF."""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image


def render_one(pdf_path: Path, public_root: Path, staging_root: Path, pdftoppm: Path) -> tuple[Path, Path | None, str]:
    relative_pdf = pdf_path.relative_to(public_root)
    staged_path = staging_root / relative_pdf.with_suffix(".webp")
    staged_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="first-page-render-") as temp_dir:
        prefix = Path(temp_dir) / "page"
        command = [
            str(pdftoppm),
            "-f", "1",
            "-l", "1",
            "-singlefile",
            "-jpeg",
            "-jpegopt", "quality=86,progressive=y,optimize=y",
            "-scale-to-x", "1400",
            "-scale-to-y", "-1",
            str(pdf_path),
            str(prefix),
        ]
        completed = subprocess.run(command, capture_output=True, text=True, timeout=120)
        rendered = prefix.with_suffix(".jpg")
        if completed.returncode != 0 or not rendered.exists():
            detail = completed.stderr.strip() or "renderer did not produce an image"
            return relative_pdf, None, f"ERROR: {detail}"

        with Image.open(rendered) as image:
            image.convert("RGB").save(staged_path, "WEBP", quality=78, method=6)

    return relative_pdf, staged_path, "OK"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def clear_generated_root(output_root: Path, public_root: Path) -> None:
    if output_root.parent != public_root or output_root.name != "first-page-previews":
        raise ValueError(f"Refusing to clear unexpected output root: {output_root}")
    if output_root.exists():
        shutil.rmtree(output_root)
    output_root.mkdir(parents=True)


def existing_webp_hashes(public_root: Path, excluded_root: Path) -> dict[str, str]:
    hashes: dict[str, str] = {}
    for path in sorted(public_root.rglob("*.webp")):
        if excluded_root in path.parents:
            continue
        hashes.setdefault(sha256(path), "/" + path.relative_to(public_root).as_posix())
    return hashes


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--public-root", type=Path, default=Path("public"))
    parser.add_argument("--output-root", type=Path, default=Path("public/first-page-previews"))
    parser.add_argument("--manifest", type=Path, default=Path("app/first-page-preview-manifest.json"))
    parser.add_argument("--pdftoppm", type=Path, required=True)
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()

    public_root = args.public_root.resolve()
    output_root = args.output_root.resolve()
    manifest_path = args.manifest.resolve()
    pdfs = sorted(public_root.rglob("*.pdf"))
    clear_generated_root(output_root, public_root)
    known_hashes = existing_webp_hashes(public_root, output_root)
    generated_hashes: dict[str, str] = {}
    manifest: dict[str, str] = {}
    failures: list[tuple[Path, str]] = []
    reused_previews = 0

    with tempfile.TemporaryDirectory(prefix="first-page-staging-") as staging_dir:
        staging_root = Path(staging_dir)
        with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
            futures = [executor.submit(render_one, path, public_root, staging_root, args.pdftoppm) for path in pdfs]
            for index, future in enumerate(concurrent.futures.as_completed(futures), start=1):
                relative_pdf, staged_path, status = future.result()
                if status != "OK" or staged_path is None:
                    failures.append((relative_pdf, status))
                else:
                    preview_hash = sha256(staged_path)
                    public_preview = known_hashes.get(preview_hash) or generated_hashes.get(preview_hash)
                    if public_preview:
                        reused_previews += 1
                    else:
                        output_path = output_root / "by-sha256" / f"{preview_hash}.webp"
                        output_path.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copyfile(staged_path, output_path)
                        public_preview = "/" + output_path.relative_to(public_root).as_posix()
                        generated_hashes[preview_hash] = public_preview
                    manifest["/" + relative_pdf.as_posix()] = public_preview
                if index % 50 == 0 or index == len(pdfs):
                    print(f"Rendered {index}/{len(pdfs)} first-page previews")

    manifest_path.write_text(json.dumps(dict(sorted(manifest.items())), indent=2) + "\n", encoding="utf-8")
    for path, status in failures:
        print(f"{path}: {status}")
    print(
        f"Complete: {len(manifest)} mapped, {len(generated_hashes)} distinct assets, "
        f"{reused_previews} reused, {len(failures)} failed"
    )
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
