import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { verifyRecordPlacement } from "./record-placement-integrity.mjs";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const toCrlf = (value) => value.replace(/\r?\n/g, "\r\n");
const writeJson = async (path, value) => writeFile(path, toCrlf(`${JSON.stringify(value, null, 2)}\n`));
const fingerprint = (record) => createHash("sha256").update(JSON.stringify(record)).digest("hex");
const reviewedAt = "2026-09-23T10:25:00-04:00";
const assetCommit = "1fb4ab511dabbf1e1589643afad50b72ae9fc926";
const pinned = (id) => `https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/${assetCommit}/public/findings-docs/${id}.pdf`;

const records = [
  {
    id: "217-293e8020bbbe",
    name: "EPA Fourth Five-Year Review — Kysor Industrial Corp. Superfund Site — August 31, 2015.pdf",
    url: pinned("217-293e8020bbbe"),
    year: "2015",
    category: "Groundwater & hydrogeology — Superfund remedy review",
    type: "EPA five-year review",
    format: "PDF",
    pages: 147,
    size: 41605089,
    sha256: "293e8020bbbe4af6ed8460293cf9b296df989f70a2c211f723c7c50e996fce13",
    description: "EPA Region 5's signed August 31, 2015 fourth five-year review for the Kysor Industrial Superfund site. EPA characterized the remedy as currently protective but conditioned long-term protectiveness on stronger groundwater-use controls, long-term stewardship and investigation of rising TCE at extraction well I-9 (PDF pp. 6–10, 23–30). The report describes three aquifers, discontinuous clay, six commingled VOC plumes, historic LDFA extraction/treatment and Clam River discharge, while stating that missing Rexair data prevented a firm allocation of captured contamination (pp. 22–26, 32, 38–44). All 147 pages, appendices, maps, tables, handwritten forms and photographs were read and visually checked; pages 2, 50, 54, 64, 67 and 129 received additional OCR/visual verification. The embedded title calls this a third review, but the signed report identifies it as the fourth. This historical VOC/chromium review does not evaluate PFAS or prove a present Plett Road pathway."
  },
  {
    id: "218-0a9bdc712747",
    name: "EPA Sixth Five-Year Review — Kysor Industrial Corp. Superfund Site — August 13, 2025.pdf",
    url: pinned("218-0a9bdc712747"),
    year: "2025",
    category: "Groundwater & hydrogeology — Superfund remedy review",
    type: "EPA five-year review",
    format: "PDF",
    pages: 108,
    size: 19386146,
    sha256: "0a9bdc7127476f79f953a4360048d285929744c0ef86ed0610f7b95b057dc62b",
    description: "EPA Region 5's signed August 13, 2025 sixth five-year review for the Kysor Industrial Superfund site. EPA found the remedy short-term protective, while requiring renewed groundwater monitoring, institutional-control stewardship, 1,4-dioxane sampling, vapor-intrusion evaluation, PFAS sampling under an approved QAPP and groundwater-flow reassessment after the municipal well-field move (PDF pp. 31–35). The review reports that routine monitoring stopped after 2020, identifies damaged or missing wells, and uses 2020/January 2021 results showing localized TCE/PCE exceedances (pp. 16–17, 24–27, 33). It also reports residential PFAS detections but states that upgradient and side-gradient results made Kysor/Northernaire an unlikely primary source; EPA still required QAPP-based confirmation (pp. 22–23, 28–32). All 108 pages were read and visually checked; map pages 47–48 were OCR/visual-verified. Planned 2025 work is not treated as completed, and the report does not prove no Site contribution or a Wexford-to-Plett pathway."
  },
  {
    id: "219-2ebb2a7ba6d0",
    name: "EPA Notice of Potential Liability and Information Request — Kysor Site — May 26, 1988.pdf",
    url: pinned("219-2ebb2a7ba6d0"),
    year: "1988",
    category: "Groundwater & hydrogeology — CERCLA correspondence",
    type: "EPA CERCLA potential-liability notice and information request",
    format: "PDF",
    pages: 5,
    size: 299740,
    sha256: "2ebb2a7ba6d08e227af75617ceb26939911d6c011066a2fab7451b1220c34079",
    description: "EPA Region V certified-mail notice dated May 26, 1988 concerning the Kysor Industries site. EPA stated that it had documented releases or threatened releases, identified the recipient as a potential responsible party, requested a response on participation and negotiations within 14 days, and demanded CERCLA/RCRA information within 30 days (PDF pp. 1–3). The attachment lists potential responsible parties for Kysor/Northernaire (p. 5), with several addresses redacted. All five pages were read and visually checked. This is a potential-liability notice and information demand, not an adjudication of liability, cleanup completion or source apportionment."
  },
  {
    id: "220-2f8dfa1860cd",
    name: "Public Correspondence Regarding Cadillac Groundwater Cleanup Proposal — August 24, 1989.pdf",
    url: pinned("220-2f8dfa1860cd"),
    year: "1989",
    category: "Groundwater & hydrogeology — public correspondence",
    type: "Public correspondence and comment",
    format: "PDF",
    pages: 1,
    size: 125995,
    sha256: "2f8dfa1860cd19859bdc4b74fb883b3f7750431c4938c1d58abbf31f8ba5e427",
    description: "One-page handwritten public letter dated August 24, 1989 following the August 7 Cadillac groundwater hearing. The writer supports supervised cleanup participation, questions whether area forests could sustain a project of the proposed size, recounts a retiree's explanation of contamination practices and expresses the opinion that Kysor should be held responsible. The page was manually read and visually verified because native extraction was unusable. The sender and address are redacted and the recipient surname is not fully legible. This is personal opinion and recollection, not an agency determination, approval or independent source-attribution finding."
  },
  {
    id: "221-a8b3680cb1b0",
    name: "Cadillac Area Groundwater Contamination Public Meeting Transcript — August 7, 1989.pdf",
    url: pinned("221-a8b3680cb1b0"),
    year: "1989",
    category: "Groundwater & hydrogeology — historical public meeting",
    type: "Certified public-meeting transcript",
    format: "PDF",
    pages: 66,
    size: 2737668,
    sha256: "a8b3680cb1b0926ab955a5d5c757e8d62570d38650fd0777254bc9eb9f895b44",
    description: "Certified transcript of the August 7, 1989 Cadillac Area Groundwater Contamination public meeting at the Wexford County Courthouse. Agency speakers describe the RI/FS, multiple VOC plumes, three aquifers, proposed groundwater extraction/treatment and soil-vapor extraction alternatives, while stating that the final remedy had not yet been selected (PDF pp. 2–16, 24–31, 63–64). City, Kysor and cogeneration proponents then present attributed positions, estimates and performance claims (pp. 32–64). All 66 pages were read and visually checked. The hearing records proposals and public comments; it does not prove later approval, construction, operating flow, treatment performance, PFAS conditions or a Plett Road pathway."
  },
  {
    id: "222-a20e778c67f4",
    name: "EPA Fifth Five-Year Review — Kysor Industrial Corp. Superfund Site — August 28, 2020.pdf",
    url: pinned("222-a20e778c67f4"),
    year: "2020",
    category: "Groundwater & hydrogeology — Superfund remedy review",
    type: "EPA five-year review",
    format: "PDF",
    pages: 103,
    size: 19551345,
    sha256: "a20e778c67f4bf5ac2b07613b1c0f05ce0e9b6d75dd6d0c271a9fd39d75267f5",
    description: "EPA Region 5's signed August 28, 2020 fifth five-year review for the Kysor Industrial Superfund site. EPA found the remedy short-term protective and the plume apparently contained, but made long-term protectiveness conditional on institutional-control stewardship, 1,4-dioxane analysis, PFAS well sampling and continued vapor-intrusion tracking (PDF pp. 27–31). The review reports continued treatment, localized TCE/PCE exceedances and projected cleanup dates that are model estimates rather than achieved milestones (pp. 17–26, 96–103). Its PFAS section states that Site monitoring wells had not yet been tested and recommends sampling; its cited municipal/WWTP statements are summaries, not embedded raw laboratory reports (p. 27). All 103 pages were read and visually checked; pages 51–52 and 76 were OCR/visual-verified. The report does not prove a Wexford Landfill-to-Plett Road pathway."
  }
];

const previewHashes = {
  "217-293e8020bbbe": "c9cfc6dfffbdec660f3c79c39b74a1a650b63fd1c50063399a408218cb657260",
  "218-0a9bdc712747": "7255ca343a8db10412a540b17e66d333201eba4b7e61ca7a9737089e24da508a",
  "219-2ebb2a7ba6d0": "a0b3c55b074f636a829a2ff7e5269e8e291106eba5a82e5db69d8472df19f176",
  "220-2f8dfa1860cd": "6368dcae4c533d9dcbf3a0f79e7c5e2500d85383cc0facdb3bb6f36264167ab6",
  "221-a8b3680cb1b0": "acb22c616ab207a6d0db46a1512244ed9b0117e909432608cd8f21a519cac734",
  "222-a20e778c67f4": "406ee08d85383d57df3bafa6eddba0283b671059b268ec4fb0feb7a48f383681"
};

const supplemental = await readJson("app/supplemental-documents.json");
const existing = supplemental.find((record) => record.sha256 === "69ab779993c2980d62c7fd9f510130b212041e528c65a86946b94823a4807bca");
if (existing) existing.description = "EPA Region 5's signed July 29, 1995 first five-year review for Northernaire Plating. It records the 1988–1991 source-control work, the shared Kysor/Northernaire groundwater remedy then under construction, recommended additional shallow chromium/cadmium sampling and certified the selected remedies protective at that review date (PDF pp. 1–5). All five supplied pages, including the signed cover, were freshly reread and visually checked. The report predates PFAS investigation and does not establish PFAS source attribution or a present Plett Road pathway.";
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
  const obsoleteRawUrl = record.url
    .replace("https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/", "https://raw.githubusercontent.com/BLAXWATER/cadillac-pfas-event-trace/");
  delete previewManifest[obsoleteRawUrl];
  delete provenance[obsoleteRawUrl];
  delete activity.records[obsoleteRawUrl];
  const preview = `/first-page-previews/by-sha256/${record.sha256}.webp`;
  previewManifest[`/findings-docs/${record.id}.pdf`] = preview;
  provenance[`/findings-docs/${record.id}.pdf`] = {
    sourceSha256: record.sha256,
    page: 1,
    preview,
    previewSha256: previewHashes[record.id],
    verifiedAt: reviewedAt,
    verificationMethod: "Actual first PDF page rendered during the complete page-order review; full page preserved.",
    scope: "Preview provenance only; whole-document verification is recorded in the Batch 2 intake audit."
  };
  activity.records[record.url] = { addedAt: reviewedAt, fingerprint: fingerprint(record) };
}
if (existing) activity.records[existing.url] = { ...(activity.records[existing.url] ?? {}), updatedAt: reviewedAt, fingerprint: fingerprint(existing) };
await writeJson("app/first-page-preview-manifest.json", previewManifest);
await writeJson("app/document-preview-provenance.json", provenance);
await writeJson("app/record-activity.json", activity);

const placement = await readJson("public/record-placement-manifest.json");
for (const record of records) {
  const row = {
    id: record.id,
    archiveId: "supplemental",
    archiveLabel: "Added evidence",
    catalog: "supplemental-documents.json",
    sectionId: "supplemental-library-title",
    name: record.name,
    url: record.url,
    sha256: record.sha256,
    size: record.size
  };
  const index = placement.records.findIndex((item) => item.id === record.id);
  if (index >= 0) placement.records[index] = row;
  else placement.records.push(row);
}
placement.recordCount = placement.records.length;
await writeJson("public/record-placement-manifest.json", placement);

const audit = {
  auditVersion: 1,
  intake: "EPA DOCS six-micro-batch intake",
  batch: "EPA-2026-09-23-B2",
  batchNumber: 2,
  totalBatches: 6,
  sourceOrderPreserved: true,
  reviewedAt,
  sourceAssetCommit: assetCommit,
  sourceAssetBranch: "epa-intake-batch-2",
  rules: {
    recordBoundariesPreserved: true,
    pageOrderReviewRequired: true,
    filenameOnlyDeduplicationProhibited: true,
    statusesSeparated: true
  },
  totals: { records: 7, pages: 435, exactExistingRecords: 1, newDistinctRecords: 6 },
  records: [
    { supplied: "EPA_05_494193.pdf", sha256: records[0].sha256, bytes: 41605089, pages: 147, ocrCheckedPages: [2,50,54,64,67,129], disposition: "new-distinct-record", canonicalRecordId: records[0].id, statuses: { received: true, extracted: true, reviewed: true, verified: true, published: false } },
    { supplied: "EPA_05_703881.pdf", sha256: records[1].sha256, bytes: 19386146, pages: 108, ocrCheckedPages: [47,48], disposition: "new-distinct-record", canonicalRecordId: records[1].id, statuses: { received: true, extracted: true, reviewed: true, verified: true, published: false } },
    { supplied: "EPA_05_956384.pdf", sha256: records[2].sha256, bytes: 299740, pages: 5, ocrCheckedPages: [], disposition: "new-distinct-record", canonicalRecordId: records[2].id, statuses: { received: true, extracted: true, reviewed: true, verified: true, published: false } },
    { supplied: "EPA_05_956385.pdf", sha256: records[3].sha256, bytes: 125995, pages: 1, ocrCheckedPages: [1], disposition: "new-distinct-record", canonicalRecordId: records[3].id, statuses: { received: true, extracted: true, reviewed: true, verified: true, published: false } },
    { supplied: "EPA_05_956386.pdf", sha256: records[4].sha256, bytes: 2737668, pages: 66, ocrCheckedPages: [], disposition: "new-distinct-record", canonicalRecordId: records[4].id, statuses: { received: true, extracted: true, reviewed: true, verified: true, published: false } },
    { supplied: "EPA_05_960573.pdf", sha256: records[5].sha256, bytes: 19551345, pages: 103, ocrCheckedPages: [51,52,76], disposition: "new-distinct-record", canonicalRecordId: records[5].id, statuses: { received: true, extracted: true, reviewed: true, verified: true, published: false } },
    { supplied: "EPA_05_149684.pdf", sha256: "69ab779993c2980d62c7fd9f510130b212041e528c65a86946b94823a4807bca", bytes: 284461, pages: 5, ocrCheckedPages: [], disposition: "exact-existing-record", canonicalRecordId: "212-69ab779993c2", statuses: { received: true, extracted: true, reviewed: true, verified: true, published: true } }
  ],
  limitations: [
    "Five-year reviews are dated remedy snapshots and do not establish present conditions beyond their cited monitoring periods.",
    "Historical VOC/chromium remedy records do not by themselves prove PFAS source attribution or a Wexford Landfill-to-Plett Road pathway.",
    "Stakeholder statements and cleanup proposals in the 1989 correspondence and transcript are attributed statements, not approvals or independent determinations.",
    "The 2025 review's planned monitoring and QAPP work is not treated as completed evidence."
  ]
};
await writeJson("app/epa-docs-six-batch-intake-audit-b2-2026-09-23.json", audit);

const placementResult = await verifyRecordPlacement({ writeManifest: true });
if (placementResult.failures.length) throw new Error(`Placement reconciliation failed: ${placementResult.failures.join("; ")}`);
await writeFile("public/record-placement-manifest.json", toCrlf(await readFile("public/record-placement-manifest.json", "utf8")));

console.log(JSON.stringify({added: records.map((record) => record.id), exactExisting: existing?.id, assetCommit}, null, 2));
