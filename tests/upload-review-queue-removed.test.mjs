import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the public site does not render an upload review queue", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const renderedSource = `${page}\n${styles}`;

  assert.doesNotMatch(renderedSource, /Upload review queue/i);
  assert.doesNotMatch(renderedSource, /FILE INTAKE STATUS/i);
  assert.doesNotMatch(renderedSource, /ORDERED FILE INTAKE/i);
  assert.doesNotMatch(renderedSource, /upload-queue/);
  assert.doesNotMatch(page, /uploadReviewQueue/);
});
