import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { verifyRecordPlacement } from "./record-placement-integrity.mjs";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const toCrlf = (value) => value.replace(/\r?\n/g, "\r\n");
const writeJson = async (path, value) => writeFile(path, toCrlf(`${JSON.stringify(value, null, 2)}\n`));
const fingerprint = (record) => createHash("sha256").update(JSON.stringify(record)).digest("hex");
const reviewedAt = "2026-09-23T12:57:54-04:00";
const assetCommit = "c9400bd935317e0a8868688d08e7492a53839854";
const pinned = (id) => `https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/${assetCommit}/public/findings-docs/${id}.pdf`;

const records = [
  {
    id: "224-86da7f5f48ee",
    name: "EPA Second Five-Year Review - Northernaire Plating Superfund Site - July 26, 2000.pdf",
    url: pinned("224-86da7f5f48ee"),
    year: "2000",
    category: "Groundwater & hydrogeology - Superfund remedy review",
    type: "EPA five-year review",
    format: "PDF",
    pages: 8,
    size: 381753,
    sha256: "86da7f5f48ee2d85f16358aa0fc32d61930ef90fd8c39d8263a5441c6bf38254",
    description: "EPA Region 5's signed July 26, 2000 second five-year review for the Northernaire Plating site. It recounts the 1983 removal, 1985 source-control decision and 1989 groundwater remedy, describes the joint 18-well extraction/treatment system, and reports then-current containment, declining concentrations and no identified deficiencies (PDF pp. 2-7). EPA found the remedy protective at that review date while recommending continued operation, trend analysis and optimization (pp. 7-8). All eight pages were read and visually checked; the page 3 map received supplemental OCR review. This dated chromium/VOC remedy finding is not PFAS evidence or proof of a present Plett Road pathway."
  },
  {
    id: "226-84aea6725dbf",
    name: "EPA Kysor Industrial Administrative Record, Sampling and Guidance Index - July 12, 1989.pdf",
    url: pinned("226-84aea6725dbf"),
    year: "1989",
    category: "Reference records - Superfund administrative index",
    type: "EPA administrative-record index",
    format: "PDF",
    pages: 7,
    size: 160809,
    sha256: "84aea6725dbf33aa9abc153a6bfb8a0e313e3a4363a41bc12fa7f3e52e6ed99f",
    description: "EPA Region 5's July 12, 1989 Kysor administrative-record, sampling-data, guidance-document and acronym index. It identifies underlying records such as the May 1988 potential-liability notice, Cadillac-area RI/FS materials, monitoring-well logs and CLP sampling results (PDF pp. 1-7), but those source records are not attached here. All seven pages were read and visually checked; the weak final page received supplemental OCR review. This index is a provenance and acquisition guide, not independent proof of the listed records' substantive findings."
  },
  {
    id: "227-5e0b1f03162b",
    name: "EPA Review of Cadillac Regional Area Risk Assessment - May 24, 1988.pdf",
    url: pinned("227-5e0b1f03162b"),
    year: "1988",
    category: "Groundwater & hydrogeology - technical review",
    type: "EPA risk-assessment technical memorandum",
    format: "PDF",
    pages: 6,
    size: 220393,
    sha256: "5e0b1f03162b36704e30ccb866312f4c2922531ed4eae6a6ece3167d2f0ae70c",
    description: "EPA Office of Research and Development's May 24, 1988 technical review of the Cadillac regional-area risk assessment. The reviewer states that missing chapters and hydrogeologic material constrained the review (PDF p. 1), questions several chemical exclusions and surrogate assumptions (pp. 1-2), and criticizes the one-dimensional homogeneous/isotropic transport model while recommending more site-specific treatment of groundwater, surface-water discharge and aquitard conditions (pp. 3-4). Pages 5-6 preserve chemical-property tables. All six pages were read and visually checked. The memorandum identifies model limitations; it does not itself establish a corrected plume, PFAS source or route to Plett Road."
  },
  {
    id: "228-1fa07d99d00e",
    name: "Four Star Corporation Hydrogeologic Investigation Report - August 1983.pdf",
    url: pinned("228-1fa07d99d00e"),
    year: "1983",
    category: "Groundwater & hydrogeology - industrial site investigation",
    type: "Hydrogeologic investigation and laboratory report",
    format: "PDF",
    pages: 88,
    size: 5294043,
    sha256: "1fa07d99d00e2d0c1c4fd9e43a3e497ca740e08a5dac6e4853d025f49358cca8",
    description: "Gosling Czubak Associates' August 1983 hydrogeologic investigation for the former Four Star facility in Cadillac. The report documents 11 borings and 10 monitoring wells, predominantly sandy materials with discontinuous clay lenses, groundwater about 30 feet below ground, and a north-to-northwest flow interpretation with an estimated 0.17% gradient and 50-75 feet/year average velocity (PDF pp. 25, 40-44). It reports high historical TCE/PCE in several wells and interprets the plume as moving north with its leading edge still undefined (pp. 11-12, 29-32). All 88 pages, laboratory sheets, agency correspondence, logs and maps were read and visually checked. Sparse pages and the degraded map series received OCR/manual review; fine map annotations remain unreadable and an internal MW1/MW4 result-label discrepancy is preserved. This historical VOC investigation does not establish PFAS, impact to municipal wells, or a pathway to Plett Road."
  }
];

const previewHashes = {
  "224-86da7f5f48ee": "7613fd1ce99935b9e5888c2e33a18c1fe2be7977043c3edf2826f5eb746e6fc8",
  "226-84aea6725dbf": "95152f4f99ee4e2e3577f9bcb4e0d551f405ff5448ac6d33337dcfe0074dfcdf",
  "227-5e0b1f03162b": "0370596092b37f8ebd6baf0507e3017606dbc3037ee8f31be3950082c9091377",
  "228-1fa07d99d00e": "41cb56f61e4f990df70627fdba42658b46226b9036fff7d8102fc10269a5a0e0"
};

const supplemental = await readJson("app/supplemental-documents.json");
const canonical087 = supplemental.find((record) => record.id === "087-31f27263ba22");
if (canonical087) canonical087.description = "EPA Region 5's signed July 26, 2000 first five-year review for the Kysor site. It describes the 18-well groundwater remedy, then-current containment and declining VOC/chromium concentrations, the corrected 1997 carbon-breakthrough episode, and recommends continued operation, trend analysis, optimization and coordination with neighboring sources (PDF pp. 3, 5-8). EPA found the remedy protective at that review date (p. 8 of the canonical copy). The alternate nine-page EPA rendition supplied in Batch 3 adds only a records-center cover and is preserved without a duplicate card. This dated chromium/VOC review is not PFAS evidence or proof of a present Plett Road pathway.";
for (const record of records) {
  const index = supplemental.findIndex((item) => item.sha256 === record.sha256);
  if (index >= 0) supplemental[index] = record;
  else supplemental.push(record);
}
await writeJson("app/supplemental-documents.json", supplemental);

const previewManifest = await readJson("app/first-page-preview-manifest.json");
const provenance = await readJson("app/document-preview-provenance.json");
const activity = await readJson("app/record-activity.json");
for (const record of records) {
  const preview = `/first-page-previews/by-sha256/${previewHashes[record.id]}.webp`;
  previewManifest[`/findings-docs/${record.id}.pdf`] = preview;
  provenance[`/findings-docs/${record.id}.pdf`] = {
    sourceSha256: record.sha256,
    page: 1,
    preview,
    previewSha256: previewHashes[record.id],
    verifiedAt: reviewedAt,
    verificationMethod: "Actual first PDF page rendered during the complete page-order review; full page preserved.",
    scope: "Preview provenance only; whole-document verification is recorded in the Batch 3 intake audit."
  };
  activity.records[record.url] = { addedAt: reviewedAt, fingerprint: fingerprint(record) };
}
for (const id of ["087-31f27263ba22", "095-b7620af87938", "200-07119f8b3cdf"]) {
  const record = supplemental.find((item) => item.id === id);
  if (record) activity.records[record.url] = { ...(activity.records[record.url] ?? {}), updatedAt: reviewedAt, fingerprint: fingerprint(record) };
}
await writeJson("app/first-page-preview-manifest.json", previewManifest);
await writeJson("app/document-preview-provenance.json", provenance);
await writeJson("app/record-activity.json", activity);

const audit = {
  auditVersion: 1,
  intake: "EPA DOCS six-micro-batch intake",
  batch: "EPA-2026-09-23-B3",
  batchNumber: 3,
  totalBatches: 6,
  sourceOrderPreserved: true,
  reviewedAt,
  sourceAssetCommit: assetCommit,
  sourceAssetBranch: "epa-intake-batch-3",
  rules: { recordBoundariesPreserved: true, pageOrderReviewRequired: true, filenameOnlyDeduplicationProhibited: true, statusesSeparated: true },
  totals: { records: 7, pages: 162, exactExistingRecords: 1, alternateRenditions: 2, newDistinctRecords: 4 },
  records: [
    { supplied: "EPA_05_159280.pdf", sourceUrl: pinned("223-b7dffe19c91d"), sha256: "b7dffe19c91d8e93afb945495e9c25fc59fb9eb900a66b174ebb89b34bd83807", bytes: 392487, pages: 9, ocrCheckedPages: [4], disposition: "alternate-rendition-canonical-reused", canonicalRecordId: "087-31f27263ba22", statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: true } },
    { supplied: "EPA_05_159310.pdf", sha256: records[0].sha256, bytes: 381753, pages: 8, ocrCheckedPages: [3], disposition: "new-distinct-record", canonicalRecordId: records[0].id, statuses: { received: true, extracted: true, reviewed: true, verified: true, published: false } },
    { supplied: "EPA_05_209538.pdf", sha256: "07119f8b3cdf21d9a7786054a6ae4d3ffb1bca65a4661860e250299e8586fef4", bytes: 1121333, pages: 24, ocrCheckedPages: [], disposition: "exact-existing-record", canonicalRecordId: "200-07119f8b3cdf", statuses: { received: true, extracted: true, reviewed: true, verified: true, published: true } },
    { supplied: "EPA_05_209675.pdf", sourceUrl: pinned("225-8390f3bec949"), sha256: "8390f3bec9498430802aa92214312684da1df551b3f26261b03a9243f7382642", bytes: 854953, pages: 20, ocrCheckedPages: [11], disposition: "alternate-reduced-reordered-rendition-canonical-reused", canonicalRecordId: "095-b7620af87938", statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: true } },
    { supplied: "EPA_05_234872.pdf", sha256: records[1].sha256, bytes: 160809, pages: 7, ocrCheckedPages: [7], disposition: "new-distinct-record", canonicalRecordId: records[1].id, statuses: { received: true, extracted: true, reviewed: true, verified: true, published: false } },
    { supplied: "EPA_05_234874.pdf", sha256: records[2].sha256, bytes: 220393, pages: 6, ocrCheckedPages: [], disposition: "new-distinct-record", canonicalRecordId: records[2].id, statuses: { received: true, extracted: true, reviewed: true, verified: true, published: false } },
    { supplied: "EPA_05_234875.pdf", sha256: records[3].sha256, bytes: 5294043, pages: 88, ocrCheckedPages: [7,22,33,34,36,38,49,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88], disposition: "new-distinct-record", canonicalRecordId: records[3].id, statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: false } }
  ],
  limitations: [
    "Historical chromium and VOC findings do not independently establish PFAS source attribution or a present pathway to Plett Road.",
    "The Four Star report's degraded maps and handwritten logs are not character-perfect; its internal MW1/MW4 result-label discrepancy remains explicit.",
    "The administrative index identifies acquisition targets but does not substitute for the underlying records.",
    "No evidence-request requirement closes in this batch."
  ]
};
await writeJson("app/epa-docs-six-batch-intake-audit-b3-2026-09-23.json", audit);

const queue = await readJson("app/evidence-request-queue-updates.json");
queue.scope = "September 23 now includes full page-order review and reconciliation of EPA micro-batches 1-3, plus the Wexford Permit 4127-to-License 9758 monitoring-document trace. This is an incremental source-chain review, not a fresh reread of the whole repository.";
queue.note = "EPA micro-batch 3 adds four distinct historical records and reconciles one exact existing record plus two alternate renditions without duplicate cards. The 1983 Four Star investigation supplies measured historical industrial-park hydrogeology and VOC results, but its plume edge remained unresolved and it does not extend to Plett Road or PFAS. One local construction/lithology requirement remains satisfied; 22 requests remain open.";
const pathway = queue.blocks.find((block) => block.requestId === "subsurface-pathway");
pathway.held.unshift({
  id: "september23-epa-batch3-four-star-hydrogeology",
  finding: "The August 1983 Four Star investigation records 11 borings and 10 monitoring wells, sandy materials with discontinuous clay lenses, groundwater about 30 feet below ground, a north-to-northwest flow interpretation, an estimated 0.17% gradient and 50-75 feet/year average velocity. It reports high historical TCE/PCE and says the plume moved north while its leading edge remained undefined. EPA's May 1988 review separately criticizes reliance on a one-dimensional homogeneous/isotropic model and asks for more site-specific analysis.",
  limitation: "These are historical industrial-park VOC records. The Four Star map sheets are degraded, vertical extent and leading edge were unresolved, and neither record identifies 1140 Plett, PFAS, a Plett-inclusive synoptic round, Plett-linked hydraulic tests or a source-to-Plett potentiometric map. No requirement is closed.",
  sources: [
    { recordId: "228-1fa07d99d00e", sha256: "1fa07d99d00e2d0c1c4fd9e43a3e497ca740e08a5dac6e4853d025f49358cca8", label: "Four Star hydrogeologic investigation - pp25,29-32,40-44", pages: [25,29,30,31,32,40,41,42,43,44] },
    { recordId: "227-5e0b1f03162b", sha256: "5e0b1f03162b36704e30ccb866312f4c2922531ed4eae6a6ece3167d2f0ae70c", label: "EPA constrained risk-assessment review - pp1-4", pages: [1,2,3,4] }
  ],
  requirementIds: ["surveyed-elevations-water-levels", "local-hydraulic-tests", "site-specific-groundwater-map"]
});
await writeJson("app/evidence-request-queue-updates.json", queue);

const placementResult = await verifyRecordPlacement({ writeManifest: true });
if (placementResult.failures.length) throw new Error(`Placement reconciliation failed: ${placementResult.failures.join("; ")}`);
await writeFile("public/record-placement-manifest.json", toCrlf(await readFile("public/record-placement-manifest.json", "utf8")));
console.log(JSON.stringify({ added: records.map((record) => record.id), assetCommit, queueOpen: 22 }, null, 2));
