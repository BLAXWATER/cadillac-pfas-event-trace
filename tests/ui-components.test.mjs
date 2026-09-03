import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true },
});

after(async () => {
  await vite.close();
});

async function readCssTree(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const contents = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return readCssTree(entryPath);
      }
      return entry.name.endsWith(".css") ? readFile(entryPath, "utf8") : "";
    }),
  );
  return contents.join("\n");
}

test("emits the trace's critical layout and preview styles", async () => {
  const css = await readCssTree(path.join(root, "dist"));

  assert.match(css, /\.year-nav\{/);
  assert.match(css, /\.source-tooltip\{/);
  assert.match(css, /max-height:min\(760px,88vh\)/);
  assert.match(css, /\.source-preview\{/);
  assert.match(css, /object-fit:contain/);
  assert.match(css, /\.missing-preview\{/);
  assert.match(css, /\.document-grid\{/);
  assert.match(css, /--font-11pt:\s*14\.667px/);
  assert.match(css, /--font-12pt:\s*16px/);
  assert.match(css, /--font-14pt:\s*18\.667px/);
  assert.match(css, /font-size:clamp\(var\(--font-11pt\),\s*var\(--event-title-fit,\s*22px\),\s*33px\)/);
  const eventTitleStyles = css.match(/\.event-card h3\{[^}]*\}/)?.[0] ?? "";
  assert.match(eventTitleStyles, /font-weight:700/);
  assert.match(eventTitleStyles, /text-transform:uppercase/);
  assert.match(eventTitleStyles, /max-width:100%/);
  assert.match(eventTitleStyles, /overflow-wrap:anywhere/);
  assert.match(eventTitleStyles, /white-space:normal/);
  assert.doesNotMatch(eventTitleStyles, /text-overflow:ellipsis|white-space:nowrap/);
  assert.match(css, /\.event-card\{[^}]*border:3px solid var\(--trace-color\)/);
  assert.match(css, /@media\s*\(width<=760px\)/);
});

test("keeps explicit application text at or above the 11pt minimum", async () => {
  const css = await readFile(path.join(root, "app", "globals.css"), "utf8");
  const undersized = [...css.matchAll(/font-size:\s*([0-9]+(?:\.[0-9]+)?)px/g)]
    .map((match) => Number(match[1]))
    .filter((size) => size < 14.667);

  assert.deepEqual(undersized, []);
  assert.match(css, /\.kind-badge\s*\{[^}]*font-size:\s*var\(--font-11pt\)/);
  assert.match(css, /\.site-shell small\s*\{[^}]*font-size:\s*var\(--font-11pt\)/);
  assert.match(css, /\.site-shell \[data-slot="badge"\]\s*\{[^}]*font-size:\s*var\(--font-11pt\)/);
});

test("contains the document reader and primary controls on mobile screens", async () => {
  const css = await readFile(path.join(root, "app", "globals.css"), "utf8");

  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /\.document-dialog-header\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0[^}]*box-sizing:\s*border-box/s);
  assert.match(css, /\.document-dialog-header > div:first-child\s*\{[^}]*flex:\s*1 1 auto[^}]*min-width:\s*0/s);
  assert.match(css, /\.document-dialog\s*\{[^}]*max-width:\s*calc\(100vw - 12px\)[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\)/s);
  assert.match(css, /\.document-dialog > \[data-slot="dialog-close"\]\s*\{[^}]*width:\s*44px[^}]*height:\s*44px/s);
  assert.match(css, /\.document-frame\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.timestamp-ribbon\s*\{[^}]*grid-template-columns:\s*auto minmax\(0, 1fr\)/s);
  assert.match(css, /\.archive-card > :is\(a, button\)\s*\{[^}]*min-height:\s*44px/s);
});

test("scales the complete layout across mobile, tablet, desktop and large screens", async () => {
  const css = await readFile(path.join(root, "app", "globals.css"), "utf8");

  assert.match(css, /--site-max-width:\s*1180px/);
  assert.match(css, /\.site-shell\s*\{[^}]*width:\s*min\(var\(--site-max-width\),\s*calc\(100% - var\(--site-edge-space\) - var\(--site-edge-space\)\)\)/s);
  assert.match(css, /@media\s*\(min-width:\s*1440px\)[\s\S]*--site-max-width:\s*1360px/);
  assert.match(css, /@media\s*\(min-width:\s*1720px\)[\s\S]*--site-max-width:\s*1580px/);
  assert.match(css, /@media\s*\(max-width:\s*1100px\)[\s\S]*\.trace-header,[^}]*grid-template-columns:\s*1fr/);
  assert.match(css, /@media\s*\(max-width:\s*900px\)[\s\S]*\.global-search-grid,\s*\.document-grid\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*--site-edge-space:\s*10px/);
  assert.match(css, /@media\s*\(max-width:\s*480px\)[\s\S]*\.source-button-copy strong,\s*\.source-button-copy small\s*\{[^}]*white-space:\s*normal/);
  assert.match(css, /\.global-search-grid\s*\{[^}]*max-height:\s*clamp\([^}]*overscroll-behavior:\s*contain/s);
  assert.match(css, /\.document-grid\s*\{[^}]*max-height:\s*clamp\([^}]*overscroll-behavior:\s*contain/s);
});

test("normalizes every malformed pattern found in chronological source titles", async () => {
  const { formatSourceDisplayName } = await vite.ssrLoadModule("/app/source-display-name.ts");

  assert.equal(
    formatSourceDisplayName("VN response from City.Feb 29 2016.pdf"),
    "VN response from City Feb 29 2016.pdf",
  );
  assert.equal(
    formatSourceDisplayName("2018 IPP Screening - Monitoring Plan.180627modif.pdf"),
    "2018 IPP Screening - Monitoring Plan 180627modif.pdf",
  );
  assert.equal(
    formatSourceDisplayName("2025-03-05__Cadillac MAHL.msg.pdf · page 1", "PDF", true),
    "2025-03-05 Cadillac MAHL msg.pdf · page 1",
  );
  assert.equal(
    formatSourceDisplayName("2010-2016_Cadillac WWTP_District Compliance File.pdf · pages 93–94", "PDF", true),
    "2010-2016 Cadillac WWTP District Compliance File pdf · pages 93–94",
  );
  assert.equal(
    formatSourceDisplayName("2015-12-21 City incident notification — Grease B Gone discharge", "PDF", true),
    "2015-12-21 City incident notification — Grease B Gone discharge.pdf",
  );
  assert.equal(
    formatSourceDisplayName("2016-01-12 spill-notification letter · chronological compilation PDF p. 36", "PDF", true),
    "2016-01-12 spill-notification letter pdf · chronological compilation page 36",
  );
  assert.equal(
    formatSourceDisplayName("Rule 2210 Permit Template-Wexford Landfill.docx", "PDF", false),
    "Rule 2210 Permit Template-Wexford Landfill.docx",
  );
  assert.equal(
    formatSourceDisplayName("210303.biosolids.PACE.pdf", "PDF", true),
    "210303 biosolids.PACE.pdf",
  );
  assert.equal(
    formatSourceDisplayName("EGLE Cadillac WWTP PFAS Record.geojson", "GEOJSON", true),
    "EGLE Cadillac WWTP PFAS Record.geojson",
  );
});

test("uses independent media handlers for document and image formats", async () => {
  const { sourceDocumentUrl, sourceDownloadUrl, sourceInlineUrl, sourceMediaKind, sourcePreviewUrl } = await vite.ssrLoadModule("/app/source-media.ts");
  const repositoryAssetBase = "https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/a0ee86951939e0e9203f0c44829b13d89cf5d10e/public";
  const pinnedPdf = "https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/0355e48fffbcaaa07b108c2346423e3aeee32296/public/findings-docs/006-d8496c7348a6.pdf";

  assert.equal(sourceMediaKind("PDF"), "pdf");
  assert.equal(sourceMediaKind("HTML"), "html");
  assert.equal(sourceMediaKind("JPG"), "image");
  assert.equal(sourceMediaKind("PNG"), "image");
  assert.equal(sourceMediaKind("CSV"), "spreadsheet");
  assert.equal(sourceMediaKind("DOCX"), "office");
  assert.equal(sourcePreviewUrl({ format: "PNG", url: "/evidence/page.png" }), "/evidence/page.png");
  assert.equal(sourcePreviewUrl({ format: "PDF", url: "/evidence/report.pdf" }), undefined);
  assert.equal(sourceDocumentUrl("/evidence/page.html", "HTML", () => "wrong"), `${repositoryAssetBase}/evidence/page.html`);
  assert.equal(sourceDocumentUrl("/evidence/photo.jpg", "JPG", () => "wrong"), `${repositoryAssetBase}/evidence/photo.jpg`);
  assert.equal(sourceDocumentUrl("/evidence/report.docx", "DOCX", () => "wrong"), `${repositoryAssetBase}/evidence/report.docx`);
  assert.equal(sourceDocumentUrl("/evidence/report.pdf", "PDF", (url) => `${url}#page=2`), "/evidence/report.pdf#page=2");
  assert.equal(sourceDocumentUrl("https://example.org/page.html", "HTML", () => "wrong"), "https://example.org/page.html");
  const rawPinnedPdf = "https://raw.githubusercontent.com/BLAXWATER/cadillac-pfas-event-trace/0355e48fffbcaaa07b108c2346423e3aeee32296/public/findings-docs/006-d8496c7348a6.pdf";
  assert.equal(sourceInlineUrl(pinnedPdf, "PDF", (url) => `${url}#page=2&view=FitH`), `${rawPinnedPdf}#page=2&view=FitH`);
  assert.equal(sourceDownloadUrl(pinnedPdf, "PDF", (url) => `${url}#page=2`), rawPinnedPdf);
});

test("opens document records in the reader and exposes a dedicated download action", async () => {
  const page = await readFile(path.join(root, "app", "page.tsx"), "utf8");
  const bundledAssets = await readFile(path.join(root, "app", "bundled-public-assets.ts"), "utf8");

  assert.match(page, /className="source-button"[^>]*onClick=\{\(\) => linked && open\(source\)\}/);
  assert.match(page, /function DocumentPopoutButton/);
  assert.match(page, /className="document-preview-status">[^\n]*"First-page preview"/);
  assert.match(page, /<figcaption>Page 1 preview/);
  assert.doesNotMatch(page, /<iframe src=\{selectedViewerUrl\}/);
  assert.match(page, /download=\{selected\.name\}/);
  assert.match(bundledAssets, /import\.meta\.glob\("\.\.\/public\/first-page-previews\/\*\*\/\*\.webp"/);
  assert.match(bundledAssets, /export function bundledFirstPagePreview/);
  assert.match(bundledAssets, /ipp-docs\/007-9aecbfcf4abc\.pdf/);
  assert.match(bundledAssets, /ipp-docs\/125-9e67bc822d9c\.pdf/);
  assert.match(bundledAssets, /ipp-docs\/140-3db93feeaf81\.pdf/);
  assert.match(bundledAssets, /ipp-docs\/151-774fbfdfab32\.pdf/);
  assert.match(bundledAssets, /compliance-docs\/012-16dae2e386d4\.pdf/);
  assert.match(bundledAssets, /export function bundledDocumentDownload/);
  assert.match(page, /bundledDocumentDownload\(selected\.url\)/);
  assert.equal((page.match(/target="_blank"/g) ?? []).length, 1);
});

test("removes exactly the first period from every multi-period library filename", async () => {
  const { formatSourceDisplayName } = await vite.ssrLoadModule("/app/source-display-name.ts");
  const documentFiles = (await readdir(path.join(root, "app")))
    .filter((name) => name.endsWith("-documents.json"));
  const records = (await Promise.all(documentFiles.map(async (name) =>
    JSON.parse(await readFile(path.join(root, "app", name), "utf8")),
  ))).flat();
  const multiPeriodRecords = records.filter((record) =>
    typeof record.name === "string" && (record.name.match(/\./g) ?? []).length > 1,
  );

  assert.equal(records.length, 1562);
  assert.equal(multiPeriodRecords.length, 196);

  for (const record of multiPeriodRecords) {
    const displayName = formatSourceDisplayName(record.name, record.format, true);
    const rawPeriods = (record.name.match(/\./g) ?? []).length;
    const displayPeriods = (displayName.match(/\./g) ?? []).length;

    assert.equal(displayPeriods, rawPeriods - 1, record.name);
  }
});

test("forwards progress semantics to the primitive", async () => {
  const { Progress } = await vite.ssrLoadModule("/components/ui/progress.tsx");
  const html = renderToStaticMarkup(React.createElement(Progress, { value: 37 }));

  assert.match(html, /aria-valuenow="37"/);
  assert.match(html, /aria-valuetext="37%"/);
  assert.match(html, /data-state="loading"/);
});

test("emits chart themes for the starter's media dark mode", async () => {
  const { ChartStyle } = await vite.ssrLoadModule("/components/ui/chart.tsx");
  const html = renderToStaticMarkup(
    React.createElement(ChartStyle, {
      id: "contract",
      config: {
        latency: { theme: { light: "#ffffff", dark: "#000000" } },
      },
    }),
  );

  assert.match(html, /\[data-chart=contract\]/);
  assert.match(html, /@media \(prefers-color-scheme: dark\)/);
  assert.doesNotMatch(html, /\.dark/);
});

test("renders sidebar skeletons deterministically", async () => {
  const { SidebarMenuSkeleton } = await vite.ssrLoadModule(
    "/components/ui/sidebar.tsx",
  );
  const first = renderToStaticMarkup(React.createElement(SidebarMenuSkeleton));
  const second = renderToStaticMarkup(React.createElement(SidebarMenuSkeleton));

  assert.equal(first, second);
  assert.match(first, /--skeleton-width:70%/);
});
