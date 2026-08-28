import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname.slice(1));
const source = "F:/MASTER-FILE-CATEGORIZED/09 - Correspondence & Letters";
const inventoryPath = path.resolve(root, "../category09-ocr-cache/inventory.json");
const detailPath = path.resolve(root, "../category09-ocr-cache/ocr-detail.json");
const targetDirectory = path.join(root, "public", "correspondence-docs");

const descriptionFor = (name) => {
  const value = name.toLowerCase();
  if (value.includes("ppn email exchange 2")) return "August 2013 pre-public-notice email preserving the City's comments on the draft NPDES permit and DEQ's response that selenium would be removed while other limits remained under review.";
  if (value.includes("response to comments email")) return "August 2013 NPDES draft-permit correspondence recording DEQ's response on cyanide, copper and mercury monitoring and the expectation that further negotiations could continue during public notice.";
  if (value.includes("ppn email exchange")) return "August 2013 pre-public-notice exchange concerning proposed cyanide, copper, mercury and selenium requirements in the Cadillac WWTP draft NPDES permit.";
  if (value.includes("oct 2017 bod")) return "October 2017 response to a BOD violation. The City described operational changes after experimenting with high-strength apple-processing waste and reported chlorine, RAS/WAS and equalization adjustments.";
  if (value.includes("2023-01-26") || value.includes("fw_ timeframe")) return "January 26, 2023 correspondence proposing a schedule for Cadillac's MAHL/local-limits review and IPP procedures-manual revisions.";
  if (value.includes("2023-01-27") || value.includes("re_ timeframe")) return "January 27, 2023 correspondence documenting EGLE's approval of extensions for the MAHL/local-limits submittal and IPP procedures-manual revision.";
  if (value.includes("class a eq")) return "May 4, 2026 EGLE Class A exceptional-quality biosolids letter. It reports February 25 PFOS and PFOA results below 1.7 micrograms per kilogram and authorizes continued land application under the stated Interim Strategy monitoring conditions.";
  if (value.includes("asset management conversation")) return "Email chain concerning NPDES asset-management documentation, alternate discharge seasons and disinfection mapping. DEQ stated that the City had not yet supplied sufficient asset-management documentation.";
  if (value.includes("storm water coverage")) return "Correspondence documenting DEQ's request that the WWTP's No Exposure Certification be approved before the NPDES permit proceeded to public notice.";
  if (value.includes("asset mngmnt")) return "October 2018 asset-management correspondence in which DEQ requested a meeting and supporting documentation and discussed carrying current permit requirements forward.";
  if (value.includes("basis for decision memo-draft")) return "Draft August 2018 NPDES basis-for-decision memorandum. It is retained as a distinct draft revision because its status and permit-development context differ from final decision records.";
  if (value.includes("wwtp basis for decision")) return "Cadillac WWTP NPDES basis-for-decision memorandum explaining proposed effluent limits and permit rationale. It is retained as a distinct version after page, text and rendering review.";
  if (value.includes("email response 9-25-13")) return "September 25, 2013 NPDES correspondence recording a reduction in proposed cyanide monitoring from weekly to monthly while retaining the limit and reasonable-potential determination.";
  if (value.includes("fecal method")) return "April 2018 correspondence documenting Cadillac's change from Standard Method 9222D to Colilert-18 for E. coli reporting and the associated CFU-to-MPN reporting convention.";
  if (value.includes("cadillacppnletter")) return "April 23, 2008 pre-public-notice letter transmitting the draft permit, public notice and fact sheet and setting a May 16 comment deadline.";
  if (value.includes("reporting bod exceed")) return "May 2017 email reporting daily BOD exceedances of 11.2, 10.7 and 13.8 mg/L on May 3–5, describing seasonal and wasting adjustments, and stating that the facility returned to compliance the following week.";
  if (value.includes("box advertis")) return "February 2024 email and public-notice package concerning publication of Cadillac's 2023 Industrial Pretreatment Program significant noncompliance (SNC) notice.";
  if (value.includes("fw_ city of cadillac")) return "May 2022 Foster Swift correspondence forwarding the City's response concerning Industrial Pretreatment Program obligations and a requested schedule extension.";
  if (value.includes("general purpose letter")) return "July 24, 2003 DEQ response to City comments on NPDES permit duration, residual chlorine and UV disinfection, lindane, mercury and toxicity provisions.";
  if (value.includes("testamerica")) return "October 2018 PFAS sampling correspondence. DEQ identified Avon Automotive as a probable source based on the reviewed safety-data information and discussed effluent and landfill follow-up sampling; this is preserved as an agency statement, not independently proven source attribution.";
  if (value.includes("wet email")) return "September 2019 whole-effluent-toxicity correspondence reporting chronic toxicity results, recommending monthly monitoring and noting that a Phase I toxicity-identification evaluation was underway.";
  if (value.includes("2006-12-07") && value.includes("sw coc")) return "January 3, 2007 storm-water certificate-of-coverage issuance letter for Wexford County Landfill under certificate MIS111450.";
  if (value.includes("elo recommendations")) return "August 2007 preliminary effluent-limit recommendations for a proposed treated-landfill-leachate discharge. The letter expressly precedes antidegradation review and final permitting.";
  if (value.includes("asbestos notification")) return "Official asbestos notification package associated with a planned Wexford County Landfill renovation or demolition activity; retained separately because the filing date and project record are distinct.";
  if (value.includes("flare performance")) return "February 2026 EGLE correspondence and letter concerning approval and requirements for a Wexford County Landfill flare performance-test plan.";
  if (value.includes("lab report 2510354")) return "Email routing wrapper with the attached laboratory report. It remains distinct from the standalone report because it preserves transmittal correspondence and attachment context.";
  if (value.includes("phone log")) return "Handwritten October 24, 2019 phone log that appears to record discussion of Cadillac's residuals-management-plan modification and a past land-application site. The handwritten reading is stated cautiously and the scan remains the controlling source.";
  if (value.includes("re_ city of cadillac")) return "October 25, 2021 correspondence and attached Foster Swift letter describing the City's proposed consultant engagement and response schedule for IPP and local-limits issues.";
  if (value.includes("solids & % moisture")) return "February 2019 PFAS correspondence discussing biosolids resampling, solids/moisture handling and the expectation that Wexford County Landfill leachate would transition away from discharge to the WWTP.";
  if (value.includes("viton")) return "April 9, 2018 Chemours product-composition letter stating that specified listed materials were not intentionally used in Viton GBL-200/VTR-7564. The letter also states that substances not purposely added were not tested, so it is not treated as proof of absence.";
  if (value === "spill-at-1121-wwtp.jpg") return "Color as-received scan of the January 12, 2016 Cadillac WWTP spill-notification letter concerning an American Waste leachate release during offloading. It records containment, storm-drain protection, removal of contaminated snow and soil, and preventive hose-depth and driver procedures.";
  if (value === "sw coc issued letter.pdf") return "June 28, 2012 storm-water certificate-of-coverage issuance letter for Wexford County Landfill under certificate MIS111718.";
  return "Agency, municipal or related correspondence preserved as a distinct Category 09 record after page-level, OCR, metadata and cross-library review.";
};

const typeFor = (name) => {
  const value = name.toLowerCase();
  if (value.includes("asbestos notification")) return "Asbestos notification";
  if (value.includes("flare performance")) return "Air compliance correspondence";
  if (value.includes("sw coc") || value.includes("storm water")) return "Storm-water correspondence";
  if (value.includes("wet email")) return "WET monitoring correspondence";
  if (value.includes("viton")) return "Product-composition letter";
  if (value.includes("lab report 2510354")) return "Laboratory transmittal";
  if (value.includes("spill-at")) return "Spill notification correspondence";
  if (value.includes("class a eq") || value.includes("solids & % moisture")) return "Biosolids and PFAS correspondence";
  if (value.includes("testamerica")) return "PFAS monitoring correspondence";
  if (value.includes("bod") || value.includes("phone log")) return "Compliance correspondence";
  if (value.includes("categorical") || value.includes("ipp") || value.includes("timeframe") || value.includes("city of cadillac")) return "IPP and local-limits correspondence";
  if (value.includes("basis for decision")) return "Permit decision memo";
  if (value.includes("ppn") || value.includes("permit") || value.includes("fecal method") || value.includes("asset")) return "NPDES permit correspondence";
  if (value.includes("elo recommendations")) return "Landfill discharge correspondence";
  return "Regulatory correspondence";
};

const cleanName = (name) => {
  let cleaned = name.replace(/^09 - Correspondence & Letters_/, "").replace(/^Duplicates_/, "").replace(/\.pdf\.pdf$/i, ".pdf");
  const replacements = new Map([
    ["Phone Log 10-24-2019.pdf", "2019-10-24 - EGLE Handwritten Phone Log - Cadillac WWTP RMP Modification.pdf"],
    ["RE_ City of Cadillac .pdf", "2021-10-25 - RE City of Cadillac - IPP response schedule.pdf"],
    ["RE_ PLEASE look at this - FW_ info on % solids & % moisture - Update.pdf", "2019-02-12 - PFAS solids and moisture discussion update.pdf"],
    ["FW_ Michigan Department of Environment_ Great Lakes_ and Energy - Lab Report 2510354.pdf", "FW_ Michigan Department of Environment, Great Lakes, and Energy - Lab Report 2510354.pdf"],
  ]);
  return replacements.get(cleaned) ?? cleaned;
};

const yearFor = (original, cleaned) => {
  const explicit = original.match(/(?:^|_)((?:19|20)\d{2})[-_]/)?.[1];
  if (explicit) return explicit;
  const value = cleaned.toLowerCase();
  if (value.includes("asset management") || value.includes("asset mngmnt") || value.includes("fecal method") || value.includes("testamerica") || value.includes("viton") || value.includes("basis for decision memo-draft")) return "2018";
  if (value.includes("wwtp basis for decision") || value.includes("email response 9-25-13")) return "2013";
  if (value.includes("cadillacppnletter")) return "2008";
  if (value.includes("reporting bod")) return "2017";
  if (value.includes("box advertis")) return "2024";
  if (value.includes("city of cadillac")) return "2022";
  if (value.includes("general purpose")) return "2003";
  if (value.includes("wet email") || value.includes("phone log") || value.includes("solids and moisture")) return "2019";
  if (value.includes("lab report 2510354")) return "2025";
  if (value.includes("ipp response schedule")) return "2021";
  if (value.includes("spill-at")) return "2016";
  if (value === "sw coc issued letter.pdf") return "2012";
  return "Undated";
};

const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
const detail = JSON.parse(await readFile(detailPath, "utf8"));
const detailByHash = new Map(detail.records.map((record) => [record.sha256, record]));
const catalogFiles = (await readdir(path.join(root, "app"))).filter((name) => name.endsWith("-documents.json") && name !== "correspondence-documents.json");
const existing = new Map();
for (const file of catalogFiles) {
  for (const record of JSON.parse(await readFile(path.join(root, "app", file), "utf8"))) existing.set(record.sha256, { file, record });
}

await mkdir(targetDirectory, { recursive: true });
const records = [];
const reused = [];
for (const item of inventory.records) {
  const match = existing.get(item.sha256);
  const isSpill = item.name === "Spill-at-1121-WWTP.jpg";
  if (match && !isSpill) {
    reused.push({ source: item.name, existing: match.record.name, catalog: match.file });
    continue;
  }
  const name = cleanName(item.name);
  const hash = createHash("sha256").update(await readFile(item.source)).digest("hex");
  if (hash !== item.sha256) throw new Error(`Source changed after audit: ${item.name}`);
  const number = String(records.length + 1).padStart(3, "0");
  const id = `corr-${number}-${item.sha256.slice(0, 12)}`;
  const extension = item.format.toLowerCase() === "jpg" ? ".jpg" : ".pdf";
  const targetName = `${id}${extension}`;
  await copyFile(item.source, path.join(targetDirectory, targetName));
  records.push({
    id,
    name,
    url: `/correspondence-docs/${targetName}`,
    year: yearFor(item.name, name),
    category: "Correspondence & letters",
    type: typeFor(name),
    format: item.format,
    pages: item.actual_pages,
    size: item.bytes,
    sha256: item.sha256,
    description: descriptionFor(name),
  });
}

records.sort((a, b) => a.year.localeCompare(b.year) || a.name.localeCompare(b.name));
const publishedBytes = records.reduce((total, record) => total + record.size, 0);
const reviewedPages = inventory.records.reduce((total, record) => total + record.actual_pages, 0);
const publishedPages = records.reduce((total, record) => total + record.pages, 0);
const selectedDetails = records.map((record) => detailByHash.get(record.sha256));
const publishedOcrPages = selectedDetails.reduce((total, record) => total + record.ocr_pages, 0);
const publishedOcrPagesWithText = selectedDetails.reduce((total, record) => total + record.ocr_pages_with_text, 0);

const audit = {
  stats: {
    sourceFilesReviewed: inventory.records.length,
    sourcePdfRecords: inventory.records.filter((record) => record.format === "PDF").length,
    sourceImageRecords: inventory.records.filter((record) => record.format !== "PDF").length,
    reviewedPages,
    sourceOcrPages: detail.records.reduce((total, record) => total + record.ocr_pages, 0),
    sourceOcrPagesWithText: detail.records.reduce((total, record) => total + record.ocr_pages_with_text, 0),
    exactDuplicateGroupsWithinSource: 0,
    renderIdenticalByteDifferentGroupsWithinSource: 0,
    crossCategoryCopiesReferencedElsewhere: reused.length,
    existingRecordMovedIntoCategory: 1,
    newDistinctRecords: records.length - 1,
    finalDistinctRecords: records.length,
    duplicateLabelsRemoved: 4,
    publishedPages,
    publishedOcrPages,
    publishedOcrPagesWithText,
    publishedBytes,
  },
  methods: [
    "SHA-256 comparison within the entire supplied folder and against every published evidence catalog",
    "Page-count, PDF metadata and embedded-text review for every file",
    "OCR on every scan-only or sparse-text page, with page-level confidence and readability checks",
    "Normalized extracted-text and rendered-page sequence comparison for byte-different candidates",
    "Conservative retention of revisions, transmittal wrappers, handwritten notes, annotations and agency stamps when they carry distinct evidence",
  ],
  decisions: [
    {
      name: "Fourteen exact cross-category copies",
      reason: "The source bytes exactly match records already preserved in the NPDES or IPP libraries. Those canonical records are referenced through site-wide search and are not republished in Category 09.",
    },
    {
      name: "Spill-at-1121-WWTP.jpg",
      reason: "The previously added color spill scan is moved into its proper Category 09 archive. Its asset is not duplicated, and its distinct visible annotations and receipt stamps remain preserved.",
    },
    {
      name: "Four source filenames beginning Duplicates_",
      reason: "No identical content exists in the published library. The records are retained once, their misleading source prefix is removed, and the original source hash remains recorded.",
    },
    {
      name: "Laboratory-report email wrapper",
      reason: "The wrapper includes routing correspondence plus the attached report. It is materially distinct from the standalone laboratory report and remains separately searchable.",
    },
    {
      name: "Drafts, revisions and closely related email chains",
      reason: "Related subject matter alone was not treated as duplication. Distinct status, wording, attachments, annotations or correspondence context warranted retention.",
    },
  ],
  reused,
};

await writeFile(path.join(root, "app", "correspondence-documents.json"), `${JSON.stringify(records, null, 2)}\n`);
await writeFile(path.join(root, "app", "correspondence-audit.json"), `${JSON.stringify(audit, null, 2)}\n`);

const supplementalPath = path.join(root, "app", "supplemental-documents.json");
const supplementalRecords = JSON.parse(await readFile(supplementalPath, "utf8"));
const updatedSupplementalRecords = supplementalRecords.filter((record) => record.sha256 !== "1872d030ac1d32dcf078661a462fe2fdf5c064557ade0e7a8ac97e32f976be76");
await writeFile(supplementalPath, `${JSON.stringify(updatedSupplementalRecords, null, 2)}\n`);

const supplementalAuditPath = path.join(root, "app", "supplemental-audit.json");
const supplementalAudit = JSON.parse(await readFile(supplementalAuditPath, "utf8"));
supplementalAudit.stats = {
  suppliedFiles: 19,
  newDistinctRecords: 13,
  exactExistingRecordsReused: 3,
  duplicateCopiesSuppressed: 2,
  outOfScopeExcluded: 1,
  publishedBytes: 26197168,
};
supplementalAudit.decisions = supplementalAudit.decisions.filter((decision) => decision.name !== "Spill-at-1121-WWTP.jpg");
await writeFile(supplementalAuditPath, `${JSON.stringify(supplementalAudit, null, 2)}\n`);
console.log(JSON.stringify({ records: records.length, reused: reused.length, publishedPages, publishedOcrPages, publishedBytes }, null, 2));
