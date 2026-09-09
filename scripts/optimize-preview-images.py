"""Optimize display derivatives only; never alter original documents."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]/'public/first-page-previews'
before=after=0
for p in root.rglob('*.webp'):
    before+=p.stat().st_size
    with Image.open(p) as source:
        im=source.convert('RGB');im.thumbnail((900,1200));im.save(p,'WEBP',quality=60,method=6)
    after+=p.stat().st_size
print({'before':before,'after':after})
