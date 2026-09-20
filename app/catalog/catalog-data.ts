import biosolidsDocuments from "../biosolids-documents.json";
import complianceDocuments from "../compliance-documents.json";
import correspondenceDocuments from "../correspondence-documents.json";
import dmrDocuments from "../dmr-documents.json";
import formSubmissionDocuments from "../form-submission-documents.json";
import ippDocuments from "../ipp-documents.json";
import labDocuments from "../lab-documents.json";
import npdesDocuments from "../npdes-documents.json";
import pfasDocuments from "../pfas-documents.json";
import processSiteDocuments from "../process-site-documents.json";
import referenceDocuments from "../reference-documents.json";
import supplementalDocuments from "../supplemental-documents.json";
import wexfordDocuments from "../wexford-documents.json";

export type CatalogRecord = {
  id: string;
  name: string;
  url: string;
  year?: string | null;
  category?: string | null;
  type?: string | null;
  format?: string | null;
  pages?: number | null;
  size?: number | null;
  description?: string | null;
  sha256?: string | null;
  preview?: string | null;
  placementPrefix?: string | null;
  officialSource?: boolean;
};

export type CatalogPageConfig = {
  slug: string;
  buttonLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  documents: readonly CatalogRecord[];
};

const supplementalRecords = supplementalDocuments as readonly CatalogRecord[];
const processSiteRecords = processSiteDocuments as readonly CatalogRecord[];
const factSheet2013 = (ippDocuments as readonly CatalogRecord[]).filter((record) => record.id === "010-7621bc53d1a1");
const finalPermit2019 = (npdesDocuments as readonly CatalogRecord[]).filter((record) => record.id === "082-9f01fe21418a");
const nondomesticAttachment = (biosolidsDocuments as readonly CatalogRecord[]).filter((record) => record.id === "052-760656b79f1f");
const reportedDmrExceedances = (dmrDocuments as readonly CatalogRecord[]).filter((record) => record.type === "DMR with reported limit exceedance");

const uniqueRecords = (...groups: readonly CatalogRecord[][]): readonly CatalogRecord[] => {
  const seen = new Set<string>();
  return groups.flatMap((group) => group).filter((record) => {
    if (seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
};

const groundwaterRecords = uniqueRecords(supplementalRecords.filter((record) => {
  const category = record.category?.toLowerCase() ?? "";
  return category.includes("groundwater") || category.includes("watershed");
}), (wexfordDocuments as readonly CatalogRecord[]).filter((record) => ["027-b6b5e1c0bddb", "024-069dda9efa5b"].includes(record.id)));

const leachateRecords = uniqueRecords(supplementalRecords.filter((record) => {
  const category = record.category?.toLowerCase() ?? "";
  return category.includes("leachate") || category.includes("landfill receiving") || category.includes("waste-disposal");
}), (wexfordDocuments as readonly CatalogRecord[]).filter((record) => ["110-fb263b3ea6c1", "024-069dda9efa5b"].includes(record.id)));

const operationsRecords = supplementalRecords.filter((record) => {
  const category = record.category?.toLowerCase() ?? "";
  return [
    "infrastructure",
    "wastewater agreements",
    "process & site",
    "wwtp",
    "municipal utility",
  ].some((term) => category.includes(term));
});

const chemicalRecords = supplementalRecords.filter((record) => record.category === "SDS & chemical product data");

/**
 * The Violation Notices page is the enforcement/noncompliance view, not just a
 * list of files whose type happens to be "Violation notice".  Keep the
 * selection content-led: include source records that explicitly document a
 * violation, SNC, exceedance, spill/bypass, enforcement response or the
 * regulatory noncompliance export, while leaving ordinary compliance and
 * contextual records in their primary catalog.
 */
const complianceEnforcementTypes = new Set([
  "Compliance file compilation",
  "Compliance monitoring report",
  "Effluent exceedance record",
  "Inspection and compliance correspondence",
  "Spill or bypass notification",
  "Violation attachment",
  "Violation notice",
  "Violation response",
  "Agency notebook image",
  "Compliance correspondence and laboratory sequence",
  "Pretreatment compliance correspondence",
  "Inspection recordkeeping deficiency",
]);

const complianceEnforcementRecords = (complianceDocuments as readonly CatalogRecord[]).filter((record) => {
  const text = `${record.name} ${record.type ?? ""} ${record.description ?? ""}`;
  return complianceEnforcementTypes.has(record.type ?? "")
    || /violation|exceedance|bypass|spill|VN-|SVN-/i.test(text)
    || (record.type === "Compliance correspondence" && /\bVN\b|\bSVN\b|BOD|CBOD|ammonia|violation|exceedance|bypass|spill|noncompliance|deficien/i.test(text));
});

const sncRecords = (ippDocuments as readonly CatalogRecord[]).filter((record) => {
  const text = `${record.name} ${record.type ?? ""} ${record.description ?? ""}`;
  return /SNC|significant noncompliance|follow-up to VN|civil and criminal penalties|violation/i.test(text);
});

const noncomplianceRecords = (npdesDocuments as readonly CatalogRecord[]).filter((record) => {
  const text = `${record.name} ${record.type ?? ""} ${record.description ?? ""}`;
  return /SNC|significant noncompliance|noncompliance|violation|exceedance/i.test(text);
});

const federalNoncomplianceRecords = supplementalRecords.filter((record) => record.type === "EPA QNCR");
const regulatoryViolationExport = referenceDocuments.filter((record) => /violation/i.test(`${record.name} ${record.type ?? ""} ${record.description ?? ""}`));
const wexfordNoncomplianceRecords = (wexfordDocuments as readonly CatalogRecord[]).filter((record) => /violation|noncompliance|non-compliance|exceedance|bypass/i.test(`${record.name} ${record.type ?? ""} ${record.description ?? ""}`));
const incidentRecords = (biosolidsDocuments as readonly CatalogRecord[]).filter((record) => /violation|noncompliance|non-compliance|exceedance|bypass|spill|overflow/i.test(`${record.name} ${record.type ?? ""} ${record.description ?? ""}`));
const violationNoticeRecords = uniqueRecords(
  complianceEnforcementRecords,
  sncRecords,
  noncomplianceRecords,
  federalNoncomplianceRecords,
  regulatoryViolationExport,
  wexfordNoncomplianceRecords,
  incidentRecords,
  reportedDmrExceedances,
);

const categoryPages = [
  {
    slug: "pfas",
    buttonLabel: "PFAS RECORDS",
    eyebrow: "PFAS RECORDS",
    title: "PFAS monitoring and source records",
    description: "The PFAS monitoring archive, including screening, source-status, receptor and corrective-action records.",
    documents: uniqueRecords(pfasDocuments, supplementalRecords.filter((record) => record.id === "156-2944aeb34f99"), finalPermit2019),
  },
  {
    slug: "dmr",
    buttonLabel: "DMR & QA",
    eyebrow: "DISCHARGE MONITORING ARCHIVE",
    title: "DMR and QA records",
    description: "Discharge monitoring reports, DMR-QA studies and related permittee data records.",
    documents: uniqueRecords(dmrDocuments, (complianceDocuments as readonly CatalogRecord[]).filter((record) => record.id === "067-1c869397a807")),
  },
  {
    slug: "permits",
    buttonLabel: "PERMITS & RECORDS",
    eyebrow: "PERMITS & RECORDS",
    title: "Permits and operating licenses",
    description: "Permit applications, renewals, modifications, notices and related regulatory records.",
    documents: uniqueRecords(npdesDocuments, (wexfordDocuments as readonly CatalogRecord[]).filter((record) => ["116-1406440ae1fc", "024-069dda9efa5b", "001-7c991baaf1e9"].includes(record.id)), factSheet2013, nondomesticAttachment),
  },
  {
    slug: "ipp",
    buttonLabel: "IPP RECORDS",
    eyebrow: "INDUSTRIAL PRETREATMENT",
    title: "Industrial pretreatment records",
    description: "Industrial pretreatment program records, significant-industrial-user files and enforcement material.",
    documents: uniqueRecords(ippDocuments, nondomesticAttachment, finalPermit2019),
  },
  {
    slug: "biosolids",
    buttonLabel: "BIOSOLIDS",
    eyebrow: "BIOSOLIDS & LAND APPLICATION",
    title: "Biosolids and land-application records",
    description: "Laboratory results, hauling sheets, certifications, land-application information and related records.",
    documents: uniqueRecords(biosolidsDocuments, supplementalRecords.filter((record) => record.category?.toLowerCase().includes("biosolids contracting") || record.id === "156-2944aeb34f99"), processSiteRecords.filter((record) => record.id === "process-site-021-6c2e73d85da0")),
  },
  {
    slug: "laboratory",
    buttonLabel: "LABORATORY RECORDS",
    eyebrow: "LAB RESULTS & SAMPLING",
    title: "Laboratory records",
    description: "Analytical reports and sampling records cataloged separately from the regulatory and source archives.",
    documents: uniqueRecords(labDocuments, nondomesticAttachment),
  },
  {
    slug: "compliance",
    buttonLabel: "COMPLIANCE",
    eyebrow: "COMPLIANCE & ENFORCEMENT",
    title: "Compliance and enforcement records",
    description: "Inspections, notices, corrective-action correspondence and other compliance records.",
    documents: uniqueRecords(complianceDocuments, (wexfordDocuments as readonly CatalogRecord[]).filter((record) => record.id === "001-7c991baaf1e9"), (npdesDocuments as readonly CatalogRecord[]).filter((record) => ["045-49e091247101", "092-c041f2300a6d", "109-5836ad2c594c"].includes(record.id)), factSheet2013, reportedDmrExceedances),
  },
  {
    slug: "violation-notices",
    buttonLabel: "VIOLATION NOTICES",
    eyebrow: "VIOLATION NOTICES",
    title: "Violation notices",
    description: "Formal violation notices, significant-noncompliance (SNC) notices and other source records that explicitly document noncompliance, exceedances, spills, bypasses or enforcement responses.",
    documents: violationNoticeRecords,
  },
  {
    slug: "verified",
    buttonLabel: "VERIFIED RECORDS",
    eyebrow: "VERIFIED SOURCE ARCHIVE",
    title: "Verified Wexford source records",
    description: "The verified Wexford County Landfill source archive, retained with original provenance and source metadata.",
    documents: wexfordDocuments,
  },
  {
    slug: "correspondence",
    buttonLabel: "CORRESPONDENCE",
    eyebrow: "CORRESPONDENCE & LETTERS",
    title: "Correspondence and letters",
    description: "Agency, municipal, consultant and stakeholder correspondence linked to the documentary record.",
    documents: correspondenceDocuments,
  },
  {
    slug: "process-site",
    buttonLabel: "PROCESS & SITE",
    eyebrow: "PROCESS & SITE DOCUMENTS",
    title: "Process and site records",
    description: "Facility history, process descriptions, maps, site studies and other physical-context records.",
    documents: processSiteDocuments,
  },
  {
    slug: "portal-submissions",
    buttonLabel: "PORTAL SUBMISSIONS",
    eyebrow: "ONLINE FORM SUBMISSIONS",
    title: "Portal submissions",
    description: "Verified online form submissions and the records delivered through the agency portal.",
    documents: formSubmissionDocuments,
  },
  {
    slug: "additional",
    buttonLabel: "ADDITIONAL RECORDS",
    eyebrow: "ADDED EVIDENCE",
    title: "Additional records",
    description: "Additional evidence retained for context, cross-reference and follow-up review.",
    documents: supplementalDocuments,
  },
  {
    slug: "reference",
    buttonLabel: "REFERENCE RECORDS",
    eyebrow: "REFERENCE DATA",
    title: "Reference records",
    description: "Reference exports, tables and supporting datasets used to cross-check the documentary archive.",
    documents: uniqueRecords(referenceDocuments, supplementalRecords.filter((record) => [
      "EPA administrative-record index",
      "Watershed management plan and hydrologic reference",
    ].includes(record.type ?? ""))),
  },
  {
    slug: "groundwater-hydrogeology",
    buttonLabel: "GROUNDWATER & HYDROGEOLOGY",
    eyebrow: "GROUNDWATER & HYDROGEOLOGY",
    title: "Groundwater, wells and hydrogeology",
    description: "Groundwater and well records, historical investigations, Superfund cleanup, watershed context and pathway studies.",
    documents: groundwaterRecords,
  },
  {
    slug: "leachate-receiving-finance",
    buttonLabel: "LEACHATE, RECEIVING & FINANCE",
    eyebrow: "LEACHATE, RECEIVING & FINANCE",
    title: "Leachate receiving, hauling and finance",
    description: "Receiving history, invoices, hauling records, leachate-treatment revenue, contracts and capacity agreements.",
    documents: uniqueRecords(leachateRecords, nondomesticAttachment),
  },
  {
    slug: "wwtp-operations-infrastructure",
    buttonLabel: "WWTP OPERATIONS & INFRASTRUCTURE",
    eyebrow: "WWTP OPERATIONS & INFRASTRUCTURE",
    title: "WWTP operations and infrastructure",
    description: "Process-flow records, facility upgrades, maintenance, operating capacity and technical plant records.",
    documents: uniqueRecords(operationsRecords, processSiteRecords),
  },
  {
    slug: "chemicals-sds",
    buttonLabel: "CHEMICALS & SDS",
    eyebrow: "CHEMICALS & SDS",
    title: "Chemical products and SDS records",
    description: "Safety data sheets and chemical-product records retained for source, handling and process context.",
    documents: chemicalRecords,
  },
] as const satisfies readonly CatalogPageConfig[];

export const catalogPageList: readonly CatalogPageConfig[] = categoryPages;
export const catalogPages: ReadonlyMap<string, CatalogPageConfig> = new Map(
  categoryPages.map((page) => [page.slug, page]),
);
