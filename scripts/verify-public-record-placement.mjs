import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyRecordPlacement } from "./record-placement-integrity.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const defaultSiteUrl = "https://cadillac-pfas-event-trace.icons-7120.chatgpt.site/";
const siteUrl = new URL(process.argv[2] ?? process.env.SITE_URL ?? defaultSiteUrl);
const pageResponse = await fetch(siteUrl, { redirect: "error", headers: { "cache-control": "no-cache" } });
if (!pageResponse.ok) throw new Error(`Public site returned ${pageResponse.status}`);
const page = await pageResponse.text();
const manifestReference = page.match(/data-placement-manifest-url="([^"]+)"/)?.[1]?.replaceAll("&amp;", "&");
if (!manifestReference) throw new Error("Public site does not expose its placement manifest URL");
const target = new URL(manifestReference, siteUrl);
const response = await fetch(target, { redirect: "error", headers: { "cache-control": "no-cache" } });
if (!response.ok) throw new Error(`Public placement manifest returned ${response.status}`);
const contentType = response.headers.get("content-type") ?? "";
if (!contentType.toLowerCase().includes("application/json")) throw new Error(`Public placement manifest returned ${contentType || "no content type"}`);
const publicManifest = await response.json();
const { manifest: expected, failures } = await verifyRecordPlacement();
if (failures.length) throw new Error(`Local placement audit failed before public comparison: ${failures.join("; ")}`);

const expectedJson = JSON.stringify(expected);
const publicJson = JSON.stringify(publicManifest);
if (publicJson !== expectedJson) {
  const artifact = await readFile(path.join(root, "public", "record-placement-manifest.json"), "utf8");
  if (JSON.stringify(JSON.parse(artifact)) !== expectedJson) throw new Error("Bundled placement manifest is stale");
  throw new Error("Published placement manifest does not match the validated source catalog");
}
console.log(`Public placement integrity passed: ${publicManifest.recordCount} records in ${publicManifest.archiveCount} archive blocks at ${siteUrl.origin}.`);
