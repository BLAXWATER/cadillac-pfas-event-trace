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
