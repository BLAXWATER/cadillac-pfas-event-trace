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
  assert.match(css, /\.event-card h3\{[^}]*white-space:nowrap/);
  assert.match(css, /--font-11pt:\s*14\.667px/);
  assert.match(css, /--font-12pt:\s*16px/);
  assert.match(css, /--font-14pt:\s*18\.667px/);
  assert.match(css, /font-size:clamp\(var\(--font-11pt\),\s*var\(--event-title-fit,\s*22px\),\s*33px\)/);
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
    "2010-2016 Cadillac WWTP District Compliance File.pdf · pages 93–94",
  );
  assert.equal(
    formatSourceDisplayName("2015-12-21 City incident notification — Grease B Gone discharge", "PDF", true),
    "2015-12-21 City incident notification — Grease B Gone discharge.pdf",
  );
  assert.equal(
    formatSourceDisplayName("2016-01-12 spill-notification letter · chronological compilation PDF p. 36", "PDF", true),
    "2016-01-12 spill-notification letter.pdf · chronological compilation page 36",
  );
  assert.equal(
    formatSourceDisplayName("Rule 2210 Permit Template-Wexford Landfill.docx", "PDF", false),
    "Rule 2210 Permit Template-Wexford Landfill.docx",
  );
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
