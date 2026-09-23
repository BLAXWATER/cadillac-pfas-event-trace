import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { verifyRecordPlacement } from "./record-placement-integrity.mjs";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const toCrlf = (value) => value.replace(/\r?\n/g, "\r\n");
const writeJson = async (path, value) => writeFile(path, toCrlf(`${JSON.stringify(value, null, 2)}\n`));
const fingerprint = (record) => createHash("sha256").update(JSON.stringify(record)).digest("hex");
const reviewedAt = "2026-09-23T16:16:00-04:00";
const assetCommit = "20f2ac1e5855e5f1312fc85b75fc91317bd46f94";
const pinned = (id) => `https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/${assetCommit}/public/findings-docs/${id}.pdf`;

const records = [
  {
    id: "234-49ef2dd3725c", name: "Haring Township Questions on Kysor and Northernaire Cleanup Proposals - August 21, 1989.pdf", url: pinned("234-49ef2dd3725c"), year: "1989", category: "Correspondence - public comments", type: "Township comment letter", format: "PDF", pages: 2, size: 104181, sha256: "49ef2dd3725cddd8fc359b70a7bf87e04c3f7bcb84e19f5cd8f44bd42149528d",
    description: "Signed August 21, 1989 letter from Haring Township Supervisor Mary F. Stark to EPA following the August 7 public meeting. It asks how the proposed Cogeneration Michigan alternative would address soil, a stated 5,000-gpm extraction rate, shallow-well effects and resulting water disposal, and requests an environmental-impact study (PDF pp. 1-2). Both pages were read and visually checked. The figures and alternatives are stakeholder questions/characterizations, not proof of approved or operating pumping, discharge or cleanup. The referenced briefing, meeting record, prior correspondence, EPA response, proposal and any EIS are absent."
  },
  {
    id: "235-60336cd883e2", name: "Kysor RI-FS and Proposed Plan Comment Cover Letter - August 26, 1989.pdf", url: pinned("235-60336cd883e2"), year: "1989", category: "Correspondence - transmittal", type: "Comment transmittal cover letter", format: "PDF", pages: 1, size: 51101, sha256: "60336cd883e2f7836aada317e004d052631cd65b7276cbfc0ba52fc6e5238073",
    description: "August 26, 1989 Warner Norcross & Judd cover letter transmitting Kysor Industrial Corporation's comments on the RI/FS and proposed plan to EPA. The single supplied page was read and visually checked. Its stated enclosure is absent, so this record proves only the transmittal and remains an acquisition lead for the separately indexed 129-page Kysor comments; it does not establish the comments' substance."
  },
  {
    id: "236-addc2718157a", name: "ASI Four Winns Comments on Cadillac RI-FS - August 30, 1989.pdf", url: pinned("236-addc2718157a"), year: "1989", category: "Correspondence - technical comments", type: "Consultant RI/FS comments", format: "PDF", pages: 3, size: 143612, sha256: "addc2718157a49f425e3809d13ee10d5b0fa730764fa0d73560e8938870b8f1d",
    description: "August 30, 1989 ASI Environmental Technologies comments for Four Winns with an August 31 fax sheet. ASI states that soil information was insufficient and more investigation was needed (PDF p. 1), says Four Winns may have been partially responsible for shallow-aquifer VOCs, and describes a 1986 granular-activated-carbon proposal with possible sewer or Clam River discharge subject to permits (p. 2). All three pages were read and visually checked. These are a party consultant's positions and proposal history, not proof of source allocation, approval, construction, discharge or operation."
  },
  {
    id: "237-647d136b3049", name: "Black and Veatch Draft Summary of Kysor and Northernaire Public Comments - September 5, 1989.pdf", url: pinned("237-647d136b3049"), year: "1989", category: "Correspondence - public-comment summary", type: "Draft responsiveness-summary support", format: "PDF", pages: 2, size: 80405, sha256: "647d136b3049959d54d020e4b6521294ec3ac255ea3dfac8a25ee868124f5c91",
    description: "September 5, 1989 Black & Veatch transmittal and draft summary of comments concerning the Kysor and Northernaire sites. Page 1 explains that the compilation draws from the public-meeting transcript and written comments; page 2 summarizes seven commenter positions about cogeneration, health explanations, cleanup levels, source/cost allocation, soil flushing and deed restrictions. Both pages were read and visually checked. The transcript, original comments and enclosures are absent, and summarized allegations are not EPA findings, selected remedies or proof of consensus."
  },
  {
    id: "238-34bd721181df", name: "MDNR Comments on Draft Northernaire-Kysor Record of Decision - September 15, 1989.pdf", url: pinned("238-34bd721181df"), year: "1989", category: "Compliance - interagency remedy comments", type: "MDNR draft-ROD comment letter", format: "PDF", pages: 5, size: 274246, sha256: "34bd721181df019a5d09f6c254a0ed6c576fe12aadce1ed8c411b063284dad97",
    description: "Signed September 15, 1989 MDNR letter commenting on the draft Northernaire/Kysor Record of Decision. MDNR concurs with remedial technology but disputes cleanup levels, advocates a historical 1-ppb TCE criterion, requests inclusion of other source/plume information and corrections, and comments on ARAR/protectiveness language (PDF pp. 1-5). All five pages were read and visually checked. These are MDNR's requested revisions under the then-current framework, not proof that EPA adopted them or that cited rules remain current; the draft/final ROD and cited RI/FS material are absent."
  },
  {
    id: "239-3b31f0736347", name: "MDNR Comments on Draft Northernaire-Kysor Responsiveness Summary - September 22, 1989.pdf", url: pinned("239-3b31f0736347"), year: "1989", category: "Correspondence - interagency comments", type: "MDNR draft-responsiveness-summary comments", format: "PDF", pages: 4, size: 170387, sha256: "3b31f0736347d69ed9c557bf2dba878a00e77f59bedc0e26e3d18156f85e8b98",
    description: "Signed September 22, 1989 MDNR comments on the draft Responsiveness Summary for the Northernaire/Kysor ROD. MDNR asks that the RI/FS's broader industrial-park scope be stated, explains its position on cogeneration, soil remediation, comment rights and historical cleanup/risk criteria, and requests language describing one groundwater plume with multiple origins while treating Rexair separately (PDF pp. 1-4). All four pages and handwritten receipt/fax dates were visually checked. These are requested revisions and agency positions, not proof that EPA adopted the wording or independent proof of source attribution. Referenced drafts, comments and the final ROD are absent."
  },
  {
    id: "240-247244b600a3", name: "MDNR Concurrence and Objections on Northernaire-Kysor ROD - September 28, 1989.pdf", url: pinned("240-247244b600a3"), year: "1989", category: "Compliance - interagency remedy comments", type: "MDNR ROD comment letter", format: "PDF", pages: 1, size: 56059, sha256: "247244b600a334970ec70ac7d2416192f4d098e67eea76bd5b445b27a2938d72",
    description: "September 28, 1989 MDNR letter concurring with the ROD's remedial technology while rejecting the 5-ppb TCE target in favor of 1 ppb, disputing omission of Act 245/Part 22 as ARARs and requesting a broader site/source description. The single page was read and visually checked. It records MDNR's position, not proof of EPA adoption or a current legal standard; the referenced ROD and RI/FS are absent."
  }
];

const previewHashes = {
  "234-49ef2dd3725c": "d2246f94dcb57efedd9789e6fb0b6a77e4a3a407705f6b19dd72434636afb9de",
  "235-60336cd883e2": "656fae4a6ae41ae3765f4e59292763454913edd5a6b908b45c4083fe2a32a009",
  "236-addc2718157a": "59d70e87cb41518dc22ee256784053fbb055d9980752cecfbae9bb5c797e13f6",
  "237-647d136b3049": "c2e9bee8144a3af2d8b29b00c0c02261d1d7a1c00e1054791b3d3b33b05145f9",
  "238-34bd721181df": "cf2da5672aeb17b1519c9cac353dac5feda5981c158a143ac311c25144bd1370",
  "239-3b31f0736347": "5e42741dd1ce2f8d3f797ef3410a85be640984ec1f0df8eee82f4dcb62900940",
  "240-247244b600a3": "1a6372e8951be6be0086c14b0639caae9bf85f2d1262067fc7b2ca08c3cfca3e"
};

const supplemental = await readJson("app/supplemental-documents.json");
const indexRecord = supplemental.find((record) => record.id === "202-82254e0c3a95");
if (indexRecord) indexRecord.description = "October 16, 1989 Update 1 lists 15 Kysor/Cadillac groundwater records. Batch 4 supplied entry 11's two-page City statement. Batch 5 now supplies the originals behind entries 2 and 4-9, including public/interagency comments; entry 4 is only a cover letter and its separately indexed 129-page Kysor comments remain absent. The 66-page hearing transcript, 375-page final FS, 129-page comments and 120-page ROD remain retrieval leads. This index is metadata, not proof of the listed records' substance.";
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
  provenance[record.url] = { sourceSha256: record.sha256, page: 1, preview, previewSha256: previewHashes[record.id], verifiedAt: reviewedAt, verificationMethod: "Actual first PDF page rendered during complete page-order review; full page preserved.", scope: "Preview provenance only; whole-document verification is recorded in the Batch 5 intake audit." };
  activity.records[record.url] = { addedAt: reviewedAt, fingerprint: fingerprint(record) };
}
if (indexRecord) activity.records[indexRecord.url] = { ...(activity.records[indexRecord.url] ?? {}), updatedAt: reviewedAt, fingerprint: fingerprint(indexRecord) };
await writeJson("app/first-page-preview-manifest.json", previewManifest);
await writeJson("app/document-preview-provenance.json", provenance);
await writeJson("app/record-activity.json", activity);

const audit = {
  auditVersion: 1, intake: "EPA DOCS six-micro-batch intake", batch: "EPA-2026-09-23-B5", batchNumber: 5, totalBatches: 6, sourceOrderPreserved: true, reviewedAt, sourceAssetCommit: assetCommit, sourceAssetBranch: "epa-intake-batch-5",
  rules: { recordBoundariesPreserved: true, pageOrderReviewRequired: true, filenameOnlyDeduplicationProhibited: true, statusesSeparated: true },
  totals: { records: 7, pages: 18, exactExistingRecords: 0, alternateRenditions: 0, newDistinctRecords: 7, missingEnclosures: 4 },
  records: [
    { supplied: "EPA_05_234883.pdf", sha256: records[0].sha256, bytes: 104181, pages: 2, ocrCheckedPages: [], disposition: "new-distinct-index-entry-2", canonicalRecordId: records[0].id, missingReferencedRecords: ["eight-page briefing", "August 7 meeting record", "earlier correspondence", "EPA response", "Cogeneration proposal", "environmental-impact study"], statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: false } },
    { supplied: "EPA_05_234885.pdf", sha256: records[1].sha256, bytes: 51101, pages: 1, ocrCheckedPages: [], disposition: "new-distinct-index-entry-4-cover-only", canonicalRecordId: records[1].id, missingAttachments: ["Kysor Industrial Corporation comments on RI/FS and proposed plan (separately indexed as 129 pages)"], statuses: { received: true, extracted: true, reviewed: true, verified: "cover-only", published: false } },
    { supplied: "EPA_05_234886.pdf", sha256: records[2].sha256, bytes: 143612, pages: 3, ocrCheckedPages: [], disposition: "new-distinct-index-entry-5", canonicalRecordId: records[2].id, statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: false } },
    { supplied: "EPA_05_234887.pdf", sha256: records[3].sha256, bytes: 80405, pages: 2, ocrCheckedPages: [], disposition: "new-distinct-index-entry-6", canonicalRecordId: records[3].id, missingAttachments: ["public-meeting transcript", "underlying written comments", "ASI comments", "Kysor comments"], statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: false } },
    { supplied: "EPA_05_234888.pdf", sha256: records[4].sha256, bytes: 274246, pages: 5, ocrCheckedPages: [], disposition: "new-distinct-september-1989-mdnr-comments", canonicalRecordId: records[4].id, missingReferencedRecords: ["draft ROD", "RI/FS", "EPA response", "final ROD"], statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: false } },
    { supplied: "EPA_05_234889.pdf", sha256: records[5].sha256, bytes: 170387, pages: 4, ocrCheckedPages: [], disposition: "new-distinct-index-entry-8", canonicalRecordId: records[5].id, missingReferencedRecords: ["draft responsiveness summary", "final responsiveness summary", "final ROD"], statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: false } },
    { supplied: "EPA_05_234890.pdf", sha256: records[6].sha256, bytes: 56059, pages: 1, ocrCheckedPages: [], disposition: "new-distinct-september-1989-mdnr-comments", canonicalRecordId: records[6].id, missingReferencedRecords: ["ROD", "RI/FS"], statuses: { received: true, extracted: true, reviewed: true, verified: "qualified", published: false } }
  ],
  limitations: ["Comment letters and summaries preserve attributed positions and requested revisions, not independent technical or legal determinations.", "The cover letter in 234885 does not include its Kysor comments enclosure.", "Referenced transcripts, proposals, draft/final response documents and the final ROD remain separate records unless independently supplied.", "No current Plett Road/PFAS evidence-request requirement closes in this batch."]
};
await writeJson("app/epa-docs-six-batch-intake-audit-b5-2026-09-23.json", audit);

const queue = await readJson("app/evidence-request-queue-updates.json");
queue.scope = "September 23 now includes full page-order review and reconciliation of EPA micro-batches 1-5, plus the Wexford Permit 4127-to-License 9758 monitoring-document trace. This is an incremental source-chain review, not a fresh reread of the whole repository.";
queue.note = "EPA micro-batch 5 adds seven distinct 1989 comment and transmittal records behind the Kysor administrative index. One is only a cover letter; its 129-page Kysor comments enclosure remains missing. These records improve the administrative chain but do not establish PFAS, Plett Road or a Wexford-to-WWTP pathway. One local construction/lithology requirement remains satisfied; 22 requests remain open.";
const pathway = queue.blocks.find((block) => block.requestId === "subsurface-pathway");
const chain = pathway.held.find((item) => item.id === "september14-five-source-pathway-tieback");
if (chain) {
  chain.finding += " Batch 5 now supplies seven 1989 comment/transmittal records behind index entries 2 and 4-9, documenting stakeholder and interagency positions before the final decision.";
  chain.limitation = chain.limitation.replace("most listed 1989 originals are not supplied here; only entry 11's City statement is now held", "several 1989 comment originals are now held, but the 66-page hearing transcript, 375-page final FS, 129-page Kysor comments and 120-page ROD remain absent; the entry-4 cover letter does not include its enclosure");
  for (const record of records) chain.sources.push({ recordId: record.id, sha256: record.sha256, label: `${record.year} ${record.type}; attributed position or transmittal`, pages: Array.from({ length: record.pages }, (_, i) => i + 1) });
}
await writeJson("app/evidence-request-queue-updates.json", queue);

const placementResult = await verifyRecordPlacement({ writeManifest: true });
if (placementResult.failures.length) throw new Error(`Placement reconciliation failed: ${placementResult.failures.join("; ")}`);
await writeFile("public/record-placement-manifest.json", toCrlf(await readFile("public/record-placement-manifest.json", "utf8")));
console.log(JSON.stringify({ added: records.map((record) => record.id), assetCommit, queueOpen: 22 }, null, 2));
