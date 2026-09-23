import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { loadDownloadDeliveryPlan } from './document-download-integrity.mjs';
import { readFile } from 'node:fs/promises';

const root = fileURLToPath(new URL('..', import.meta.url));
const origin = process.argv[2] ?? 'https://cadillac-pfas-event-trace.icons-7120.chatgpt.site';
const vite = await createServer({ configFile: false, root, appType: 'custom', server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] } });
const failures = [], previews = new Set();
let cards = 0;
try {
  const { catalogPageList } = await vite.ssrLoadModule('/app/catalog/catalog-data.ts');
  for (const config of catalogPageList) {
    const response = await fetch(`${origin}/catalog/${config.slug}`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error(`${config.slug}: HTTP ${response.status}`);
    const html = await response.text();
    const articles = [...html.matchAll(/<article\b[^>]*data-record-id="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
    if (articles.length !== config.documents.length) failures.push(`${config.slug}: ${articles.length}/${config.documents.length} cards`);
    for (const [, id, card] of articles) {
      cards++;
      const image = card.match(/<img\b[^>]*src="([^"]+)"/);
      if (!image) failures.push(`${config.slug}:${id}: missing image`);
      else previews.add(new URL(image[1].replaceAll('&amp;', '&'), origin).href);
      for (const action of ['Download', 'Share']) {
        if (!new RegExp(`<button\\b[^>]*aria-label="${action} `).test(card)) failures.push(`${config.slug}:${id}: missing ${action}`);
      }
    }
  }
  let cursor = 0;
  const urls = [...previews];
  await Promise.all(Array.from({length: 12}, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      try {
        const response = await fetch(url, {signal: AbortSignal.timeout(30000)});
        const bytes = Buffer.from(await response.arrayBuffer());
        if (!response.ok || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') failures.push(`Invalid live image: ${url}`);
      } catch (e) { failures.push(`${url}: ${e.message}`); }
    }
  }));
  const manifest = JSON.parse(await readFile(new URL('../dist/client/.vite/manifest.json', import.meta.url)));
  const deliveries = (await loadDownloadDeliveryPlan()).filter(d => d.kind === 'bundled');
  cursor = 0;
  await Promise.all(Array.from({length: 8}, async () => {
    while (cursor < deliveries.length) {
      const d = deliveries[cursor++];
      const sourcePath = decodeURIComponent(new URL(d.row.url, origin).pathname).replace(/^.*\/public\//, '/');
      const built = manifest[`public${sourcePath}`]?.file;
      if (!built) { failures.push(`Missing built original: ${d.row.id}`); continue; }
      try {
        const r = await fetch(new URL(built, origin), {method:'HEAD', signal:AbortSignal.timeout(30000)});
        if (!r.ok || Number(r.headers.get('content-length')) !== d.row.size) failures.push(`Invalid live original: ${d.row.id} HTTP ${r.status}`);
      } catch(e) { failures.push(`${d.row.id}: ${e.message}`); }
    }
  }));
  console.log(JSON.stringify({catalogPages:catalogPageList.length, cards, uniquePreviewImages:previews.size, bundledOriginals:deliveries.length, failures}, null, 2));
  if (failures.length) process.exitCode=1;
} finally { await vite.close(); }
