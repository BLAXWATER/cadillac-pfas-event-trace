import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("uses the core brand palette without recoloring the chronological trace", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  for (const color of ["#050708", "#002b3b", "#00bceb", "#f5f6f6", "#8d969c"]) {
    assert.match(css, new RegExp(color, "i"));
  }

  assert.match(css, /\.trace\s*\{[^}]*--primary:\s*#26e6f7[^}]*color:\s*#e8eef5/i);
  assert.match(css, /\.trace-row\[data-kind="regulatory"\]\s*\{\s*--trace-color:\s*#62a9ff;\s*\}/i);
  assert.match(css, /\.trace-row\[data-kind="sampling"\]\s*\{\s*--trace-color:\s*#ffe45c;\s*\}/i);
  assert.match(css, /\.trace-row\[data-kind="compliance"\]\s*\{\s*--trace-color:\s*#ff6570;\s*\}/i);
  assert.match(css, /\.trace-row\[data-kind="receptor"\]\s*\{\s*--trace-color:\s*#ff8a3d;\s*\}/i);
  assert.match(css, /\.trace-row\[data-kind="gap"\]\s*\{\s*--trace-color:\s*#ffbf47;\s*\}/i);
  assert.match(css, /\.event-card\s*\{[^}]*border:\s*3px solid var\(--trace-color\)[^}]*background:\s*linear-gradient\(135deg, rgba\(18, 26, 36, \.96\), rgba\(11, 16, 23, \.96\)\)/i);
  assert.match(css, /\.integrity-logo\s*\{[^}]*background:\s*transparent[^}]*mix-blend-mode:\s*screen/i);
});

test("renders stable site metadata and source policy", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const firstPagePreviewManifest = JSON.parse(
    await readFile(new URL("../app/first-page-preview-manifest.json", import.meta.url), "utf8"),
  );
  assert.match(html, /<title>Cadillac PFAS Event Tracer<\/title>/i);
  assert.match(html, /Hierarchical, source-linked PFAS event trace/i);
  const logoPath = html.match(/<img[^>]+class="integrity-logo"[^>]+src="(\/assets\/blax-water-logo-optimized-[^"]+\.webp)"[^>]+alt="BLAX Water"/i)?.[1];
  assert.ok(logoPath, "the bundled BLAX Water logo should render before the source policy");
  assert.ok(html.indexOf(logoPath) < html.indexOf("Original-source rule"));
  assert.match(html, /Original-source rule/i);
  assert.match(html, /Year Over Year, Multiple Events, One source trail/i);
  assert.match(html, /2018: jump to 16 events/i);
  assert.match(html, /<strong>2018<\/strong><span>16(?:<!-- -->\s*)+events<\/span>/i);
  assert.doesNotMatch(html, /class="year-nav-overflow"/i);
  assert.doesNotMatch(html, /class="year-overflow-toggle"/i);
  assert.doesNotMatch(html, /aria-expanded=/i);
  assert.doesNotMatch(html, /4 of 10 events shown/i);
  assert.equal((html.match(/class="trace-row"/gi) ?? []).length, 105);
  assert.match(html, /EGLE cites a 16\.369-million-gallon April bypass/i);
  assert.match(html, /Cadillac attributes April bypass to an RDS-exceeding flood/i);
  assert.match(html, /EPA QNCR lists seven Cadillac ammonia and carbonaceous-BOD violations/i);
  assert.match(html, /EGLE compiles multi-round Cadillac-area PFAS results/i);
  assert.match(html, /USGS measures Clam River discharge at Plett Road/i);
  assert.match(html, /field-measurements\.csv/i);
  assert.match(html, /channel-measurements\.csv/i);
  assert.match(html, /monitoring-location-metadata\.csv/i);
  assert.match(html, /<strong>PFOS 120 ng\/L<\/strong>/i);
  assert.match(html, /<strong>PFOA 590 ng\/L<\/strong>/i);
  assert.match(html, /<strong>PFHxS 610 ng\/L<\/strong>/i);
  assert.match(html, /<strong>PFBS 950 ng\/L<\/strong>/i);
  assert.match(html, /<strong>PFHxA 2,100 ng\/L<\/strong>/i);
  assert.match(html, /<strong>PFPeA 610 ng\/L<\/strong>/i);
  assert.match(html, /<strong>PFPeS 160 ng\/L<\/strong>/i);
  assert.match(html, /class="source-thumbnail\s+source-thumbnail--(?:pdf|html|image|spreadsheet|office|archive|other)"/i);
  for (const sourcePath of ["/findings-docs/008-5b67e1ed1d5c.pdf", "/npdes-docs/076-a611a75485cf.pdf"]) {
    const previewName = path.basename(firstPagePreviewManifest[sourcePath], ".webp");
    assert.match(html, new RegExp(`src="/assets/${previewName}-[^"]+\\.webp"`, "i"));
  }
  assert.doesNotMatch(html, /src="\/source-previews\//i);
  assert.match(html, /Hover a filename for its first-page preview and result/i);
  assert.doesNotMatch(html, /Original file not loaded/i);
});
