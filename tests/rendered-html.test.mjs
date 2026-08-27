import assert from "node:assert/strict";
import test from "node:test";

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
  assert.match(html, /Original-source rule/i);
  assert.match(html, /Hover a filename for its source-page preview and result/i);
  assert.doesNotMatch(html, /Original file not loaded/i);
});
