import { loadDocumentRecords, loadDownloadDeliveryPlan } from "./document-download-integrity.mjs";
import { createHash } from "node:crypto";

const concurrency = Math.max(1, Number(process.env.DOWNLOAD_AUDIT_CONCURRENCY ?? 12));
const timeoutMs = Math.max(1_000, Number(process.env.DOWNLOAD_AUDIT_TIMEOUT_MS ?? 30_000));
const records = await loadDocumentRecords();
const deliveries = (await loadDownloadDeliveryPlan(records)).filter((entry) => entry.kind === "archive");
const failures = [];
let cursor = 0;

async function inspect(delivery) {
  const { row, source } = delivery;

  const response = await fetch(source.rawUrl, {
    method: "HEAD",
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "User-Agent": "cadillac-pfas-anonymous-integrity-audit" },
  });
  if (response.status >= 300 && response.status < 400) {
    return `${row.catalog}:${row.id} redirects (${response.status}) to ${response.headers.get("location") ?? "an unknown location"}`;
  }
  if (!response.ok) return `${row.catalog}:${row.id} returned HTTP ${response.status}`;
  if (response.url && new URL(response.url).hostname !== "raw.githubusercontent.com") {
    return `${row.catalog}:${row.id} resolved to an unexpected host: ${response.url}`;
  }
  const length = Number(response.headers.get("content-length"));
  if (!Number.isFinite(length)) return `${row.catalog}:${row.id} omitted Content-Length`;
  if (length !== row.size) {
    const bodyResponse = await fetch(source.rawUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "cadillac-pfas-anonymous-integrity-audit" },
    });
    if (!bodyResponse.ok) return `${row.catalog}:${row.id} verification GET returned HTTP ${bodyResponse.status}`;
    const body = Buffer.from(await bodyResponse.arrayBuffer());
    if (body.length !== row.size) return `${row.catalog}:${row.id} decoded public size ${body.length} != ${row.size}`;
    const hash = createHash("sha256").update(body).digest("hex");
    if (hash !== row.sha256) return `${row.catalog}:${row.id} decoded public SHA-256 mismatch`;
  }
  return undefined;
}

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= deliveries.length) return;
    const delivery = deliveries[index];
    try {
      const failure = await inspect(delivery);
      if (failure) failures.push(failure);
    } catch (error) {
      const { row } = delivery;
      failures.push(`${row.catalog}:${row.id} request failed: ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, deliveries.length) }, () => worker()));

if (failures.length) {
  console.error(`Anonymous download integrity FAILED: ${failures.length} of ${deliveries.length} public archive deliveries.`);
  for (const failure of failures.slice(0, 25)) console.error(`- ${failure}`);
  if (failures.length > 25) console.error(`- ... ${failures.length - 25} more`);
  process.exitCode = 1;
} else {
  console.log(`Anonymous download integrity passed: ${deliveries.length} of ${deliveries.length} public archive deliveries returned directly with matching sizes.`);
}
