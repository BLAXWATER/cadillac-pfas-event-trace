import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname.slice(1));
const source = "F:/MASTER-FILE-CATEGORIZED/11 - Form Submissions (online portal)";
const inventoryPath = path.resolve(root, "../category11-ocr-cache/inventory.json");
const detailPath = path.resolve(root, "../category11-ocr-cache/ocr-detail.json");
const targetDirectory = path.join(root, "public", "form-submission-docs");

const excludedDuplicates = new Map([
  ["64b4ef9cd07ec8c4d8cd7e6ffe99bab63dfae8605751e9cc0e9be572dfaf4fb7", "Scan-only derivative of HNQ-VZP8-TWNRX v1; the born-digital portal record is retained."],
  ["eda79e4d4c2deac573bef3ac2f365be72790e370da31310eb4b1785662e94db8", "Second HQB-6T2F-9M76H v1 export created one second from the retained copy with the same pages and perceptual page hashes."],
]);

const existingLocalAssets = new Map([
  ["00d98416b456c77073324bf3e2a4c011e3c5d2cc86c8159c41e1c6674ddf6bc5", "/docs/2019-06-28-source-status.pdf"],
]);

const formTitles = new Map([
  ["HNH-M790-67ZPK", "Biosolids annual report"],
  ["HNH-YJTD-MY6A8", "No Exposure Certification"],
  ["HNT-5SPH-XVKKZ", "Biosolids annual report"],
  ["HNY-0A3C-HVRY7", "IPP annual report"],
  ["HP3-HWDR-V8Y73", "Biosolids annual report"],
  ["HP5-16EW-CW2T4", "Schedule of compliance submittal"],
  ["HPB-KP8T-GKSNS", "Additional monitoring certification"],
  ["HPC-K20Z-68T3J", "Biosolids annual report"],
  ["HPG-1ZNB-Y56ZQ", "IPP annual report"],
  ["HPG-CXVZ-DDE1A", "Biosolids PFAS monitoring report"],
  ["HPN-5DCS-H4WTR", "Biosolids annual report"],
  ["HPP-2914-8S45C", "PFAS POTW effluent monitoring report"],
  ["HPS-A3KN-2FH30", "IPP annual report"],
  ["HPS-NR5G-MY95T", "No Exposure Certification renewal"],
  ["HPV-1RCJ-X06GE", "PFAS POTW effluent monitoring report"],
  ["HPY-PZSD-5P4KK", "Biosolids annual report"],
  ["HQ1-1PD1-TAM4K", "PFAS POTW effluent monitoring report"],
  ["HQ2-3J17-F59S4", "IPP annual report"],
  ["HQ4-SQ4J-259F6", "PFAS POTW effluent monitoring report"],
  ["HQ7-24YS-A06A1", "PFAS POTW effluent monitoring report"],
  ["HQ7-KAAW-2S9Y5", "Biosolids annual report"],
  ["HQB-6T2F-9M76H", "Biosolids PFAS monitoring report"],
  ["HQB-BNKM-1SC3Q", "IPP annual report"],
  ["HQG-GM42-A2DBC", "Biosolids annual report"],
  ["HNJ-P0ZX-8AVDS", "IPP PFAS summary report"],
  ["HNQ-VZP8-TWNRX", "IPP PFAS status report"],
  ["HQP-KKME-72W1M", "IPP unscheduled submission for approval"],
  ["HQQ-0ZQQ-VCZ9T", "IPP unscheduled submission for approval"],
  ["HNN-0QFE-AG22Q", "IPP annual report"],
  ["HNV-XK97-EV0GR", "IPP PFAS status report"],
  ["HNX-E8Q7-TQ4BF", "Schedule of compliance submittal"],
  ["HP1-NF8B-MDEG6", "Schedule of compliance submittal"],
  ["HP5-16GH-VNKPV", "Schedule of compliance submittal"],
  ["HP6-YDST-46BJ3", "IPP annual report"],
  ["HPC-F6W0-X1G7P", "Biosolids PFAS monitoring report"],
  ["HPC-RJ1M-FCGM7", "Schedule of compliance submittal"],
  ["HPD-MWSX-Y48BC", "PFAS POTW effluent monitoring report"],
  ["HPJ-N5BJ-2CYH5", "PFAS POTW effluent monitoring report"],
  ["HPR-V2MX-EVFMF", "Pollutant Minimization Program annual status report"],
  ["HQ0-715X-88YTN", "PFAS POTW effluent monitoring report"],
  ["HQ6-MRKV-Q3MJJ", "Additional monitoring certification"],
  ["HQA-1Y8Z-BBRZS", "PFAS POTW effluent monitoring report"],
  ["HQD-8ZEE-2KJD5", "Additional monitoring certification"],
  ["HQD-91C4-TNX99", "PFAS POTW effluent monitoring report"],
  ["HQE-GX1V-TH10E", "Biosolids PFAS monitoring report"],
  ["HQG-GKRH-8B37J", "PFAS POTW effluent monitoring report"],
  ["HQG-GN3K-JNK5K", "Biosolids PFAS monitoring report"],
  ["HQG-QQ9K-KSZ7V", "IPP unscheduled submission for approval"],
  ["HQK-A647-67DN7", "PFAS POTW effluent monitoring report"],
  ["HQM-0Z2W-CZ7GW", "Biosolids PFAS monitoring report"],
  ["HQM-3D1M-M17FW", "Industrial Pretreatment Program profile"],
  ["HQM-5QVG-V9A98", "Additional monitoring certification"],
  ["HQM-9QCZ-PE5QR", "IPP annual report"],
  ["HQN-7PHN-WHK7P", "Report of discharge (CSO/SSO/RTB)"],
]);

const specialDescriptions = new Map([
  ["HNJ-P0ZX-8AVDS", "November 2018 IPP PFAS summary identifying Wexford County Landfill sampling and the attached J17646-1 leachate report. The two scan-only pages were OCR-verified."],
  ["HNQ-VZP8-TWNRX", "June 2019 IPP PFAS status report stating that Wexford County Landfill was confirmed as a PFAS source, leachate was redirected to deep-well injection, and POTW effluent results included PFOS 7.1 ng/L and PFOA 15 ng/L."],
  ["HQN-7PHN-WHK7P", "May 2026 portal report for an SSO discharge from the Leeson Lift Station, including initial/final report fields, discharge timing, location and response information."],
]);

const idFor = (name) => {
  if (/PD-MWSX-Y48BC/i.test(name)) return "HPD-MWSX-Y48BC";
  const found = name.match(/[A-Z0-9]{3}-[A-Z0-9]{4}-[A-Z0-9]{5}/i)?.[0]?.toUpperCase();
  return found;
};

const versionFor = (name) => name.match(/(?:^|[ _-])v(?:ersion)?\s*(\d+)/i)?.[1] ?? "1";

const dateFor = (item) => {
  const printed = item.name.match(/((?:19|20)\d{2})-(\d{2})-(\d{2})/);
  if (printed) return `${printed[1]}-${printed[2]}-${printed[3]}`;
  const metadata = item.pdf_metadata?.CreationDate?.match(/^D:((?:19|20)\d{2})(\d{2})(\d{2})/);
  if (metadata) return `${metadata[1]}-${metadata[2]}-${metadata[3]}`;
  return "Undated";
};

const typeFor = (title) => {
  if (title.includes("effluent")) return "PFAS effluent monitoring";
  if (title.includes("Biosolids PFAS")) return "PFAS biosolids monitoring";
  if (title.includes("Biosolids annual")) return "Biosolids annual report";
  if (title.includes("IPP annual")) return "IPP annual report";
  if (title.includes("IPP PFAS")) return "IPP PFAS report";
  if (title.includes("No Exposure")) return "Stormwater certification";
  if (title.includes("Additional monitoring")) return "Additional monitoring certification";
  if (title.includes("Schedule of compliance")) return "Compliance submittal";
  if (title.includes("unscheduled")) return "IPP approval submittal";
  if (title.includes("Program profile")) return "IPP program profile";
  if (title.includes("Pollutant Minimization")) return "Pollutant minimization report";
  if (title.includes("Report of discharge")) return "Discharge report";
  return "Portal submission";
};

const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
const detail = JSON.parse(await readFile(detailPath, "utf8"));
const detailByHash = new Map(detail.records.map((record) => [record.sha256, record]));
const catalogFiles = (await readdir(path.join(root, "app"))).filter((name) => name.endsWith("-documents.json") && name !== "form-submission-documents.json");
const existing = new Map();
for (const file of catalogFiles) {
  for (const record of JSON.parse(await readFile(path.join(root, "app", file), "utf8"))) existing.set(record.sha256, { file, record });
}

await mkdir(targetDirectory, { recursive: true });
const records = [];
const reused = [];
const removed = [];
for (const item of inventory.records) {
  if (excludedDuplicates.has(item.sha256)) {
    removed.push({ source: item.name, sha256: item.sha256, reason: excludedDuplicates.get(item.sha256) });
    continue;
  }
  const match = existing.get(item.sha256);
  if (match) {
    reused.push({ source: item.name, existing: match.record.name, catalog: match.file });
    continue;
  }
  const submissionId = idFor(item.name);
  if (!submissionId || !formTitles.has(submissionId)) throw new Error(`Unclassified submission: ${item.name}`);
  const version = versionFor(item.name);
  const date = dateFor(item);
  const title = formTitles.get(submissionId);
  const hash = createHash("sha256").update(await readFile(item.source)).digest("hex");
  if (hash !== item.sha256) throw new Error(`Source changed after audit: ${item.name}`);
  const number = String(records.length + 1).padStart(3, "0");
  const id = `form-submission-${number}-${item.sha256.slice(0, 12)}`;
  const targetName = `${id}.pdf`;
  const existingLocalUrl = existingLocalAssets.get(item.sha256);
  if (!existingLocalUrl) await copyFile(item.source, path.join(targetDirectory, targetName));
  records.push({
    id,
    name: `${date} - ${title} - Submission ${submissionId} v${version}.pdf`,
    url: existingLocalUrl ?? `/form-submission-docs/${targetName}`,
    year: date === "Undated" ? "Undated" : date.slice(0, 4),
    category: "Form submissions (online portal)",
    type: typeFor(title),
    format: "PDF",
    pages: item.actual_pages,
    size: item.bytes,
    sha256: item.sha256,
    description: specialDescriptions.get(submissionId) ?? `${title} portal record ${submissionId}, version ${version}, preserved with its submitted fields, attachment list, revision history and digital certification.` ,
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
    actualDuplicateGroupsRemoved: removed.length,
    actualDuplicateFilesRemoved: removed.length,
    crossCategoryCopiesReferencedElsewhere: reused.length + existingLocalAssets.size,
    retainedMultiVersionSubmissionGroups: 14,
    finalDistinctRecords: records.length,
    publishedPages: records.reduce((total, record) => total + record.pages, 0),
    publishedOcrPages: selectedDetails.reduce((total, record) => total + record.ocr_pages, 0),
    publishedOcrPagesWithText: selectedDetails.reduce((total, record) => total + record.ocr_pages_with_text, 0),
    publishedBytes: records.reduce((total, record) => total + record.size, 0),
    ambiguousFilenameLabelsRemoved: 30,
  },
  methods: [
    "SHA-256 comparison within the supplied folder and against every published evidence catalog",
    "Page-count, PDF metadata and embedded-text review for all 236 supplied pages",
    "OCR on all five scan-only pages, with a second page-sequence and content-integrity verification",
    "Rendered-page, perceptual hash, submission ID, version, attachment list and revision-history comparison",
    "Conservative retention of every substantively changed portal revision",
  ],
  decisions: [
    {
      name: "HNQ-VZP8-TWNRX v1 scan derivative",
      reason: "The three scan-only pages reproduce the same submission, version, fields and page sequence as the born-digital portal export. The searchable born-digital copy is retained and the redundant scan is excluded.",
    },
    {
      name: "HQB-6T2F-9M76H v1 repeated export",
      reason: "The two exports were generated one second apart and have the same page count, embedded-text lengths and perceptual page hashes. One canonical copy is retained.",
    },
    {
      name: "Fourteen multi-version submission groups",
      reason: "Versions were compared by fields, attachment lists, revision history, dates and rendered pages. Changed or corrected versions remain separate records because they are not duplicates.",
    },
    {
      name: "Submission-ID-only and prefixed filenames",
      reason: "Ambiguous storage prefixes, the '(1)' copy label and one missing leading H were removed from displayed names. Canonical names now show date, form title, submission ID and version.",
    },
    {
      name: "Five OCR pages",
      reason: "All five scan-only pages produced readable OCR. Three belonged to the excluded scan duplicate; the two retained OCR pages are the unique 2018 IPP PFAS summary report.",
    },
  ],
  removed,
  reused,
};

await writeFile(path.join(root, "app", "form-submission-documents.json"), `${JSON.stringify(records, null, 2)}\n`);
await writeFile(path.join(root, "app", "form-submission-audit.json"), `${JSON.stringify(audit, null, 2)}\n`);
console.log(JSON.stringify({ records: records.length, removed: removed.length, reused: reused.length, publishedPages: audit.stats.publishedPages, publishedOcrPages: audit.stats.publishedOcrPages, publishedBytes: audit.stats.publishedBytes }, null, 2));
