import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { verifyRecordPlacement } from "./record-placement-integrity.mjs";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const toCrlf = (value) => value.replace(/\r?\n/g, "\r\n");
const writeJson = async (path, value) => writeFile(path, toCrlf(`${JSON.stringify(value, null, 2)}\n`));
const fingerprint = (record) => createHash("sha256").update(JSON.stringify(record)).digest("hex");
const reviewedAt = "2026-09-23T17:07:00-04:00";
const publishedAt = "2026-09-23T18:38:52.510347Z";
const assetCommit = "4ee5c25769f776b209a7377a3aca33e765ebc722";
const pinned = (id) => `https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/${assetCommit}/public/findings-docs/${id}.pdf`;

const records = [
  {
    id: "241-a1a92819d01c", name: "EPA Proposed Plan Fact Sheet - Kysor and Northernaire Cleanup Action Recommended - July 1989.pdf", url: pinned("241-a1a92819d01c"), year: "1989", category: "Groundwater & hydrogeology - proposed remedy", type: "EPA proposed-plan fact sheet", format: "PDF", pages: 8, size: 2379611, sha256: "a1a92819d01c76854d49474f3b41a9389a5158b8203179dbb99184db13ae2110",
    description: "EPA Region 5's July 1989 proposed-plan fact sheet for Kysor and Northernaire. It summarizes historical VOC/chromium investigation, lists proposed extraction/treatment and soil alternatives, and identifies GW Alternative 3A plus Kysor Soil Alternative 5 as EPA's preferred proposal (PDF pp. 2-5). The sheet expressly says final selection awaited public comment (pp. 1, 5, 7-8); conceptual wells, Clam River discharge, costs and 64-year groundwater duration are proposals/estimates, not approved construction or operations. All eight pages were read and visually checked, with noisy text on pp. 3, 7 and 8 verified against the images. Underlying RI/FS, risk data, complete Proposed Plan, comments and ROD are separate records. No PFAS, Wexford, Plett Road or WWTP/leachate evidence appears."
  },
  {
    id: "242-39d329816200", name: "Mayor Becker Letter Supporting Cadillac Cogeneration Groundwater Proposal - August 7, 1989.pdf", url: pinned("242-39d329816200"), year: "1989", category: "Correspondence - municipal public comment", type: "Mayor's public-comment letter", format: "PDF", pages: 2, size: 65325, sha256: "39d329816200bf14e9dd9351db7457cd0a56906a1834c344ab8f31264cbbe708",
    description: "Signed August 7, 1989 letter from Cadillac Mayor Darrell D. Becker to EPA. The Mayor reports the City's role in a proposed wood-fired cogeneration/air-stripping project, anticipated ground-breaking, special-assessment planning and City land/funding, and asks EPA/MDNR to recognize that proposal as preferred (PDF pp. 1-2). Both pages were read and visually checked. These are municipal claims and advocacy, not independent proof of approval, financing, construction or operation; the supporting study, PSC order, financing, construction and agency-approval records are absent. This is distinct from the City's separate courthouse statement of the same date."
  },
  {
    id: "243-ae0517acffe3", name: "Cadillac Area Groundwater Contamination Final Draft Feasibility Study - June 1989.pdf", url: pinned("243-ae0517acffe3"), year: "1989", category: "Groundwater & hydrogeology - final draft feasibility study", type: "CERCLA feasibility study", format: "PDF", pages: 374, size: 14175851, sha256: "ae0517acffe329e9f190ae8c40dd37a4a8aa739788bbff370e5f3ca89dc22c53",
    description: "E.C. Jordan's June 1989 FINAL DRAFT Cadillac Area Groundwater Contamination Feasibility Study for MDNR. It carries historical VOC/chromium alternatives into detailed engineering, cost, monitoring and risk comparisons and includes Appendices A-G. Proposed systems include seven modeled extraction-well series and treatment/discharge alternatives; the report repeatedly qualifies pumping rates, cleanup times and volumes as design/model outputs dependent on assumptions and later monitoring (PDF pp. 134-241, 303-309, 363-370). Community and State acceptance awaited public review and the ROD, and conceptual costs carried approximately -30%/+50% uncertainty (pp. 125-126). All 374 physical pages, maps, tables and appendices were read and visually checked. EPA's 1989 index says 375 pages; the unresolved one-page discrepancy is preserved. This is not the signed ROD, proof of construction/operation, PFAS evidence or a Wexford-to-Plett pathway."
  },
  {
    id: "244-dc9a86606a0a", name: "Kysor Comments on Cadillac Industrial Park RI-FS and Proposed Plan - August 26, 1989.pdf", url: pinned("244-dc9a86606a0a"), year: "1989", category: "Groundwater & hydrogeology - responsible-party comments", type: "RI/FS and proposed-plan comments with exhibits", format: "PDF", pages: 129, size: 5071744, sha256: "dc9a86606a0a3a887e64ff26ea34a727662a20af29f3634ea0502a0ff5647343",
    description: "Kysor Industrial Corporation's August 26, 1989 comments on the Cadillac RI/FS and Proposed Plan, with five top-level exhibits. Kysor disputes risk, ARAR, cleanup-level, flow/cost and remedy assumptions; advocates modeling and a cogeneration/purge/air-stripping proposal; and presents historical hydrogeologic material and remedy analogies (PDF pp. 5-44, 45-129). Proposed 5,000-gpm purge, 4,400-gpm Clam River discharge and anticipated construction are party proposals/estimates, not proof of approval or operation (pp. 28-30, 39-44). Exhibit C reports a 1983 municipal Well 7 test, but it is not Plett/Wexford testing or PFAS evidence (pp. 73-75). All 129 pages were read and visually checked; targeted OCR covered weak/divider/map pages. The p. 69 letter's nested census enclosures are not separately identifiable. Claims remain attributed to Kysor/consultants, not agency findings."
  },
  {
    id: "245-edb84888823f", name: "EPA Kysor Administrative Record Update 2 and 1998 Addendum Index.pdf", url: pinned("245-edb84888823f"), year: "1998", category: "Reference records - Superfund administrative index", type: "EPA administrative-record index/addendum", format: "PDF", pages: 1, size: 15092, sha256: "edb84888823fd41802330d5d398d74cab31a5f6db66fec3b1d478965e0f02296",
    description: "One-page EPA Kysor administrative-record Update 2/addendum. It lists a March 3, 1994 Explanation of Significant Difference and an April 30, 1998 Administrative Order Compliance Status and Closure record, each printed as 21 pages. The full 1994 ESD is separately preserved as canonical record 095-b7620af87938 with 22 PDF pages; the count discrepancy remains explicit. The 1998 closure record is not attached and remains an acquisition lead. This exact one-page index was previously reviewed under another supplied filename but had no public asset; it is published once here without substituting it for either underlying record."
  }
];

const previewHashes = {
  "241-a1a92819d01c": "ea818dd06f18cb5cf2036a4b6d2155bf9666e7493ba5a12926896ce96ec46343",
  "242-39d329816200": "ccff3af673a5506d4a8716ddfa03b42fcb990c5ab53d3bcb2903c02452cb8fa3",
  "243-ae0517acffe3": "e7c9e3e0bc7b280f6919938461635ddb1260e59044493e9be4bb4891e1089e37",
  "244-dc9a86606a0a": "c0bc4f289d55b4cd0342c280cf0e116fdbba5272c82739de38a8214b4e33fb77",
  "245-edb84888823f": "744e4feaac2f310a8e980e2a7a99ca2a6c691900cb34890f0a87acfe61e9800e"
};

const supplemental = await readJson("app/supplemental-documents.json");
const indexRecord = supplemental.find((record) => record.id === "202-82254e0c3a95");
if (indexRecord) indexRecord.description = "October 16, 1989 Update 1 lists 15 Kysor/Cadillac groundwater records. Supplied originals now resolve entries 1-2, 4-11 and 13-14. Entry 4's cover letter and entry 14's complete 129-page enclosure remain separate records. Entry 13's Final Draft FS is physically 374 pages although the index says 375. The remaining unsupplied originals are entry 3's August 24 letter, entry 12's 66-page hearing transcript and entry 15's 120-page ROD. The index is retrieval metadata, not proof of those records' substance.";
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
  previewManifest[record.url] = preview;
  provenance[record.url] = { sourceSha256: record.sha256, page: 1, preview, previewSha256: previewHashes[record.id], verifiedAt: reviewedAt, verificationMethod: "Actual first PDF page rendered during complete page-order review; full page preserved.", scope: "Preview provenance only; whole-document verification is recorded in the Batch 6 intake audit." };
  activity.records[record.url] = { addedAt: reviewedAt, fingerprint: fingerprint(record) };
}
if (indexRecord) activity.records[indexRecord.url] = { ...(activity.records[indexRecord.url] ?? {}), updatedAt: reviewedAt, fingerprint: fingerprint(indexRecord) };
await writeJson("app/first-page-preview-manifest.json", previewManifest);
await writeJson("app/document-preview-provenance.json", provenance);
await writeJson("app/record-activity.json", activity);

const audit = {
  auditVersion: 1, intake: "EPA DOCS six-micro-batch intake", batch: "EPA-2026-09-23-B6", batchNumber: 6, totalBatches: 6, sourceOrderPreserved: true, reviewedAt, sourceAssetCommit: assetCommit, sourceAssetBranch: "epa-intake-batch-6", publication: { publishedAt, siteVersion: 310, deploymentId: "appgdep_6ab41cab6f708191bb13649e46d16810", liveUrl: "https://cadillac-pfas-event-trace.icons-7120.chatgpt.site" },
  rules: { recordBoundariesPreserved: true, pageOrderReviewRequired: true, filenameOnlyDeduplicationProhibited: true, statusesSeparated: true },
  totals: { records: 5, pages: 514, exactPriorIntakeRecords: 1, genuinelyNewDistinctRecords: 4, newCatalogRecords: 5, indexLeadsResolved: 4 },
  records: [
    { supplied: "EPA_05_234891.pdf", sha256: records[0].sha256, bytes: 2379611, pages: 8, ocrCheckedPages: [3,7,8], disposition: "new-distinct-index-entry-10", canonicalRecordId: records[0].id, missingReferencedRecords: ["complete Proposed Plan", "RI/FS", "risk assessment", "analytical data", "ROD", "responsiveness summary"], statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: true } },
    { supplied: "EPA_05_234892.pdf", sha256: records[1].sha256, bytes: 65325, pages: 2, ocrCheckedPages: [], disposition: "new-distinct-index-entry-1", canonicalRecordId: records[1].id, missingReferencedRecords: ["cogeneration feasibility study", "PSC order", "financing/special assessment", "construction and operating records"], statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: true } },
    { supplied: "EPA_05_234894.pdf", sha256: records[2].sha256, bytes: 14175851, pages: 374, indexedPages: 375, ocrCheckedPages: [], disposition: "new-distinct-index-entry-13", canonicalRecordId: records[2].id, pageCountDiscrepancy: "Supplied PDF has 374 physical pages; 1989 index states 375. All listed sections and Appendices A-G are present, with no visible internal gap.", statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: true } },
    { supplied: "EPA_05_234895.pdf", sha256: records[3].sha256, bytes: 5071744, pages: 129, ocrCheckedPages: [45,70,72,75,76,81,93,128], disposition: "new-distinct-index-entry-14-and-cover-enclosure", canonicalRecordId: records[3].id, missingNestedAttachments: ["Data Research letter p69 references enclosures; no separately identifiable census sheets follow"], statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: true } },
    { supplied: "EPA_05_234896.pdf", sha256: records[4].sha256, bytes: 15092, pages: 1, ocrCheckedPages: [], disposition: "exact-prior-intake-now-single-catalog-publication", canonicalRecordId: records[4].id, priorAudit: "app/kysor-2010-and-2025-intake-audit-2026-09-18.json", missingReferencedRecords: ["April 30, 1998 Administrative Order Compliance Status and Closure"], statuses: { received: true, extracted: true, reviewed: true, verified: "index-only", published: true } }
  ],
  limitations: ["The final-draft FS is not the signed ROD and its 374 physical pages conflict with the index's 375-page count.", "Kysor's comments are party positions; proposed pumping, discharge and cogeneration are not proof of implementation.", "The one-page 1995/1998 index is not either underlying 21-page record.", "The 66-page hearing transcript, 120-page ROD, August 24 letter and 1998 compliance/closure record remain missing.", "No modern PFAS, Plett Road, receiving-volume or Wexford-to-Cadillac causation requirement closes in this batch."]
};
await writeJson("app/epa-docs-six-batch-intake-audit-b6-2026-09-23.json", audit);

const queue = await readJson("app/evidence-request-queue-updates.json");
queue.scope = "September 23 includes full page-order review and reconciliation of all six EPA micro-batches, plus the Wexford Permit 4127-to-License 9758 monitoring-document trace. This is an incremental source-chain review, not a fresh reread of the whole repository.";
queue.note = "All six EPA micro-batches are complete. Batch 6 supplies the 374-page June 1989 Final Draft feasibility study, the complete 129-page Kysor comments, the July 1989 fact sheet, Mayor Becker's letter and the one-page later index. The 374/375-page discrepancy remains, and the 66-page hearing transcript, 120-page ROD, August 24 letter and 1998 compliance/closure record remain missing. These historical records do not close modern Plett/PFAS requests. One local construction/lithology requirement remains satisfied; 22 requests remain open.";
const pathway = queue.blocks.find((block) => block.requestId === "subsurface-pathway");
const chain = pathway.held.find((item) => item.id === "september14-five-source-pathway-tieback");
if (chain) {
  const batch6Finding = "Batch 6 now supplies the July 1989 EPA proposed-plan fact sheet, Mayor Becker's letter, the June 1989 Final Draft feasibility study and Kysor's complete 129-page comments. The Final Draft provides the historical detailed alternatives and extraction-system designs; Kysor's comments supply the enclosure previously missing from the August 26 cover letter.";
  if (!chain.finding.includes(batch6Finding)) chain.finding += ` ${batch6Finding}`;
  chain.limitation = chain.limitation.replace("the 66-page hearing transcript, 375-page final FS, 129-page Kysor comments and 120-page ROD remain absent; the entry-4 cover letter does not include its enclosure", "the 66-page hearing transcript and 120-page ROD remain absent. The supplied Final Draft FS has 374 physical pages although the index states 375, and the Kysor package's p69 nested census enclosures remain unresolved");
  for (const record of records.slice(0, 4)) {
    if (!chain.sources.some((source) => source.recordId === record.id)) chain.sources.push({ recordId: record.id, sha256: record.sha256, label: `${record.type}; historical proposal/comment boundary retained`, pages: record.pages > 20 ? undefined : Array.from({ length: record.pages }, (_, i) => i + 1) });
  }
}
await writeJson("app/evidence-request-queue-updates.json", queue);

const placementResult = await verifyRecordPlacement({ writeManifest: true });
if (placementResult.failures.length) throw new Error(`Placement reconciliation failed: ${placementResult.failures.join("; ")}`);
await writeFile("public/record-placement-manifest.json", toCrlf(await readFile("public/record-placement-manifest.json", "utf8")));
console.log(JSON.stringify({ added: records.map((record) => record.id), assetCommit, allSixBatchesComplete: true, queueOpen: 22 }, null, 2));
