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
] as const satisfies readonly CatalogPageConfig[];

export const catalogPageList: readonly CatalogPageConfig[] = categoryPages;
export const catalogPages: ReadonlyMap<string, CatalogPageConfig> = new Map(
  categoryPages.map((page) => [page.slug, page]),
);
