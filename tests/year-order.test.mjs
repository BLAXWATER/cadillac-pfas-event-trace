import assert from "node:assert/strict";
import test from "node:test";

test("year navigation and timeline run from newest year to oldest year", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200);

  const html = await response.text();
  const yearNavigation = html.match(/<nav class="year-nav"[\s\S]*?<\/nav>/)?.[0] ?? "";
  const navigationYears = [...yearNavigation.matchAll(/href="#year-(\d+)"/g)].map((match) => Number(match[1]));
  const timelineYears = [...html.matchAll(/<section class="year-group" id="year-(\d+)"/g)].map((match) => Number(match[1]));

  assert.ok(navigationYears.length > 1);
  assert.deepEqual(navigationYears, [...navigationYears].sort((a, b) => b - a));
  assert.deepEqual(timelineYears, [...timelineYears].sort((a, b) => b - a));
  assert.equal(navigationYears[0], Math.max(...navigationYears));
  assert.equal(navigationYears.at(-1), Math.min(...navigationYears));
});
