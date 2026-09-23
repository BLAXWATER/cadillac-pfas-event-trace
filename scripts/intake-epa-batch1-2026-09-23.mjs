import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const writeJson = async (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
const fingerprint = (record) => createHash("sha256").update(JSON.stringify(record)).digest("hex");
const addedAt = "2026-09-23T15:35:00-04:00";

const records = [
  {
    id: "213-ff4d48eb64da",
    name: "EPA Administrative Order Compliance Status and Closure — April 30, 1998.pdf",
    url: "/findings-docs/213-ff4d48eb64da.pdf",
    year: "1998",
    category: "Superfund & groundwater cleanup",
    type: "EPA administrative-order status index",
    format: "PDF",
    pages: 21,
    size: 557323,
    sha256: "ff4d48eb64da75d9e1f56816b7699d66a8d107d4e6d46ffe3d6a036a83d7587f",
    description: "EPA Region 5's April 30, 1998 memorandum and attached WasteLAN status listing for unilateral administrative orders. The Kysor entry reports both the order and activity completed May 16, 1990 (PDF p. 12); the Northernaire entry reports the order completed May 16, 1990 and the activity completed March 9, 1995 (p. 15). These are administrative-order status entries, not findings that the sites, groundwater remedy, or environmental cleanup were closed. All 21 supplied pages were read in page order and visually checked. The record predates PFAS investigation and does not establish PFAS source attribution or a Plett Road pathway."
  },
  {
    id: "214-a915d8117200",
    name: "EPA Fourth Five-Year Review — Northernaire Plating Superfund Site — September 2010.pdf",
    url: "/findings-docs/214-a915d8117200.pdf",
    year: "2010",
    category: "Superfund & groundwater cleanup",
    type: "EPA five-year review",
    format: "PDF",
    pages: 94,
    size: 16623063,
    sha256: "a915d8117200bf64acb3650b6884767bb15a12e11be057e7b307dd6166f9be32",
    description: "Signed EPA Region 5 fourth five-year review for the Northernaire Plating Superfund site. EPA reported that the remedy was functioning as intended, chromium cleanup goals had been achieved throughout the plume, and the site remedy was protective in the short and long term (PDF pp. 7, 30–31). The report also documents the shared LDFA extraction/treatment network, Clam River discharge, historical chromium/VOC monitoring and the April 2007 hydraulic-capture evaluation (pp. 20–29, 70–71). All 94 pages, maps, graphs, tables, checklist annotations and photographs were read and visually checked; weak native-text pages 2, 35 and 84 were OCR-checked. This is a historical chromium/VOC remedy review and does not establish PFAS attribution or a current Plett Road pathway."
  },
  {
    id: "215-83ebcbda08bd",
    name: "EPA Third Five-Year Review — Kysor Industrial Superfund Site — August 2010.pdf",
    url: "/findings-docs/215-83ebcbda08bd.pdf",
    year: "2010",
    category: "Superfund & groundwater cleanup",
    type: "EPA five-year review",
    format: "PDF",
    pages: 124,
    size: 21990591,
    sha256: "83ebcbda08bd1a5bd62d33fabd0ea06938b6917a16d9f4d70df9c39884573992",
    description: "Signed EPA Region 5 third five-year review for the Kysor Industrial Superfund site. EPA found the remedy protective in the short term but conditioned long-term protectiveness on effective groundwater-use controls, private-well abandonment or connection measures, continued monitoring and enforcement (PDF pp. 7, 10, 43–45). The review reports remaining VOC plume uncertainty, possible commingling with neighboring plumes, incomplete evidence for hydraulic capture in several areas, and continuing treated-groundwater discharge to the Clam River (pp. 34–42). All 124 pages, maps, ordinances, graphs, tables, handwritten checklist entries and photographs were read and visually checked; weak native-text pages 52, 53, 56 and 108 were OCR-checked. The findings concern historical VOC cleanup, not PFAS source attribution or proof of a present pathway to Plett Road."
  },
  {
    id: "216-4ff61c6d3cb5",
    name: "EPA Kysor Industrial Administrative Record Index — Update 3 — August 31, 2010.pdf",
    url: "/findings-docs/216-4ff61c6d3cb5.pdf",
    year: "2010",
    category: "Reference records",
    type: "EPA administrative-record index",
    format: "PDF",
    pages: 1,
    size: 139708,
    sha256: "4ff61c6d3cb5c6f8ae27ca26200c583aeda588fb4098155a29f5f10245a4ec36",
    description: "One-page EPA Region 5 administrative-record update listing the 2000 Kysor five-year review, the 2005 second five-year review and the 2010 third five-year review by record identifier and page count. The page was fully read and visually checked. It is an index and supplies no independent environmental, analytical, compliance or PFAS finding."
  }
];

const previews = {
  "/findings-docs/213-ff4d48eb64da.pdf": ["ff4d48eb64da75d9e1f56816b7699d66a8d107d4e6d46ffe3d6a036a83d7587f", "2146659e62641ef5fabaaff1b0017036bd82452c125891f4a57b9e263e70e693"],
  "/findings-docs/214-a915d8117200.pdf": ["a915d8117200bf64acb3650b6884767bb15a12e11be057e7b307dd6166f9be32", "50530f5265218a9f68aafc4e4bed546d1cc62c8934e04c19a2d34feda1e0fb2f"],
  "/findings-docs/215-83ebcbda08bd.pdf": ["83ebcbda08bd1a5bd62d33fabd0ea06938b6917a16d9f4d70df9c39884573992", "c381e9fa02bb67317e2ae2693a96358627d3265c5c42a3d13f4064ea3d07c7aa"],
  "/findings-docs/216-4ff61c6d3cb5.pdf": ["4ff61c6d3cb5c6f8ae27ca26200c583aeda588fb4098155a29f5f10245a4ec36", "324d293dd4a115a5f9163cab0865ec14ee326fea93fb79419322d25e802e209d"]
};

const supplemental = await readJson("app/supplemental-documents.json");
const existing239675 = supplemental.find((record) => record.sha256.startsWith("84790845"));
if (existing239675) existing239675.description = "EPA Region 5's signed September 30, 2005 third five-year review for Northernaire Plating. It found the remedy protective in the short term but tied long-term protectiveness to institutional controls and confirmation that the extraction system captured the chromium plume; the review also identified possible incomplete chromium capture and private-well/control concerns (PDF pp. 7–10, 25–31). All 85 pages, figures, graphs, tables, checklist annotations and photographs were freshly reread and visually checked; weak native-text pages 34, 35, 41 and 68 were OCR-checked. This is historical chromium/VOC evidence, not PFAS attribution or proof of a current pathway to Plett Road.";
const existing239745 = supplemental.find((record) => record.sha256.startsWith("299f46bb"));
if (existing239745) existing239745.description = "EPA Region 5's signed September 30, 2005 second five-year review for the Kysor Industrial site. The report found short-term protectiveness while conditioning long-term protectiveness on cleanup completion and effective institutional controls; it identified groundwater-use control gaps, possible incomplete capture or capture of a neighboring plume, and air-emission requirement discrepancies (PDF pp. 7–11, 29–41). All 118 pages, maps, graphs, tables, ordinances, checklist annotations and photographs were freshly reread and visually checked; 17 weak native-text pages were OCR-checked. This is historical VOC/chromium cleanup evidence and does not establish PFAS attribution or a current Plett Road pathway.";
for (const record of records) if (!supplemental.some((item) => item.sha256 === record.sha256)) supplemental.push(record);
await writeJson("app/supplemental-documents.json", supplemental);

const previewManifest = await readJson("app/first-page-preview-manifest.json");
const provenance = await readJson("app/document-preview-provenance.json");
for (const [url, [sha, previewSha]] of Object.entries(previews)) {
  const preview = `/first-page-previews/by-sha256/${sha}.webp`;
  previewManifest[url] = preview;
  provenance[url] = {
    sourceSha256: sha,
    page: 1,
    preview,
    previewSha256: previewSha,
    verifiedAt: addedAt,
    verificationMethod: "Actual first PDF page rendered during the complete page-order review; full page preserved.",
    scope: "Preview provenance only; whole-document verification is recorded in the six-batch intake audit."
  };
}
await writeJson("app/first-page-preview-manifest.json", previewManifest);
await writeJson("app/document-preview-provenance.json", provenance);

const activity = await readJson("app/record-activity.json");
for (const record of records) activity.records[record.url] = { addedAt, fingerprint: fingerprint(record) };
for (const record of supplemental.filter((item) => ["b7620af8", "84790845", "299f46bb"].some((prefix) => item.sha256.startsWith(prefix)))) {
  activity.records[record.url] = { ...(activity.records[record.url] ?? {}), updatedAt: addedAt, fingerprint: fingerprint(record) };
}
await writeJson("app/record-activity.json", activity);

const audit = {
  auditVersion: 1,
  intake: "EPA DOCS six-micro-batch intake",
  batch: "EPA-2026-09-23-B1",
  batchNumber: 1,
  totalBatches: 6,
  sourceOrderPreserved: true,
  reviewedAt: addedAt,
  rules: {
    recordBoundariesPreserved: true,
    pageOrderReviewRequired: true,
    filenameOnlyDeduplicationProhibited: true,
    statusesSeparated: true
  },
  totals: { records: 7, pages: 465, exactExistingRecords: 3, newDistinctRecords: 4 },
  records: [
    { supplied: "EPA_05_234897.pdf", sha256: "b7620af87938165207a12d127689ca240e887565412c773210c4dd54c8510299", bytes: 919625, pages: 22, ocrCheckedPages: [11], disposition: "exact-existing-record", canonicalRecordId: "095-b7620af87938", statuses: { received: true, extracted: true, reviewed: true, verified: true, published: true } },
    { supplied: "EPA_05_234898.pdf", sha256: "ff4d48eb64da75d9e1f56816b7699d66a8d107d4e6d46ffe3d6a036a83d7587f", bytes: 557323, pages: 21, ocrCheckedPages: [], disposition: "new-distinct-record", canonicalRecordId: "213-ff4d48eb64da", statuses: { received: true, extracted: true, reviewed: true, verified: true, published: false } },
    { supplied: "EPA_05_239675.pdf", sha256: "84790845bb27beb66b8041efde1417691bcc5bc1d4d99046c54c28844f56f9a9", bytes: 9423203, pages: 85, ocrCheckedPages: [34,35,41,68], disposition: "exact-existing-record", canonicalRecordId: "096-84790845bb27", statuses: { received: true, extracted: true, reviewed: true, verified: true, published: true } },
    { supplied: "EPA_05_239745.pdf", sha256: "299f46bb09f275f2d749dc285c3a90e7e381b76977523b3e3537f6a8338821a2", bytes: 13165120, pages: 118, ocrCheckedPages: [43,44,51,53,57,61,65,69,71,74,76,79,82,84,90,101,105], disposition: "exact-existing-record", canonicalRecordId: "097-299f46bb09f2", statuses: { received: true, extracted: true, reviewed: true, verified: true, published: true } },
    { supplied: "EPA_05_373434.pdf", sha256: "a915d8117200bf64acb3650b6884767bb15a12e11be057e7b307dd6166f9be32", bytes: 16623063, pages: 94, ocrCheckedPages: [2,35,84], disposition: "new-distinct-record", canonicalRecordId: "214-a915d8117200", statuses: { received: true, extracted: true, reviewed: true, verified: true, published: false } },
    { supplied: "EPA_05_373482.pdf", sha256: "83ebcbda08bd1a5bd62d33fabd0ea06938b6917a16d9f4d70df9c39884573992", bytes: 21990591, pages: 124, ocrCheckedPages: [52,53,56,108], disposition: "new-distinct-record", canonicalRecordId: "215-83ebcbda08bd", statuses: { received: true, extracted: true, reviewed: true, verified: true, published: false } },
    { supplied: "EPA_05_374468.pdf", sha256: "4ff61c6d3cb5c6f8ae27ca26200c583aeda588fb4098155a29f5f10245a4ec36", bytes: 139708, pages: 1, ocrCheckedPages: [], disposition: "new-distinct-record", canonicalRecordId: "216-4ff61c6d3cb5", statuses: { received: true, extracted: true, reviewed: true, verified: true, published: false } }
  ],
  limitations: [
    "Historical Superfund records concern VOC and chromium remedies; they do not independently establish PFAS source attribution or a present pathway to Plett Road.",
    "EPA_05_374468.pdf is an index page and carries no independent environmental finding."
  ]
};
await writeJson("app/epa-docs-six-batch-intake-audit-2026-09-23.json", audit);
