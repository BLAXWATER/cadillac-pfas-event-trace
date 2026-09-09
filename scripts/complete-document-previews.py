"""Incrementally render archived PDFs; never substitute an unrelated page."""
import concurrent.futures
import hashlib
import json
import shutil
import tempfile
import subprocess
import re
from pathlib import Path
from urllib.parse import urlparse, unquote
import importlib.util
spec = importlib.util.spec_from_file_location('renderer', Path(__file__).with_name('generate-first-page-previews.py'))
renderer_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer_module)
render_one = renderer_module.render_one

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
MANIFEST = ROOT / 'app/first-page-preview-manifest.json'

def public_path(url):
    return '/' + unquote(urlparse(url).path).split('/public/')[-1].lstrip('/')

def main():
    manifest = json.loads(MANIFEST.read_text())
    records = {}
    for catalog in (ROOT/'app').glob('*-documents.json'):
        for row in json.loads(catalog.read_text(encoding='utf-8')):
            records[public_path(row['url'])] = row
    for pdf in PUBLIC.rglob('*.pdf'):
        records.setdefault('/'+pdf.relative_to(PUBLIC).as_posix(), {})
    roots = [PUBLIC] + [p/'public' for p in ROOT.parent.iterdir() if (p/'public').is_dir() and p != ROOT]
    missing, jobs, evidence = [], [], {}
    for url, row in records.items():
        if not url.lower().endswith('.pdf'):
            continue
        if url in manifest and (PUBLIC/manifest[url].lstrip('/')).is_file():
            continue
        found = None
        for base in roots:
            source = base/url.lstrip('/')
            if source.is_file():
                digest = hashlib.sha256(source.read_bytes()).hexdigest()
                if row.get('sha256') and digest != row['sha256']:
                    continue
                found = (source, base, digest)
                break
        if found is None:
            match = re.search(r'/blob/([a-f0-9]{40})/public/', row.get('url', ''))
            if match:
                result = subprocess.run(['git', 'show', match[1]+':public'+url], cwd=ROOT, capture_output=True)
                digest = hashlib.sha256(result.stdout).hexdigest()
                if result.returncode == 0 and result.stdout.startswith(b'%PDF') and (not row.get('sha256') or row['sha256'] == digest):
                    base = ROOT/'tmp/preview-originals'
                    source = base/url.lstrip('/')
                    source.parent.mkdir(parents=True, exist_ok=True)
                    source.write_bytes(result.stdout)
                    found = (source, base, digest)
            if found is None:
                missing.append(url)
        if found is not None:
            jobs.append((url, *found))
    print(f'{len(jobs)} PDFs to render; {len(missing)} originals unavailable', flush=True)
    renderer = shutil.which('pdftoppm')
    if not renderer:
        raise RuntimeError('pdftoppm unavailable')
    with tempfile.TemporaryDirectory() as temp:
        def run(job):
            url, source, base, digest = job
            _, image, status = render_one(source, base, Path(temp), Path(renderer))
            return url, digest, image, status
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            for i, (url, digest, image, status) in enumerate(pool.map(run, jobs), 1):
                if image is None:
                    missing.append(url)
                    print(url, status, flush=True)
                    continue
                target = PUBLIC/'first-page-previews/by-sha256'/f'{digest}.webp'
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(image, target)
                manifest[url] = '/'+target.relative_to(PUBLIC).as_posix()
                evidence[url] = {'sourceSha256': digest, 'page': 1, 'preview': manifest[url]}
                if i % 50 == 0:
                    print(f'Rendered {i}/{len(jobs)}', flush=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
    report = ROOT/'app/document-preview-provenance.json'
    prior = json.loads(report.read_text()) if report.exists() else {}
    prior.update(evidence)
    report.write_text(json.dumps(prior, indent=2)+'\n', encoding='utf-8')
    print('Unresolved PDFs:', json.dumps(missing), flush=True)

if __name__ == '__main__':
    main()
