import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname.slice(1));
const source = "F:/MASTER-FILE-CATEGORIZED/10 - Process & Site Documents";
const inventoryPath = path.resolve(root, "../category10-ocr-cache/inventory.json");
const detailPath = path.resolve(root, "../category10-ocr-cache/ocr-detail.json");
const targetDirectory = path.join(root, "public", "process-site-docs");

const descriptions = new Map([
  ["2007 - Stantec Drawing 0P1.01 - Process Flow Diagram I - Cadillac WWTP 2007 Improvements.pdf", "Stantec process-flow drawing 0P1.01 for the 2007 Cadillac WWTP improvements. The scanned drawing traces tertiary filtration, bypass, backwash, drain and related process-service connections."],
  ["2025-01-15 - Digester Detention Times.pdf", "Four-page 2024 digester hold-time worksheet using two 150,000-gallon digesters. It lists daily sludge input and calculated detention days by month; the spreadsheet was created January 15, 2025."],
  ["2007 - Stantec Drawing 0P1.02 - Process Flow Diagram II - Cadillac WWTP 2007 Improvements.pdf", "Stantec process-flow drawing 0P1.02 for the 2007 Cadillac WWTP improvements. It maps return and waste activated sludge, equalization-basin drainage, ferric-chloride feed and aeration-tank connections."],
  ["2007 - Stantec Drawing 0P1.03 - Process Flow Diagram III - Cadillac WWTP 2007 Improvements.pdf", "Stantec process-flow drawing 0P1.03 for the 2007 Cadillac WWTP improvements. It documents process-service, sludge, air, chlorine-contact, sand-filter and influent-sewer connections."],
  ["2014-10-22 - Cadillac WWTP Classification Letter.pdf", "October 22, 2014 DEQ notice classifying the Cadillac WWTP, NPDES permit MI0020257, as a Class A wastewater treatment facility and describing certified-operator obligations."],
  ["2015-01-21 - Wexford County Board of Commissioners Minutes.pdf", "January 21, 2015 Wexford County Board minutes. The agenda includes the landfill remedial-action-plan area and related county business; the complete minutes are retained for civic context."],
  ["2015-10-07 - Wexford County Board of Commissioners Minutes.pdf", "October 7, 2015 Wexford County Board minutes recording discussion of a proposed landfill injection well, disposal of generated fluids, a planned public presentation and water-service concerns in the remedial-action-plan area."],
  ["2017-11-15 - Wexford County Board of Commissioners Minutes.pdf", "November 15, 2017 Wexford County Board minutes documenting an American Waste presentation on a proposed Class I non-hazardous injection well for landfill leachate, public comments and the Board's unanimously approved opposition resolution."],
  ["Cadillac Wastewater Treatment Plant Brochure - Aerial Photograph Cover.pdf", "Nine-page historical Cadillac WWTP brochure with an aerial-photograph cover. It describes treatment performance and illustrates screw pumping, equalization, grit removal, primary and secondary treatment, rotating biological contactors, sand filtration, chlorination and solids handling."],
  ["2007 - Cadillac WWTP History Note, Topographic Map and Aerial Photograph.pdf", "Three-page historical site package: a note summarizing the 1995-1996 clarification, biosolids-storage and fine-bubble-aeration expansion plus the 2003 UV-disinfection upgrade, followed by a topographic map and aerial photograph. File metadata dates the package to 2007."],
  ["2012 - Cadillac WWTP Maps and Flow Diagrams.pdf", "Five-page WWTP history, site-plan and process-flow package. It describes the plant's treatment train and prior upgrades and preserves associated map and flow-diagram sheets; file metadata dates the compiled package to 2012."],
  ["2019 - Cadillac WWTP 99 Percent Flow Data.pdf", "Six-page DEQ-created spreadsheet export of ordered October-November ammonia, CBOD and related flow-distribution data used for high-percentile review. The file metadata identifies a June 2019 creation date."],
  ["2023 - Digester Temperatures.pdf", "Daily 2023 digester-temperature worksheet arranged by month. It preserves the operational temperature series and its source spreadsheet metadata."],
  ["2022-11-30 - Plant Sewer Lines.pdf", "AutoCAD plant sewer-line plan dated November 30, 2022. The drawing maps foundry restrooms, laboratories, filter-press effluent, non-contact water, manholes and other internal wastewater connections."],
  ["2009 - Cadillac WWTP Process Flow Diagram.pdf", "Three-sheet Cadillac WWTP process-flow diagram printed from the engineering drawing set in November 2009. OCR was used to index the scanned labels while the original drawings remain the controlling source."],
]);

const cleanName = (name) => {
  const replacements = new Map([
    ["0P1-01 Process Flow.pdf", "2007 - Stantec Drawing 0P1.01 - Process Flow Diagram I - Cadillac WWTP 2007 Improvements.pdf"],
    ["10 - Process & Site Documents_2025-01-15__-6881359030424666038__Digester Detention Times.pdf.pdf", "2025-01-15 - Digester Detention Times.pdf"],
    ["2014_1022_Cadillac WWTP_Classification Letter.pdf", "2014-10-22 - Cadillac WWTP Classification Letter.pdf"],
    ["2015-01-21_Wexford_County_BOC_Minutes ~2.pdf", "2015-01-21 - Wexford County Board of Commissioners Minutes.pdf"],
    ["2015-10-07_Wexford_County_BOC_Minutes ~2.pdf", "2015-10-07 - Wexford County Board of Commissioners Minutes.pdf"],
    ["2017-11-15_Wexford_County_BOC_Minutes ~2.pdf", "2017-11-15 - Wexford County Board of Commissioners Minutes.pdf"],
    ["Cadillac WWTP History Note - 1995-1996 Expansion (Clarification, Biosolids Storage, Fine Bubble Aeration) and 2003 UV Disinfection Upgrade.pdf", "2007 - Cadillac WWTP History Note, Topographic Map and Aerial Photograph.pdf"],
    ["Cadillac WWTP Maps and Flow Diagrams (series-verified).pdf", "2012 - Cadillac WWTP Maps and Flow Diagrams.pdf"],
    ["Cadillac WWTP_99% Flow Data.pdf", "2019 - Cadillac WWTP 99 Percent Flow Data.pdf"],
    ["Degester Temps.pdf", "2023 - Digester Temperatures.pdf"],
    ["PLANT SEWER LINES (1).pdf", "2022-11-30 - Plant Sewer Lines.pdf"],
    ["Process Flow Diagram.pdf", "2009 - Cadillac WWTP Process Flow Diagram.pdf"],
  ]);
  return replacements.get(name) ?? name.replace(/\.pdf\.pdf$/i, ".pdf");
};

const yearFor = (name) => name.match(/^((?:19|20)\d{2})/)?.[1] ?? (name.startsWith("Cadillac Wastewater") ? "Undated" : "Undated");

const typeFor = (name) => {
  const value = name.toLowerCase();
  if (value.includes("process flow")) return "Process-flow diagram";
  if (value.includes("sewer lines")) return "Site utility plan";
  if (value.includes("maps and flow") || value.includes("topographic map")) return "Site history and mapping";
  if (value.includes("brochure")) return "Facility brochure";
  if (value.includes("board of commissioners")) return "County meeting minutes";
  if (value.includes("classification letter")) return "Facility classification";
  if (value.includes("detention")) return "Digester detention data";
  if (value.includes("digester temperatures")) return "Digester temperature data";
  if (value.includes("99 percent flow")) return "Operational flow data";
  return "Process and site record";
};

const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
const detail = JSON.parse(await readFile(detailPath, "utf8"));
const detailByHash = new Map(detail.records.map((record) => [record.sha256, record]));
const catalogFiles = (await readdir(path.join(root, "app"))).filter((name) => name.endsWith("-documents.json") && name !== "process-site-documents.json");
const existing = new Map();
for (const file of catalogFiles) {
  for (const record of JSON.parse(await readFile(path.join(root, "app", file), "utf8"))) existing.set(record.sha256, { file, record });
}

await mkdir(targetDirectory, { recursive: true });
const records = [];
const reused = [];
for (const item of inventory.records) {
  const match = existing.get(item.sha256);
  if (match) {
    reused.push({ source: item.name, existing: match.record.name, catalog: match.file });
    continue;
  }
  const name = cleanName(item.name);
  const hash = createHash("sha256").update(await readFile(item.source)).digest("hex");
  if (hash !== item.sha256) throw new Error(`Source changed after audit: ${item.name}`);
  const number = String(records.length + 1).padStart(3, "0");
  const id = `process-site-${number}-${item.sha256.slice(0, 12)}`;
  const targetName = `${id}.pdf`;
  await copyFile(item.source, path.join(targetDirectory, targetName));
  records.push({
    id,
    name,
    url: `/process-site-docs/${targetName}`,
    year: yearFor(name),
    category: "Process & site documents",
    type: typeFor(name),
    format: "PDF",
    pages: item.actual_pages,
    size: item.bytes,
    sha256: item.sha256,
    description: descriptions.get(name) ?? "Process, facility or site record retained after complete page-level, OCR, metadata and cross-library review.",
  });
}

records.sort((a, b) => a.year.localeCompare(b.year) || a.name.localeCompare(b.name));
const selectedDetails = records.map((record) => detailByHash.get(record.sha256));
const audit = {
  stats: {
    sourceFilesReviewed: inventory.records.length,
    sourcePdfRecords: inventory.records.length,
    reviewedPages: inventory.records.reduce((total, record) => total + record.actual_pages, 0),
    sourceOcrPages: detail.records.reduce((total, record) => total + record.ocr_pages, 0),
    sourceOcrPagesWithText: detail.records.reduce((total, record) => total + record.ocr_pages_with_text, 0),
    manuallyVerifiedMapAndAerialPages: 3,
    exactDuplicateGroupsWithinSource: 0,
    renderIdenticalByteDifferentGroupsWithinSource: 0,
    crossCategoryCopiesReferencedElsewhere: reused.length,
    finalDistinctRecords: records.length,
    publishedPages: records.reduce((total, record) => total + record.pages, 0),
    publishedOcrPages: selectedDetails.reduce((total, record) => total + record.ocr_pages, 0),
    publishedOcrPagesWithText: selectedDetails.reduce((total, record) => total + record.ocr_pages_with_text, 0),
    publishedBytes: records.reduce((total, record) => total + record.size, 0),
    duplicateLikeLabelsRemoved: 3,
  },
  methods: [
    "SHA-256 comparison within the supplied folder and against every published evidence catalog",
    "Page-count, PDF metadata and embedded-text review for all 62 supplied pages",
    "OCR on every scan-only or sparse-text page, with visual inspection of low-text map and aerial pages",
    "Normalized extracted-text and rendered-page sequence comparison for byte-different candidates",
    "Conservative retention of compiled map packages, civic minutes and distinct engineering sheets",
  ],
  decisions: [
    {
      name: "Three exact cross-category copies",
      reason: "The CWSRF funding proposal, Certified Operator Response Form and Wexford Landfill flow-rate worksheet exactly match records already preserved in other catalogs. They remain reachable through site-wide search and are not republished here.",
    },
    {
      name: "Three filenames ending ~2",
      reason: "Content, rendering and hashes show these county-minute files are distinct records, not duplicate copies. The ambiguous source suffix is removed from their displayed names.",
    },
    {
      name: "Process-flow drawing series and compiled map packages",
      reason: "Individual engineering sheets and compiled history/map packages have distinct page sequences and evidentiary roles, so each is retained once.",
    },
    {
      name: "Three low-text map and aerial pages",
      reason: "Visual inspection confirmed that the pages are intact topographic maps and aerial imagery. They are not failed OCR or corrupt files.",
    },
    {
      name: "Undated brochure",
      reason: "The PDF creation timestamp is preserved in the audit metadata but is not treated as the brochure's publication date because no issue date is printed in the record.",
    },
  ],
  reused,
};

await writeFile(path.join(root, "app", "process-site-documents.json"), `${JSON.stringify(records, null, 2)}\n`);
await writeFile(path.join(root, "app", "process-site-audit.json"), `${JSON.stringify(audit, null, 2)}\n`);
console.log(JSON.stringify({ records: records.length, reused: reused.length, publishedPages: audit.stats.publishedPages, publishedOcrPages: audit.stats.publishedOcrPages, publishedBytes: audit.stats.publishedBytes }, null, 2));
