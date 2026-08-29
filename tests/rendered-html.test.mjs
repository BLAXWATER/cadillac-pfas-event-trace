import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  assert.match(css, /\.event-card\s*\{[^}]*border:\s*1px solid #22303b[^}]*background:\s*linear-gradient\(135deg, rgba\(18, 26, 36, \.96\), rgba\(11, 16, 23, \.96\)\)/i);
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
  assert.match(html, /<title>Cadillac PFAS Event Trace<\/title>/i);
  assert.match(html, /Hierarchical, source-linked PFAS event trace/i);
  assert.match(html, /<img[^>]+class="integrity-logo"[^>]+src="\/blax-water-logo\.png"[^>]+alt="BLAX Water"/i);
  assert.ok(html.indexOf("/blax-water-logo.png") < html.indexOf("Original-source rule"));
  assert.match(html, /Original-source rule/i);
  assert.match(html, /Year Over Year, Multiple Events, One source trail/i);
  assert.match(html, /class="year-nav-overflow"/i);
  assert.match(html, /2018: show all 10 events, including 6 additional events/i);
  assert.ok(html.indexOf('class="year-nav-overflow"') < html.indexOf('class="trace-intro"'));
  assert.match(html, /class="year-overflow-toggle"/i);
  assert.match(html, /aria-expanded="false"/i);
  assert.match(html, /\+\d+ (?:event|events)/i);
  assert.match(html, /4 of 10 events shown/i);
  assert.ok(html.indexOf('class="year-overflow-toggle"') < html.indexOf('EGLE directs PFAS source evaluation and reduction'));
  assert.match(html, /Hover a filename for its source-page preview and result/i);
  assert.doesNotMatch(html, /Original file not loaded/i);
});
