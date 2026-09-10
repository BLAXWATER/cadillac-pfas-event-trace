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

const uniqueRecords = (...groups: readonly CatalogRecord[][]): readonly CatalogRecord[] => {
  const seen = new Set<string>();
  return groups.flatMap((group) => group).filter((record) => {
    if (seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
};

const groundwaterRecords = supplementalRecords.filter((record) => {
  const category = record.category?.toLowerCase() ?? "";
  return category.includes("groundwater") || category.includes("watershed");
});

const leachateRecords = supplementalRecords.filter((record) => {
  const category = record.category?.toLowerCase() ?? "";
  return category.includes("leachate") || category.includes("landfill receiving") || category.includes("waste-disposal");
});

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

const categoryPages = [
  {
    slug: "pfas",
    buttonLabel: "PFAS RECORDS",
    eyebrow: "PFAS RECORDS",
    title: "PFAS monitoring and source records",
    description: "The PFAS monitoring archive, including screening, source-status, receptor and corrective-action records.",
    documents: pfasDocuments,
  },
  {
    slug: "dmr",
    buttonLabel: "DMR & QA",
    eyebrow: "DISCHARGE MONITORING ARCHIVE",
    title: "DMR and QA records",
    description: "Discharge monitoring reports, DMR-QA studies and related permittee data records.",
    documents: dmrDocuments,
  },
  {
    slug: "permits",
    buttonLabel: "PERMITS & RECORDS",
    eyebrow: "PERMITS & RECORDS",
    title: "NPDES permits and permit records",
    description: "Permit applications, renewals, modifications, notices and related regulatory records.",
    documents: npdesDocuments,
  },
  {
    slug: "ipp",
    buttonLabel: "IPP RECORDS",
    eyebrow: "INDUSTRIAL PRETREATMENT",
    title: "Industrial pretreatment records",
    description: "Industrial pretreatment program records, significant-industrial-user files and enforcement material.",
    documents: ippDocuments,
  },
  {
    slug: "biosolids",
    buttonLabel: "BIOSOLIDS",
    eyebrow: "BIOSOLIDS & LAND APPLICATION",
    title: "Biosolids and land-application records",
    description: "Laboratory results, hauling sheets, certifications, land-application information and related records.",
    documents: biosolidsDocuments,
  },
  {
    slug: "laboratory",
    buttonLabel: "LABORATORY RECORDS",
    eyebrow: "LAB RESULTS & SAMPLING",
    title: "Laboratory records",
    description: "Analytical reports and sampling records cataloged separately from the regulatory and source archives.",
    documents: labDocuments,
  },
  {
    slug: "compliance",
    buttonLabel: "COMPLIANCE",
    eyebrow: "COMPLIANCE & ENFORCEMENT",
    title: "Compliance and enforcement records",
    description: "Inspections, notices, corrective-action correspondence and other compliance records.",
    documents: complianceDocuments,
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
    documents: referenceDocuments,
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
    documents: leachateRecords,
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
