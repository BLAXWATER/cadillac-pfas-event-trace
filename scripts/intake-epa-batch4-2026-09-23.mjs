import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { verifyRecordPlacement } from "./record-placement-integrity.mjs";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const toCrlf = (value) => value.replace(/\r?\n/g, "\r\n");
const writeJson = async (path, value) => writeFile(path, toCrlf(`${JSON.stringify(value, null, 2)}\n`));
const fingerprint = (record) => createHash("sha256").update(JSON.stringify(record)).digest("hex");
const reviewedAt = "2026-09-23T15:48:00-04:00";
const assetCommit = "b33823da2b48d8c621d13b4c0c8f22a0f55fa4fc";
const pinned = (id) => `https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/${assetCommit}/public/findings-docs/${id}.pdf`;

const records = [
  {
    id: "229-8d392d43b22a",
    name: "EPA Kysor Industrial Hazard Ranking System Scoring Package - April 11, 1985.pdf",
    url: pinned("229-8d392d43b22a"),
    year: "1985",
    category: "Groundwater & hydrogeology - Superfund hazard ranking",
    type: "EPA Hazard Ranking System scoring package",
    format: "PDF",
    pages: 28,
    size: 621395,
    sha256: "8d392d43b22a3c4cff72129fac479484cba1b9aa4b6e1b16611b6e2a34376721",
    description: "April 11, 1985 Kysor Industrial CERCLA Hazard Ranking System package. EPA's site summary says historical solvent wastes were disposed in unlined pits, excavated in 1981, and onsite shallow-groundwater wells contained solvents (PDF p. 1). The signed scoring sheets record an overall HRS score of 33.94, driven by a 58.71 groundwater-route score, with surface-water and air-route scores of zero (pp. 2, 6). All 28 pages were read and visually checked; targeted OCR covered weak handwritten pages. Portions of the reference log on pp. 27-28 remain partly unreadable. Referenced laboratory records are not all attached, and this historical VOC record contains no PFAS analysis or Plett Road finding."
  },
  {
    id: "231-6ffb214e3c30",
    name: "Cadillac Area Groundwater Feasibility Study - Interim Deliverable 2 Alternatives Array - July 1988.pdf",
    url: pinned("231-6ffb214e3c30"),
    year: "1988",
    category: "Groundwater & hydrogeology - remedy alternatives",
    type: "Interim feasibility-study alternatives screening",
    format: "PDF",
    pages: 106,
    size: 3255393,
    sha256: "6ffb214e3c303f21b7f950f469251840e2702da7b5751e54e915f794e390601d",
    description: "July 1988 E.C. Jordan/MDNR Interim Deliverable 2 screens historical groundwater and soil remedial alternatives for the Cadillac industrial-park VOC/chromium investigation. It retains several pump-treat-discharge and soil-remedy alternatives for later analysis (PDF pp. 64-75, 89, 101), while explicitly remaining an interim screening record rather than a selected remedy, design or operating record (pp. 8-10). Historical targets, discharge comparisons and costs are proposals/estimates, not current standards, actual discharges or expenditures. All 106 pages were read and visually checked. Appendix B is listed but absent, an internal SC-8/SC-9 numbering conflict is preserved, and the record contains no PFAS, Wexford-landfill, leachate-receiving or Plett-well evidence."
  },
  {
    id: "232-8ab378ec9452",
    name: "Cadillac Area Groundwater Remedial Investigation - Supporting Appendix Volume - 1988.pdf",
    url: pinned("232-8ab378ec9452"),
    year: "1988",
    category: "Groundwater & hydrogeology - remedial investigation appendices",
    type: "Technical appendix compilation",
    format: "PDF",
    pages: 176,
    size: 4150306,
    sha256: "8ab378ec94521d21f6b381ba588ecbd56b0b5edca5f5d4302f1c904af02d3f6c",
    description: "Supporting volume for the 1988 Cadillac Area Groundwater Remedial Investigation containing Appendices A, B, C, E, G, K, L, Q, R and S. It supplies monitoring-well tables, Four Winns investigation material, analytical tables, field results, plume statistics, fate/transport calculations and baseline-risk scenarios. The Four Winns section reports sandy materials with discontinuous clay lenses and historical upper-aquifer VOC/acetone interpretations (PDF pp. 13-15). Appendix R expressly relies on inferred sources and simplified homogeneous one-dimensional modeling, so projected arrivals and concentrations are not observations (pp. 83-85, 102-110). All 176 pages were read and visually checked, with targeted OCR/image review of 27 weak, sparse, mapped or rotated pages. Appendices D, F, H, I, J, M, N, O and P remain absent; the record contains no PFAS analysis or proven Wexford-to-Plett pathway."
  },
  {
    id: "233-86a0d0431b4c",
    name: "City of Cadillac Statement on Kysor and Northernaire Feasibility Study - August 7, 1989.pdf",
    url: pinned("233-86a0d0431b4c"),
    year: "1989",
    category: "Correspondence - public statement",
    type: "City feasibility-study comment",
    format: "PDF",
    pages: 2,
    size: 73417,
    sha256: "86a0d0431b4c74feecba805cb11cd8140ae632c9aa953fe9c5d42d5b2d602f09",
    description: "City of Cadillac statement presented August 7, 1989 at the Wexford County Courthouse. The City reports its historical understanding of industrial groundwater contamination, says the municipal supply then showed no sign of contamination, states protection/cleanup/economic goals, and advocates a Cogeneration Michigan cleanup proposal (PDF pp. 1-2). Both pages were read and visually checked. These are attributed City positions and predictions, not independent confirmation of remedy approval, construction, operation, performance, cost or present conditions. The record matches entry 11 in EPA's October 1989 administrative-record index but does not supply the separately listed final feasibility study or Record of Decision."
  }
];

const previewHashes = {
  "229-8d392d43b22a": "5924399aeafaa031f3cd0fc2c732b560566a851ca87ba0f98a9412d00a6152e3",
  "231-6ffb214e3c30": "1fab1973aea8fbfb3ede89a9a04edd3625b392520afc540919aa1750142f29a2",
  "232-8ab378ec9452": "da915f7b8091cea3ff609c7f9412c0d236ae5c9da2a70c2e96ab7a2850b15e9f",
  "233-86a0d0431b4c": "aa0faa5679cff25c17fe4463548d2d80cdfe2600154d6089332c762842e5a672"
};

const supplemental = await readJson("app/supplemental-documents.json");
const canonical011 = supplemental.find((record) => record.id === "011-05c2a0fb3666");
if (canonical011) canonical011.description = "April 1988 MDNR/E.C. Jordan Interim Deliverable 1 identifies five known or probable industrial-park source areas and seven historical VOC/chromium plumes, develops preliminary cleanup targets, and discusses treated-groundwater discharge options. All 50 pages of the newly supplied EPA rendition were read and visually checked; it is the same substantive record as this canonical OCR/font-fixed copy, so no duplicate card was created. Targets remained preliminary and discharge discussion is not proof of remedy selection, construction or operation. It predates the PFAS investigation and is not evidence of PFAS source attribution.";
const canonical198 = supplemental.find((record) => record.id === "198-402da04fc76d");
if (canonical198) canonical198.description = "August 1988 FINAL DRAFT regional remedial investigation. PDF pp. 58-63 describe sandy aquifers and discontinuous clay; pp. 72-80 provide historical levels, permeability and gradient work. Page 93 qualifies tentative deep-well TCE as likely sampling carryover. The supplied EPA_05_234880 rendition was re-read through all 169 rendered pages and reconciled as the same substantive record; the distinct 176-page companion volume now supplies Appendices A, B, C, E, G, K, L, Q, R and S. Appendices D, F, H, I, J, M, N, O and P remain absent. Historical modeled arrivals are not observed PFAS or Plett Road contamination.";
const canonical202 = supplemental.find((record) => record.id === "202-82254e0c3a95");
if (canonical202) canonical202.description = "October 16, 1989 Update 1 lists 15 Kysor/Cadillac groundwater records. Page 1 identifies City, stakeholder and agency comments; page 2 lists the August 7 public-meeting transcript, June 8 final feasibility study, Kysor comments and September 29 ROD. The separately supplied two-page City statement now resolves index entry 11 only. The other listed originals remain retrieval leads, not attachments or proof of their contents. This newly supplied EPA copy is byte-identical to the canonical index and does not receive a duplicate card.";
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
  provenance[record.url] = {
    sourceSha256: record.sha256,
    page: 1,
    preview,
    previewSha256: previewHashes[record.id],
    verifiedAt: reviewedAt,
    verificationMethod: "Actual first PDF page rendered during complete page-order review; full page preserved.",
    scope: "Preview provenance only; whole-document verification is recorded in the Batch 4 intake audit."
  };
  activity.records[record.url] = { addedAt: reviewedAt, fingerprint: fingerprint(record) };
}
for (const id of ["011-05c2a0fb3666", "198-402da04fc76d", "202-82254e0c3a95"]) {
  const record = supplemental.find((item) => item.id === id);
  if (record) activity.records[record.url] = { ...(activity.records[record.url] ?? {}), updatedAt: reviewedAt, fingerprint: fingerprint(record) };
}
await writeJson("app/first-page-preview-manifest.json", previewManifest);
await writeJson("app/document-preview-provenance.json", provenance);
await writeJson("app/record-activity.json", activity);

const audit = {
  auditVersion: 1,
  intake: "EPA DOCS six-micro-batch intake",
  batch: "EPA-2026-09-23-B4",
  batchNumber: 4,
  totalBatches: 6,
  sourceOrderPreserved: true,
  reviewedAt,
  sourceAssetCommit: assetCommit,
  sourceAssetBranch: "epa-intake-batch-4",
  rules: { recordBoundariesPreserved: true, pageOrderReviewRequired: true, filenameOnlyDeduplicationProhibited: true, statusesSeparated: true },
  totals: { records: 7, pages: 533, exactExistingRecords: 1, alternateRenditions: 2, newDistinctRecords: 4 },
  records: [
    { supplied: "EPA_05_234876.pdf", sha256: records[0].sha256, bytes: 621395, pages: 28, ocrCheckedPages: [2,6,15,18,19,23,26,27,28], disposition: "new-distinct-record", canonicalRecordId: records[0].id, statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: false } },
    { supplied: "EPA_05_234877.pdf", sourceUrl: pinned("230-2425df25aad5"), sha256: "2425df25aad519a3acaea93091aeb466b571158e9d066df49f89188f6d391b52", bytes: 1131421, pages: 50, ocrCheckedPages: [], disposition: "alternate-rendition-canonical-reused", canonicalRecordId: "011-05c2a0fb3666", statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: true } },
    { supplied: "EPA_05_234878.pdf", sha256: records[1].sha256, bytes: 3255393, pages: 106, ocrCheckedPages: [], missingAttachments: ["Appendix B"], disposition: "new-distinct-record", canonicalRecordId: records[1].id, statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: false } },
    { supplied: "EPA_05_234879.pdf", sha256: records[2].sha256, bytes: 4150306, pages: 176, ocrCheckedPages: [1,2,12,13,16,17,18,21,22,34,37,51,57,66,82,91,92,94,95,100,101,104,106,107,111,113,137], missingAppendices: ["D","F","H","I","J","M","N","O","P"], disposition: "new-distinct-record", canonicalRecordId: records[2].id, statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: false } },
    { supplied: "EPA_05_234880.pdf", sha256: "ddd2bc1eb32fddc91b8c2653243d3755fc6d409fd6a595781ea39862d8049a60", bytes: 8887577, pages: 169, ocrCheckedPages: [], disposition: "alternate-reoptimized-rendition-canonical-reused", canonicalRecordId: "198-402da04fc76d", statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: true } },
    { supplied: "EPA_05_234881.pdf", sha256: "82254e0c3a951f81260926ec35bb39c2fe3d2c86d75c4ac42926a171ff46831d", bytes: 81223, pages: 2, ocrCheckedPages: [], disposition: "exact-existing-record", canonicalRecordId: "202-82254e0c3a95", statuses: { received: true, extracted: true, reviewed: true, verified: true, published: true } },
    { supplied: "EPA_05_234882.pdf", sha256: records[3].sha256, bytes: 73417, pages: 2, ocrCheckedPages: [], disposition: "new-distinct-record", canonicalRecordId: records[3].id, resolvesIndexEntry: { recordId: "202-82254e0c3a95", entry: 11 }, statuses: { received: true, extracted: true, reviewed: true, verified: true, published: false } }
  ],
  limitations: [
    "Historical VOC/chromium findings and modeled scenarios do not establish PFAS source attribution or a present pathway to Plett Road.",
    "The alternatives documents are preliminary screening records, not proof of remedy selection, construction, discharge or operation.",
    "The appendix compilation supplies ten of the RI's listed appendices; nine remain absent.",
    "The City statement is an attributed position and proposal, not independent proof of cogeneration implementation.",
    "No currently open Plett Road/PFAS evidence-request requirement closes in this batch."
  ]
};
await writeJson("app/epa-docs-six-batch-intake-audit-b4-2026-09-23.json", audit);

const queue = await readJson("app/evidence-request-queue-updates.json");
queue.scope = "September 23 now includes full page-order review and reconciliation of EPA micro-batches 1-4, plus the Wexford Permit 4127-to-License 9758 monitoring-document trace. This is an incremental source-chain review, not a fresh reread of the whole repository.";
queue.note = "EPA micro-batch 4 adds four distinct historical records, reconciles one exact existing record and two alternate renditions without duplicate cards, and supplies ten appendices missing from the canonical 1988 RI. Nine RI appendices, the 1989 final FS and ROD, and all Plett-specific modern hydraulic/PFAS requirements remain unresolved. One local construction/lithology requirement remains satisfied; 22 requests remain open.";
const pathway = queue.blocks.find((block) => block.requestId === "subsurface-pathway");
pathway.held.unshift({
  id: "september23-epa-batch4-ri-appendices-alternatives",
  finding: "The 1988 RI companion volume supplies monitoring-well construction tables, historical analytical summaries, plume statistics, fate/transport calculations and risk scenarios from Appendices A, B, C, E, G, K, L, Q, R and S. It documents sandy materials, discontinuous clay lenses and historical modeled municipal-well scenarios. The July 1988 alternatives document separately records candidate groundwater/soil remedies for later analysis.",
  limitation: "Appendices D, F, H, I, J, M, N, O and P remain absent. The historical models use inferred sources and simplified assumptions; projected arrivals are not measured contamination. Neither record identifies 1140 Plett, supplies a Plett-inclusive synoptic round or hydraulic tests, or establishes a Wexford-to-Plett PFAS pathway. No requirement is closed.",
  sources: [
    { recordId: "232-8ab378ec9452", sha256: "8ab378ec94521d21f6b381ba588ecbd56b0b5edca5f5d4302f1c904af02d3f6c", label: "1988 RI appendix compilation - pp13-15,67-85,102-110", pages: [13,14,15,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,83,84,85,102,103,108,109,110] },
    { recordId: "231-6ffb214e3c30", sha256: "6ffb214e3c303f21b7f950f469251840e2702da7b5751e54e915f794e390601d", label: "July 1988 alternatives screening - pp64-75", pages: [64,65,66,67,68,69,70,71,72,73,74,75] }
  ],
  requirementIds: ["surveyed-elevations-water-levels", "local-hydraulic-tests", "site-specific-groundwater-map"]
});
const chain = pathway.held.find((item) => item.id === "september14-five-source-pathway-tieback");
if (chain) {
  chain.finding = chain.finding.replace("Index234881 identifies 15 separate 1989 records, including a 66-page hearing transcript, 375-page final FS and 120-page regional ROD.", "Index234881 identifies 15 separate 1989 records. Its two-page City statement (entry 11) is now supplied and reviewed; the 66-page hearing transcript, 375-page final FS and 120-page regional ROD remain outstanding.");
  chain.limitation = chain.limitation.replace("listed 1989 originals are not supplied here", "most listed 1989 originals are not supplied here; only entry 11's City statement is now held");
  chain.sources.push({ recordId: "233-86a0d0431b4c", sha256: "86a0d0431b4c74feecba805cb11cd8140ae632c9aa953fe9c5d42d5b2d602f09", label: "1989 City statement - pp1-2; attributed proposal only", pages: [1,2] });
}
await writeJson("app/evidence-request-queue-updates.json", queue);

const placementResult = await verifyRecordPlacement({ writeManifest: true });
if (placementResult.failures.length) throw new Error(`Placement reconciliation failed: ${placementResult.failures.join("; ")}`);
await writeFile("public/record-placement-manifest.json", toCrlf(await readFile("public/record-placement-manifest.json", "utf8")));
console.log(JSON.stringify({ added: records.map((record) => record.id), assetCommit, queueOpen: 22 }, null, 2));
