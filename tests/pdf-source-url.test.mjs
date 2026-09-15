import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  cacheDir: `${root}/.sites-runtime/test-cache/pdf-source-url`,
  optimizeDeps: { noDiscovery: true, include: [] },
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true, hmr: false },
});

after(async () => {
  await vite.close();
});

const complianceUrl = "https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/efa59ca098bc5d59adef6edd8705cd336b9fd601/public/compliance-docs/020-9d6ad860baaf.pdf";
const { repositorySourceUrl } = await vite.ssrLoadModule("/app/source-url.ts");
const repositoryAssetBase = repositorySourceUrl("/lab-docs/example.pdf").replace(/\/lab-docs\/example\.pdf$/, "");

test("verified blank first pages start on page 2", async () => {
  const { pdfSourceKey, resolvePdfStartPage, withPdfStartPage } = await vite.ssrLoadModule("/app/pdf-source-url.ts");
  const key = pdfSourceKey(complianceUrl);
  const verifiedBlank = { [key]: 2 };

  assert.equal(resolvePdfStartPage(complianceUrl, undefined, verifiedBlank), 2);
  assert.equal(withPdfStartPage(complianceUrl, undefined, false, verifiedBlank), `${complianceUrl}#page=2`);
});

test("explicit source pages are preserved over the blank-page fallback", async () => {
  const { pdfSourceKey, resolvePdfStartPage, withPdfStartPage } = await vite.ssrLoadModule("/app/pdf-source-url.ts");
  const key = pdfSourceKey(complianceUrl);
  const verifiedBlank = { [key]: 2 };
  const pageNinetyThree = `${complianceUrl}#page=93`;

  assert.equal(resolvePdfStartPage(pageNinetyThree, undefined, verifiedBlank), 93);
  assert.equal(withPdfStartPage(pageNinetyThree, undefined, true, verifiedBlank), `${complianceUrl}#page=93&view=FitH&toolbar=1`);
});

test("viewer parameters use one fragment and normal PDFs remain on page 1", async () => {
  const { withPdfStartPage } = await vite.ssrLoadModule("/app/pdf-source-url.ts");
  const localPdf = "/lab-docs/example.pdf";
  const viewerUrl = withPdfStartPage(localPdf, undefined, true);

  assert.equal(viewerUrl, `${repositoryAssetBase}/lab-docs/example.pdf#page=1&view=FitH&toolbar=1`);
  assert.equal((viewerUrl.match(/#/g) ?? []).length, 1);
  assert.equal(withPdfStartPage(localPdf), `${repositoryAssetBase}/lab-docs/example.pdf`);
  assert.equal(withPdfStartPage("/maps/example.png"), `${repositoryAssetBase}/maps/example.png`);
});

test("transferred repository URLs use the current organization without changing the pinned source commit", async () => {
  const { withPdfStartPage } = await vite.ssrLoadModule("/app/pdf-source-url.ts");
  const transferred = "https://github.com/cazey43/cadillac-pfas-event-trace/blob/0355e48fffbcaaa07b108c2346423e3aeee32296/public/findings-docs/006-d8496c7348a6.pdf#page=2";

  assert.equal(
    withPdfStartPage(transferred),
    "https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/0355e48fffbcaaa07b108c2346423e3aeee32296/public/findings-docs/006-d8496c7348a6.pdf#page=2",
  );
});

test("May 2018 timeline and catalog citations resolve to the same verified original", async () => {
  const { withPdfStartPage } = await vite.ssrLoadModule("/app/pdf-source-url.ts");
  const { sourceDownloadUrl, sourceInlineUrl } = await vite.ssrLoadModule("/app/source-media.ts");
  const { readFile } = await import("node:fs/promises");
  const records = JSON.parse(await readFile(new URL("../app/supplemental-documents.json", import.meta.url), "utf8"));
  const record = records.find((item) => item.id === "045-25d3c10b9ea8");
  assert.equal(record.sha256, "25d3c10b9ea8697bb69779ea5341633f7c3326eca5f8130278188bd1cb388d88");
  const path = "/findings-docs/045-25d3c10b9ea8.pdf";
  const raw = "https://raw.githubusercontent.com/BLAXWATER/cadillac-pfas-event-trace/4535081d2398301cd01bb92501f2fc2e1a83e3ed/public" + path;
  assert.equal(sourceDownloadUrl(record.url, "PDF", withPdfStartPage), raw);
  for (const page of [9, 57, 148, 157]) {
    const withPage = (url) => withPdfStartPage(url, page);
    assert.equal(sourceDownloadUrl(path, "PDF", withPage), raw);
    assert.equal(sourceInlineUrl(path, "PDF", withPage), raw + "#page=" + page);
  }
  assert.equal(sourceDownloadUrl("https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/07c302dfa7d4d686ef72973070bcd81667757ba3/public" + path, "PDF", withPdfStartPage), raw);
});
