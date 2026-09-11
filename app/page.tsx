"use client";

/* eslint-disable @next/next/no-img-element -- document previews are local static evidence assets */

import { useReducer, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Database,
  FileArchive,
  FileCode2,
  FileImage,
  Factory,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Landmark,
  Search,
  Waves,
} from "lucide-react";
import complianceAudit from "./compliance-audit.json";
import msgAudit from "./msg-audit.json";
import complianceDocuments from "./compliance-documents.json";
import correspondenceAudit from "./correspondence-audit.json";
import correspondenceDocuments from "./correspondence-documents.json";
import biosolidsAudit from "./biosolids-audit.json";
import biosolidsDocuments from "./biosolids-documents.json";
import dmrDocuments from "./dmr-documents.json";
import evidenceRequestQueue from "./evidence-request-queue.json";
import evidenceQueueUpdates from "./evidence-request-queue-updates.json";
import formSubmissionAudit from "./form-submission-audit.json";
import formSubmissionDocuments from "./form-submission-documents.json";
import ippAudit from "./ipp-audit.json";
import ippDocuments from "./ipp-documents.json";
import labAudit from "./lab-audit.json";
import labDocuments from "./lab-documents.json";
import npdesAudit from "./npdes-audit.json";
import npdesDocuments from "./npdes-documents.json";
import pfasAudit from "./pfas-audit.json";
import pfasDocuments from "./pfas-documents.json";
import processSiteAudit from "./process-site-audit.json";
import processSiteDocuments from "./process-site-documents.json";
import referenceAudit from "./reference-audit.json";
import referenceDocuments from "./reference-documents.json";
import supplementalAudit from "./supplemental-audit.json";
import supplementalDocuments from "./supplemental-documents.json";
import leachateFinance from "./leachate-finance-findings.json";
import solidWastePlans from "./solid-waste-plan-findings.json";
import wexfordAudit from "./wexford-audit.json";
import wexfordDocuments from "./wexford-documents.json";
import hearingRecords from "./hearing-sept09-records.json";
import { bundledDocumentDownload, bundledFirstPagePreview, bundledPublicAsset } from "./bundled-public-assets";
import { withPdfStartPage } from "./pdf-source-url";
import { formatSourceDisplayName } from "./source-display-name";
import { DocumentShareButton } from "./document-share-button";
import { documentPreviewCaption } from "./document-controls";
import { DocumentDownloadButton } from "./document-download-button";
import { DocumentPreviewImage } from "./document-preview-image";
import { documentSummary } from "./document-summary.mjs";
import verifiedFilenameAliases from "./verified-filename-aliases.json";
import { createLibrarySearchIndex, initialLibrarySearchState, librarySearchReducer, librarySearchWindow, normalizeLibrarySearch, searchLibrary, SEARCH_BATCH_SIZE } from "./library-search";
import {
  sourceDownloadUrl,
  sourceMediaKind,
  sourcePreviewUrl,
  type SourceFormat,
} from "./source-media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Kind = "operation" | "regulatory" | "sampling" | "compliance" | "receptor" | "gap";
type Source = {
  name: string;
  displayName?: string;
  url?: string;
  preview?: string;
  previewPage?: number;
  renderedPages?: string[];
  pages?: number;
  page?: number;
  format: SourceFormat;
  role: "Primary source" | "Source page" | "Cross-reference" | "Referenced—file missing";
  result: string;
  clock: {
    eventStamp: string;
    basis: string;
    created?: string;
    modified?: string;
    note: string;
  };
};

type CatalogDocument = {
  name: string;
  url: string;
  format?: string | null;
  pages?: number | null;
  year?: string | null;
  description?: string | null;
  type?: string | null;
};
type Event = {
  year: string;
  date: string;
  isoDate?: string;
  time: string;
  timeBasis: string;
  phase: string;
  kind: Kind;
  category: string;
  title: string;
  finding: ReactNode;
  significance: string;
  sources: Source[];
};

type MatchingSource = {
  name: string;
  url: string;
  pages: number;
  size: number;
  sha256: string;
  relationship: string;
};

type LibraryDocument = {
  id: string;
  sha256?: string;
  name: string;
  url: string;
  type: string;
  year?: string;
  category?: string;
  format?: string;
  pages?: number | null;
  description?: string;
  matchingSources?: readonly MatchingSource[];
};

type LibrarySearchRecord = LibraryDocument & {
  archive: string;
  archiveId: string;
};

type EvidenceRequirement = {
  id: string;
  label: string;
  verifiedEvidence?: readonly { recordId: string; sha256: string; reviewBasis: string }[];
  termGroups: readonly (readonly string[])[];
  excludeTerms?: readonly string[];
  minPages?: number;
};

type EvidenceRequestDefinition = {
  id: string;
  priority: string;
  block: string;
  category: string;
  completes: string;
  provide: string;
  requirements: readonly EvidenceRequirement[];
};

const processSiteRecords = processSiteDocuments as readonly (LibraryDocument & { size: number })[];

const libraryArchives: { id: string; label: string; documents: readonly LibraryDocument[] }[] = [
  { id: "dmr", label: "DMR & QA", documents: dmrDocuments },
  { id: "npdes", label: "NPDES permits", documents: npdesDocuments },
  { id: "ipp", label: "Industrial pretreatment", documents: ippDocuments },
  { id: "pfas", label: "PFAS monitoring", documents: pfasDocuments },
  { id: "biosolids", label: "Biosolids & land application", documents: biosolidsDocuments },
  { id: "lab", label: "Lab results & sampling", documents: labDocuments },
  { id: "wexford", label: "Wexford landfill", documents: wexfordDocuments },
  { id: "compliance", label: "Compliance & enforcement", documents: complianceDocuments },
  { id: "correspondence", label: "Correspondence & letters", documents: correspondenceDocuments },
  { id: "process-site", label: "Process & site documents", documents: processSiteDocuments },
  { id: "form-submissions", label: "Online form submissions", documents: formSubmissionDocuments },
  { id: "supplemental", label: "Added evidence", documents: supplementalDocuments },
  { id: "reference", label: "Reference data", documents: referenceDocuments },
];

const categoryJumpLinks = [
  { label: "PFAS RECORDS", href: "/catalog/pfas" },
  { label: "DMR & QA", href: "/catalog/dmr" },
  { label: "PERMITS & RECORDS", href: "/catalog/permits" },
  { label: "IPP RECORDS", href: "/catalog/ipp" },
  { label: "BIOSOLIDS", href: "/catalog/biosolids" },
  { label: "LABORATORY RECORDS", href: "/catalog/laboratory" },
  { label: "COMPLIANCE", href: "/catalog/compliance" },
  { label: "VIOLATION NOTICES", href: "/catalog/violation-notices" },
  { label: "VERIFIED RECORDS", href: "/catalog/verified" },
  { label: "CORRESPONDENCE", href: "/catalog/correspondence" },
  { label: "PROCESS & SITE", href: "/catalog/process-site" },
  { label: "PORTAL SUBMISSIONS", href: "/catalog/portal-submissions" },
  { label: "ADDITIONAL RECORDS", href: "/catalog/additional" },
  { label: "REFERENCE RECORDS", href: "/catalog/reference" },
  { label: "GROUNDWATER & HYDROGEOLOGY", href: "/catalog/groundwater-hydrogeology" },
  { label: "LEACHATE, RECEIVING & FINANCE", href: "/catalog/leachate-receiving-finance" },
  { label: "WWTP OPERATIONS & INFRASTRUCTURE", href: "/catalog/wwtp-operations-infrastructure" },
  { label: "CHEMICALS & SDS", href: "/catalog/chemicals-sds" },
] as const;

const librarySearchRecords: LibrarySearchRecord[] = libraryArchives.flatMap((archive) =>
  archive.documents.map((document) => ({
    ...document,
    archive: archive.label,
    archiveId: archive.id,
  })),
);

const librarySearchIndex = createLibrarySearchIndex(librarySearchRecords, verifiedFilenameAliases);

const evidenceRequestDefinitions = evidenceRequestQueue as readonly EvidenceRequestDefinition[];

const normalizeEvidenceText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

const evidenceRecordText = (record: LibrarySearchRecord) => normalizeEvidenceText([
  record.name,
  record.type,
  record.description,
  record.category,
  record.year,
  record.archive,
  record.archiveId,
  ...(record.matchingSources ?? []).flatMap((source) => [source.name, source.relationship]),
].filter(Boolean).join(" "));

const evidenceTrackingRecordTerms = [
  "evidence intake manifest",
  "evidence recovery inventory",
  "evidence package records index",
  "evidence package hash manifest",
  "not yet recovered",
];

const evidenceRequirementMet = (requirement: EvidenceRequirement, record: LibrarySearchRecord) => {
  // Search terms can nominate candidates, but cannot establish that evidence exists.
  // Require a reviewed match to the exact original; negative descriptions also contain keywords.
  if (!requirement.verifiedEvidence?.some((evidence) =>
    evidence.recordId === record.id && evidence.sha256 === record.sha256 && evidence.reviewBasis.trim(),
  )) return false;
  if (requirement.minPages && (record.pages ?? 0) < requirement.minPages) return false;
  const searchable = evidenceRecordText(record);
  if (evidenceTrackingRecordTerms.some((term) => searchable.includes(normalizeEvidenceText(term)))) return false;
  if (requirement.excludeTerms?.some((term) => searchable.includes(normalizeEvidenceText(term)))) return false;
  return requirement.termGroups.every((group) =>
    group.some((term) => searchable.includes(normalizeEvidenceText(term))),
  );
};

const evidenceRequests = evidenceRequestDefinitions.map((request) => ({
  ...request,
  satisfied: request.requirements.flatMap((requirement) => {
    const document = librarySearchRecords.find((record) => evidenceRequirementMet(requirement, record));
    return document ? [{ ...requirement, document }] : [];
  }),
  remaining: request.requirements.filter((requirement) =>
    !librarySearchRecords.some((record) => evidenceRequirementMet(requirement, record)),
  ),
})).filter((request) => request.remaining.length > 0);

// Held context is intentionally separate from verifiedEvidence used for closure.
const queueUpdatesByRequest = new Map(evidenceQueueUpdates.blocks.map((update) => [update.requestId, {
  ...update,
  held: update.held.flatMap((item) => {
    const sources = item.sources.map((reference) => ({
      ...reference,
      document: librarySearchRecords.find((record) => record.id === reference.recordId && record.sha256 === reference.sha256),
    }));
    return sources.every((source) => source.document) ? [{ ...item, sources }] : [];
  }),
}]));
const remainingEvidenceRequirements = evidenceRequests.reduce((total, request) => total + request.remaining.length, 0);
const satisfiedEvidenceRequirements = evidenceRequestDefinitions.reduce((total, request) => total + request.requirements.length, 0) - remainingEvidenceRequirements;
const completedEvidenceBlocks = evidenceRequestDefinitions.length - evidenceRequests.length;

const repositoryAssetUrl = (path: string) =>
  `https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/be4c2d5dadbb16835a539e8509ac065d560bb055/public/${path.replace(/^\//, "")}`;

const pdf = (
  name: string,
  slug: string,
  pages: number,
  result: string,
  clock: Source["clock"],
  url?: string,
): Source => {
  const documentUrl = url ?? repositoryAssetUrl(`/docs/${slug}.pdf`);
  return {
    name,
    url: documentUrl,
    preview: bundledFirstPagePreview(documentUrl) ?? bundledPublicAsset(`/previews/${slug}.jpg`),
    pages,
    format: "PDF",
    role: "Primary source",
    result,
    clock,
  };
};

const ippSource = (
  name: string,
  url: string,
  pages: number,
  result: string,
  clock: Source["clock"],
): Source => ({
  name,
  url,
  preview: bundledFirstPagePreview(url),
  pages,
  format: "PDF",
  role: "Primary source",
  result,
  clock,
});

const archivedSource = (
  name: string,
  url: string,
  pages: number,
  result: string,
  clock: Source["clock"],
): Source => ({
  name,
  url,
  preview: bundledFirstPagePreview(url),
  pages,
  format: "PDF",
  role: "Primary source",
  result,
  clock,
});

const noTime = "Time not stated";

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const events: Event[] = [
  {
    year: "2018", date: "2018-03-21", isoDate: "2018-03-21", time: "7:30–9:00 PM",
    timeBasis: "Formal hearing opening and closing in the transcript",
    phase: "Public hearing and paid leachate treatment", kind: "regulatory", category: "12 · Landfill & leachate",
    title: "Hearing records paid leachate treatment and earlier daily deliveries",
    finding: "Jeff Dietlin states that Cadillac received payment to treat leachate (transcript PDF p26). He recalls an earlier seven-day delivery schedule of 70,000–80,000 gallons per day, contrasting weekday-only deliveries and the need for steady feeding rather than slugs (p27). Marcus Peccia reports approximately 14 million gallons treated in 2016 (p22). The transcript establishes March 21, 2018 as the hearing date.",
    significance: "Direct testimony corroborates the receiving and paid-treatment relationship, but does not date the earlier daily-volume period, reconstruct every delivery, or prove PFAS removal. Do not annualize the recalled daily volumes. Smith's 95% statement concerns claimed water-volume recovery at another landfill, not chemical similarity. The exact final load remains unverified.",
    sources: [0].map(i => ({...archivedSource(hearingRecords[i].name, hearingRecords[i].url, hearingRecords[i].pages, hearingRecords[i].description, {eventStamp: "2018-03-21 7:30–9:00 PM", basis: "Transcript opening, closing and certification", note: "69 physical PDF pages include cover, certification and index. Certification graphics were visually inspected; no cryptographic validation claimed."}), page:26})),
  },
  {
    year: "2018", date: "2018-03-21", isoDate: "2018-03-21", time: noTime,
    timeBasis: "Hearing materials; written comments extend February–April 2018", phase: "Proposed safeguards and public participation",
    kind: "regulatory", category: "12 · Landfill & leachate",
    title: "DEQ explains relocation and casing safeguards; written comments preserve both viewpoints",
    finding: "DEQ's presentation describes moving the proposed well to avoid existing contamination and extra casing to prevent carry-down during drilling (hearing packet p7). Its aquifer drawing is a general schematic, not a measured cross-section. Written comments question monitoring and financial assurance; the collection also includes a signed supporting letter (p19). The mayor's letter is duplicated, not two independent statements. Sign-in Yes/No entries indicate intent to speak, not support or opposition.",
    significance: "The separate OGMD response addresses updated analyses, relocation and a $33,000 plugging/restoration bond, and recommends permit issuance. These are agency statements and proposed requirements, not proof of subsequent compliance or injection commencement. Its March 19 hearing reference conflicts with the March 21 transcript. Additional insurance, final delivery and actual injection-start records are not established here.",
    sources: [2,1,3].map(i => ({...archivedSource(hearingRecords[i].name, hearingRecords[i].url, hearingRecords[i].pages, hearingRecords[i].description, {eventStamp: i === 3 ? "Response date not established" : "2018 hearing record", basis: "Document content; separate component dates preserved", note: "Public comments remain attributed; proposed safeguards are not completed inspections. Personal contact details are not reproduced in this summary."}), page:i===2?7:i===1?10:2})),
  },
  {
    year: "2020",
    date: "2020-12-08",
    isoDate: "2020-12-08",
    time: "11:03 AM",
    timeBasis: "Meeting opening time printed on p1; time zone not stated",
    phase: "Northernaire closeout and LDFA governance",
    kind: "regulatory",
    category: "04 / 13 · PFAS response & groundwater cleanup",
    title: "LDFA discusses PFAS testing before closeout and seeks legal advice",
    finding: <>Under Northernaire Closeout, the minutes record Jeff reporting that EGLE said the LDFA would have no accountability if PFAS was found, while EPA said it would, and that EPA would not allow closure without a PFAS test. Mike Hamner agrees with Marcus <strong>“to fight being held accountable”</strong> when PFAS is not on the current test list. The Board recommends checking with the City Attorney. Separately, p1 authorizes a Tetra Tech annual-report award not to exceed <strong>$12,850</strong>, projects shallow-well shutdown in January 2026 and intermediate-well shutdown in January 2044, and estimates 15–20% annual savings from shallow-well shutdown.</>,
    significance: "Direct minutes of the LDFA's PFAS-testing and closeout discussion, not attached written EPA/EGLE determinations, an established liability finding or a recorded vote refusing PFAS testing. The forecasts do not establish completed shutdowns or achieved savings, and the award is not proof of payment. No PFAS concentrations, main-WWTP samples or proven source-to-Plett pathway are supplied.",
    sources: [{
      ...archivedSource("Cadillac LDFA Board Minutes - December 8, 2020.pdf", "/findings-docs/194-e0ad50e1248b.pdf", 2, "Page 2 preserves the Northernaire closeout discussion and recommendation for legal consultation; page 1 supplies the annual-report award and projected operating dates.", {
        eventStamp: "2020-12-08 11:03 AM · meeting opening; zone not stated",
        basis: "December 8, 2020 printed at the top of p1; the minutes also approve November 10, 2020 minutes",
        note: "The supplied filename says LDFA Minutes 12-8-21 - Fight being held accountable.pdf. The printed document date controls this placement; the filename discrepancy remains visible. Agency positions are reported in the minutes, not independently established by attached agency correspondence.",
      }),
      page: 2,
    }],
  },
  {
    year: "2015",
    date: "2015-11-18",
    isoDate: "2015-11-18",
    time: noTime,
    timeBasis: "Activity date on p1; no inspection time printed",
    phase: "Landfill air inspection and recordkeeping",
    kind: "compliance",
    category: "08 / 12 · Compliance, landfill & leachate",
    title: "Signed landfill inspection preserves asbestos-record review and pond non-use",
    finding: "The signed DEQ/MACES N386232267 report notes a recent late-reporting violation notice, while concluding compliance with applicable air permitting at the inspection. Page 2 reports review of asbestos shipment records containing generator/transporter identity, quantity and receipt details, with no discrepancies noted. It also states that the aeration pond had not been used in the preceding 12 months and removal from the permit would be requested at renewal. Page 3 preserves signature marks and a handwritten November 24, 2015 date.",
    significance: "The signed scan and existing reflowed export are versions of the same November 18 inspection, not independent corroboration or two inspection events. Asbestos shipment-record review does not supply the original shipment records or Wexford leachate-to-Cadillac tickets. Reported pond non-use and a future permit-removal request do not establish physical closure or the final leachate delivery. Air-permit compliance at this visit does not mean no violations or comprehensive environmental compliance.",
    sources: [{
      ...archivedSource("N3862_SAR_20151118.pdf", "/wexford-docs/111-d8141f278b56.pdf", 3, "Signed DEQ/MACES scan: p1 activity and reporting context, p2 asbestos records and aeration pond, p3 signature marks and date.", {
        eventStamp: "2015-11-18 · inspection date; time not stated",
        basis: "Activity date printed on p1",
        note: "The handwritten November 24 date on p3 is separate from the November 18 inspection. The original header lists 990 US 131 NORTH, MANTON and contact Don Suchocki; different address wording in the later export is not evidence of relocation.",
      }),
      page: 2,
    }, {
      ...archivedSource("2015-11-18 - N3862 On-Site Inspection - Wexford County Landfill.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/49922c706588f236e1edbad5fa8996e4c249e330/public/wexford-docs/102-9011dd4b0fe6.pdf", 3, "Existing reflowed EGLE export of the same inspection; signature/date fields are blank and pagination differs from the signed scan.", {
        eventStamp: "2015-11-18 · same inspection event",
        basis: "Activity date printed in the export",
        note: "Retained for readable comparison, not counted as an additional inspection. The signed scan preserves materially different header and execution evidence.",
      }),
      role: "Cross-reference",
    }],
  },
  ...solidWastePlans.events.map((event): Event => ({
    ...event,
    kind: event.kind as Kind,
    sources: event.sources.map((source): Source => ({
      ...archivedSource(source.name, source.url, source.pages, source.result, {
        eventStamp: event.date,
        basis: event.timeBasis,
        note: event.significance,
      }),
      page: source.page,
    })),
  })),
  ...leachateFinance.events.map((event): Event => ({
    ...event,
    kind: event.kind as Kind,
    sources: event.sources.map((source): Source => ({
      ...archivedSource(source.name, source.url, source.pages, source.result, {
        eventStamp: event.date,
        basis: event.timeBasis,
        note: event.significance,
      }),
      page: source.page,
    })),
  })),
  {
    year: "2005",
    date: "2005",
    isoDate: "2005",
    time: noTime,
    timeBasis: "Publication year printed in the reports",
    phase: "Municipal well-field modeling",
    kind: "receptor",
    category: "13 · Groundwater & wells",
    title: "USGS models groundwater flow and Cadillac well contributing areas",
    finding: "USGS regional modeling for the Clam River watershed describes deep-system groundwater flow as generally southeast to northwest and identifies land immediately south and southeast of Cadillac's production-well field as contributing water under the modeled ten-year scenarios.",
    significance: "Supplies historical regional hydrogeologic context for the municipal wells. The reports also state that more detailed aquifer characterization would be needed to represent heterogeneous glacial deposits, so the model is not treated as proof of a modern PFAS migration route or source.",
    sources: [
      archivedSource("USGS Scientific Investigations Report 2004-5175 — Simulation of Ground-Water Flow and Areas Contributing to Cadillac Production Wells.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/677a74cff6d4945b60295221ecfac72bc5c42f4e/public/findings-docs/082-1a5758abbd59.pdf", 24, "Final Scientific Investigations Report edition, including model figures, optimized and alternate contributing-area scenarios, limitations and references.", {
        eventStamp: "2005 · time not stated",
        basis: "Publication year in the suggested citation",
        created: "2005-01-28",
        modified: "2005-03-07",
        note: "The report prints no publication month. Embedded PDF dates describe file production and are not used to infer a more precise event date.",
      }),
      archivedSource("USGS Open-File Report 2005-1012 — Simulation of Ground-Water Flow and Areas Contributing to Cadillac Production Wells.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/677a74cff6d4945b60295221ecfac72bc5c42f4e/public/findings-docs/084-2b78292aa0e0.pdf", 24, "Distinct official Open-File Report edition with a different cover, report number, citation page and end matter; the study body substantially overlaps the Scientific Investigations Report.", {
        eventStamp: "2005 · time not stated",
        basis: "Publication year and report number printed in the source",
        created: "2024-06-14 08:11:59 EDT (archive OCR derivative)",
        modified: "2024-06-14 08:13:46 EDT (archive OCR derivative)",
        note: "The 2024 timestamps record OmniPage OCR processing, not the 2005 report event. Related official editions are retained because they are not page-for-page duplicate records.",
      }),
    ],
  },
  {
    year: "2011",
    date: "2011 reporting year",
    time: noTime,
    timeBasis: "Annual IPP report",
    phase: "Industrial pretreatment",
    kind: "compliance",
    category: "04 · Industrial pretreatment",
    title: "Wexford landfill copper SNC and ownership change documented",
    finding: "Cadillac's 2011 annual IPP report states that Wexford DPW Landfill was sold to American Waste and renamed Wexford County Landfill LLC. Its SNC attachments list the landfill for technical-review-criteria violations and identify copper as the violation, with phone calls, meetings and IPP reports recorded as enforcement actions throughout 2011.",
    significance: "Page 25 marks return to compliance as Pending. This is Cadillac's historical copper-related reporting, not a PFAS finding. The annual report covers 2011 and was transmitted in March 2012; it is distinct from the February 2011 inspection entry below.",
    sources: [{
      name: "Cadillac WWTP IPP 2011.pdf",
      url: repositoryAssetUrl("/npdes-docs/038-8191c7e18aac.pdf"),
      preview: bundledPublicAsset("/source-previews/038-8191c7e18aac.jpg"),
      pages: 50,
      page: 25,
      format: "PDF",
      role: "Primary source",
      result: "Scanned annual IPP report; pages 17, 24 and 25 document the ownership/name change, SNC criterion and copper enforcement entry.",
      clock: {
        eventStamp: "2011 reporting year · time not stated",
        basis: "Annual IPP reporting period",
        created: "2013-06-07",
        note: "The PDF creation date is a later scan timestamp. The underlying record covers calendar year 2011.",
      },
    }],
  },
  {
    year: "2011",
    date: "2011-02-03",
    isoDate: "2011-02-03",
    time: noTime,
    timeBasis: "Historical inspection entry 43653 dated February 3, 2011",
    phase: "Regulatory inspection",
    kind: "regulatory",
    category: "08 · Compliance & enforcement",
    title: "DEQ records County Landfill leachate at the WWTP equalization tank",
    finding: "A February 3, 2011 inspection entry preserved on page 2 of the pre-inspection export describes the equalization tank as the receiving point for hauled waste identified as County Landfill leachate. The inspector noted no apparent screens or flow meter in that area and recommended flow-proportioned sampling and influent flow metering/screens. The entry also describes the main treatment units as operating normally.",
    significance: "Documents a historical receiving location and the inspector's observations, not individual deliveries or their volumes. The ten-page export does not establish the previously assigned September-October 2013 inspection dates or aging-facility narrative.",
    sources: [archivedSource("Cadillac WWTP Pre-Inspection Report - Inspection ID 50407 - Historical Entries.pdf", "/compliance-docs/059-72e0d17a78ae.pdf", 10, "Page 2, inspection entry 43653: County Landfill leachate receiving location, apparent absence of screens/flow meter, and sampling recommendations.", {
      eventStamp: "2011-02-03 · time not stated",
      basis: "Date printed beside historical inspection entry 43653 on page 2",
      created: "2015-08-28 06:33:16 EDT",
      note: "The PDF creation timestamp is a later export date, not the historical inspection date. The report-completion date field on page 10 is blank.",
    })],
  },
  {
    year: "2012",
    date: "2012-03-26",
    isoDate: "2012-03-26",
    time: noTime,
    timeBasis: "Embedded PDF creation date; form page undated",
    phase: "Industrial-user record",
    kind: "regulatory",
    category: "04 · Industrial pretreatment",
    title: "Wexford County Landfill listed as a Cadillac SIU",
    finding: "The Cadillac WWTP SIU packet identifies Wexford County Landfill LLC under permit 590-13 and records 33,600 gallons per day of intermittent process wastewater subject to local limits.",
    significance: "Provides a permit-linked volume and pretreatment classification for the landfill-to-WWTP relationship.",
    sources: [{
      name: "Cadillac WWTP SIU Information.pdf · page 4",
      url: repositoryAssetUrl("/ipp-docs/001-4e9a0cdf0189.pdf"),
      preview: bundledPublicAsset("/source-previews/001-4e9a0cdf0189.jpg"),
      pages: 11,
      page: 4,
      format: "PDF",
      role: "Source page",
      result: "Rendered SIU form confirms the company, permit number, wastewater type, 33,600-gallon daily volume, intermittent discharge and local-limit designation.",
      clock: {
        eventStamp: "2012-03-26 · time not stated",
        basis: "Embedded PDF creation date; source form itself is undated",
        created: "2012-03-26",
        note: "OCR was used to locate the scanned page; every reported field was checked against the rendered image.",
      },
    }],
  },
  {
    year: "2012",
    date: "2012 application attachment · undated form",
    time: noTime,
    timeBasis: "Archive year; no submission date established by this attachment",
    phase: "Nondomestic wastewater",
    kind: "regulatory",
    category: "04 / 05 · Industrial pretreatment & biosolids",
    title: "Application distinguishes landfill leachate from septage",
    finding: "Page 1 checks No for septage acceptance and separately lists landfill leachate. The leachate entry reads 33,600 under a printed Volume (MGD) heading. This apparent unit mismatch is preserved, not silently converted into a verified daily volume. The attachment also contains biosolids analyses and land-application site information.",
    significance: "The filename does not establish septage acceptance. Page 8 carries a handwritten note reporting resampling because low solids raised concerns about the results. Neither the application entry nor biosolids testing supplies a load ticket or final delivery date.",
    sources: [archivedSource("Cadillac WWTP Septage Information.pdf", "/biosolids-docs/052-760656b79f1f.pdf", 16, "Page 1: No for septage, landfill leachate listed with unresolved unit presentation. Page 8: handwritten resampling qualification.", { eventStamp: "2012 application context · form undated", basis: "Archive application context", note: "No sampling or delivery date is established by this form." })],
  },
  {
    year: "2017",
    date: "2017-04-03",
    isoDate: "2017-04-03",
    time: noTime,
    timeBasis: "NPDES application submission date; SIU sheet itself undated",
    phase: "Reported leachate volume",
    kind: "regulatory",
    category: "04 · Industrial pretreatment",
    title: "Application and Wexford SIU sheet report distinct average flows",
    finding: "Cadillac's NPDES application identifies the WWTP at 1121 Plett Road and reports landfill leachate at 0.04 MGD (40,000 gallons/day) on page 14. The separate Wexford County Landfill LLC SIU sheet records 33,000 gallons/day of intermittent process wastewater under permit 590-13-Mixed Cells, with Local Limits checked.",
    significance: "These are separate reported average-flow entries, not individual delivery quantities or an authorized maximum. Their different values are not reconciled by these records. The one-page SIU sheet has no printed date; retain its 2017 archive context without inventing a sampling or delivery date. The final-load request remains open.",
    sources: [
      archivedSource("2017-04-03_Cadillac_WWTP_NPDES_Application.pdf", "/npdes-docs/080-6a540cadcdc6.pdf", 22, "Pages 2 and 14: WWTP address and 0.04 MGD landfill leachate; page 22: submission history.", { eventStamp: "2017-04-03 · application date", basis: "Application submission history", note: "Application date is not an individual delivery date." }),
      archivedSource("WEXFORD LANDFILL.pdf", "/ipp-docs/037-1f7e70d66b30.pdf", 1, "33,000 gallons/day, intermittent; Local Limits checked. Undated SIU form, not a receiving log.", { eventStamp: "Undated · 2017 archive context", basis: "SIU archive context; form undated", note: "Does not establish an individual delivery date." }),
    ],
  },
  {
    year: "2014",
    date: "2014-02-03",
    isoDate: "2014-02-03",
    time: noTime,
    timeBasis: "Incident date stated in the April 17 follow-up letter",
    phase: "Reported release",
    kind: "operation",
    category: "05 / 08 · Biosolids, compliance & enforcement",
    title: "Biosolids holding-tank overflow reported at the WWTP",
    finding: "Cadillac reported that a transfer from digester No. 2 overflowed biosolids holding tank No. 4. The transfer totaled 29,280 gallons; the letter estimates that at least 12,000 gallons and possibly as much as the full transfer spilled, while stressing that the actual amount was uncertain. Solids were not observed in the nearby storm drain after snowmelt, but the record could not rule out liquid migration. Contaminated material was moved to the sludge drying bed and the grounds were cleaned.",
    significance: "Preserves the original spill range, uncertainty, storm-drain caveat and cleanup response instead of converting the event into a single unsupported volume.",
    sources: [{
      name: "2010-2016_Cadillac WWTP_District Compliance File.pdf · pages 93–94",
      url: "https://github.com/cazey43/cadillac-pfas-event-trace/blob/efa59ca098bc5d59adef6edd8705cd336b9fd601/public/compliance-docs/020-9d6ad860baaf.pdf#page=93",
      pages: 232,
      page: 93,
      format: "PDF",
      role: "Source page",
      result: "Signed April 17, 2014 City follow-up report documenting the February 3 biosolids spill, volume uncertainty, cleanup and prevention response.",
      clock: {
        eventStamp: "2014-02-03 · time not stated",
        basis: "Incident date stated in the signed follow-up report",
        note: "The complete 232-page district compliance file is retained once as the primary record. The supplied v93-093.jpg and v93-094.jpg images are duplicate page derivatives and were not added separately.",
      },
    }],
  },
  {
    year: "2014",
    date: "2014-10-10",
    isoDate: "2014-10-10",
    time: noTime,
    timeBasis: "Inspection-record date",
    phase: "Operational baseline",
    kind: "operation",
    category: "10 · Process & site",
    title: "Hauled landfill leachate documented at the WWTP",
    finding: "The inspection record states that the equalization tank accepted hauled waste described as landfill leachate from the County Landfill and notes no screen or flow meter in that receiving area.",
    significance: "Establishes the physical receiving point later examined by the PFAS source investigation.",
    sources: [
      pdf("2014-10-10 Cadillac Pre-Inspection Report 56545.pdf", "2014-preinspection", 8, "Equalization tank identified as the receiving point for County Landfill leachate.", {
        eventStamp: "2014-10-10 · time not stated",
        basis: "Inspection-record date",
        created: "2015-11-26 20:48:28 CST",
        note: "The complete scan includes the signed completion page. The embedded creation timestamp is later than the inspection; it is retained as file history, not event time.",
      }),
      archivedSource("2014-10-10 - Cadillac WWTP NPDES CSI-Toxics Pre-Inspection Report.pdf", "/compliance-docs/060-dd5fb72d29bd.pdf", 7, "Standalone database export independently preserving the facility history and hauled-leachate receiving description.", {
        eventStamp: "2014-10-10 · time not stated",
        basis: "Inspection completion date stated in the report",
        note: "Retained separately from the related eight-page inspection package because this seven-page export has a distinct structure and page set.",
      }),
    ],
  },
  {
    year: "2015",
    date: "2015-05-14",
    isoDate: "2015-05-14",
    time: noTime,
    timeBasis: "Inspection date written on both interview records",
    phase: "Pretreatment compliance inspection",
    kind: "compliance",
    category: "04 · Industrial pretreatment",
    title: "DEQ interview records document Cadillac's pretreatment program",
    finding: "Two handwritten inspection records document the May 14, 2015 pretreatment compliance interview. They identify industrial-user concerns, POTW impacts, permit oversight, inspection and sampling practices, staffing and training, file-review selections, enforcement procedures and summary evaluations.",
    significance: "Preserves both inspectors' contemporaneous working records as separate evidence and distinguishes the May inspection date from the June 15 MiEnviro indexing date.",
    sources: [
      ippSource("Pretreatment Compliance Inspection Interview Notes — Jill Edelbrock.pdf", "https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/eb9cd4c0506afd72d73a4d4ebd4ab1ffe97ab7f5/public/ipp-docs/158-05788837212e.pdf", 6, "Six-page DEQ interview form documenting facility contacts, industrial-user issues, program implementation and the summary evaluation.", {
        eventStamp: "2015-05-14 · time not stated",
        basis: "Inspection date written on the record",
        note: "MiEnviro indexes the file on June 15, 2015; that repository date is retained as file history rather than substituted for the written inspection date.",
      }),
      ippSource("Pretreatment Compliance Inspection Interview Notes — Julie Lowe.pdf", "https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/eb9cd4c0506afd72d73a4d4ebd4ab1ffe97ab7f5/public/ipp-docs/159-4158539aa924.pdf", 8, "Eight-page DEQ interview and worksheet set documenting industrial-user issues, program procedures, the summary evaluation and monitoring and reporting worksheets.", {
        eventStamp: "2015-05-14 · time not stated",
        basis: "Inspection date written on the record",
        note: "MiEnviro indexes the file on June 15, 2015; that repository date is retained as file history rather than substituted for the written inspection date.",
      }),
    ],
  },
  {
    year: "2015",
    date: "2015-12-18",
    isoDate: "2015-12-18",
    time: "12:30–13:30 · zone not stated",
    timeBasis: "Approximate operating times stated in the December 21 incident letter",
    phase: "Treatment-system incident",
    kind: "operation",
    category: "08 · Compliance & enforcement",
    title: "Degreaser solution reached effluent during Aqua Disk cleaning",
    finding: "During cleaning of three Aqua Disk filtration tanks, the operator returned the tanks to service instead of pumping the diluted Grease B Gone solution to the headworks. The letter states that the solution began reaching effluent at about 12:30 p.m.; by about 1:30 p.m., fish in the onsite effluent-fed tank were incapacitated. Some fish and minnows died, most affected fish recovered after flow was redirected, and staff reported no observed evidence of impact during a river-bank inspection.",
    significance: "Separates the documented onsite biological response from the City's narrower statement that no river impact was observed; the record does not establish that no offsite impact occurred.",
    sources: [{
      name: "2015-12-21 City incident notification — Grease B Gone discharge",
      url: "https://github.com/cazey43/cadillac-pfas-event-trace/blob/efa59ca098bc5d59adef6edd8705cd336b9fd601/public/compliance-docs/022-8e59702f1f7f.pdf",
      pages: 1,
      page: 1,
      format: "PDF",
      role: "Primary source",
      result: "Signed City notification describing the December 18 filtration-cleaning error, fish response, flushing, river observation and corrective training.",
      clock: {
        eventStamp: "2015-12-18 12:30–13:30 · zone not stated",
        basis: "Approximate operating times stated in the signed December 21 letter",
        note: "The supplied v19-019.jpg is a page derivative of this complete one-page source and was not retained as a second copy.",
      },
    }],
  },
  {
    year: "2016",
    date: "2016-01-12",
    isoDate: "2016-01-12",
    time: "09:22 · zone not stated",
    timeBasis: "Notification-call time stated in the letter",
    phase: "Reported release",
    kind: "operation",
    category: "08 · Compliance & enforcement",
    title: "American Waste leachate offloading at Cadillac WWTP is documented by spill letter",
    finding: <>The January 12 letter documents <strong>actual American Waste leachate offloading at Cadillac WWTP</strong>, not merely a proposed delivery. At 9:22 a.m., Douglas Langworthy received a call from American Waste leachate driver Larry Springberg about the spill. The discharge had ended before staff arrived; leachate ran along the asphalt and ponded at a lower elevation. Snow berms, sandbags and packed snow protected the storm drains, and contaminated snow and soil were removed to the WWTP drying beds. <strong>10,000 gallons is tanker capacity, not a measured delivery or spill volume.</strong></>,
    significance: "This contemporaneous City record establishes offloading and the spill response even without a load ticket. Missing tickets do not negate this documented activity. The 9:22 a.m. timestamp is the notification call, not a verified delivery-start time. The typed letter does not identify the originating landfill, and it does not reconstruct every delivery.",
    sources: [{
      name: "January 12, 2016 American Waste leachate-offloading spill letter.pdf",
      url: "https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/efa59ca098bc5d59adef6edd8705cd336b9fd601/public/compliance-docs/039-c677de7c10e6.pdf",
      preview: bundledPublicAsset("/compliance-previews/2016-01-12-spill-letter.png"),
      pages: 1,
      page: 1,
      format: "PDF",
      role: "Primary source",
      result: "Page 1 identifies the American Waste driver and actual offloading incident, then records containment, cleanup and prevention. The letter gives tanker capacity but no measured load or spill volume.",
      clock: {
        eventStamp: "2016-01-12 09:22 · zone not stated",
        basis: "Notification-call time stated in the signed letter",
        note: "The complete one-page original is linked directly. The January 19, 2016 agency receipt stamp is not the offloading date. The typed body does not name the originating landfill; the provenance of the handwritten Wexford notation is not established.",
      },
    }],
  },
  {
    year: "2016",
    date: "2016-01-19",
    isoDate: "2016-01-19",
    time: "Approximately 6:00 PM",
    timeBasis: "Call-to-order time in the council minutes",
    phase: "Chemical purchasing authorization",
    kind: "operation",
    category: "10 · Process & site documents",
    title: "Cadillac extends Kemira ferric-chloride purchasing through December 2017",
    finding: <>Council approved motion 2016-019 extending Water and Sewer purchasing authorizations through <strong>December 31, 2017</strong>, including ferric chloride from <strong>Kemira Water Solutions</strong>. The same action also covers biosolids-injection services and other water-system chemicals; those are separate activities, not all inbound WWTP deliveries.</>,
    significance: "Establishes the named chemical supplier and authorized purchasing period. The minutes are purchase authorization, not an individual shipment record, delivery receipt or invoice.",
    sources: [{
      ...archivedSource("January 19, 2016 Cadillac City Council Minutes.pdf", "/process-site-docs/process-site-021-6c2e73d85da0.pdf", 7, "Pages 4–5 record the purchasing extension and motion 2016-019, including Kemira ferric chloride through December 31, 2017.", {
        eventStamp: "2016-01-19 approximately 6:00 PM · meeting opened",
        basis: "Dated council minutes and recorded motion",
        note: "The authorization end date is not an actual shipment date. Water-system chemicals and biosolids services are not treated as evidence of inbound leachate deliveries.",
      }),
      page: 4,
    }],
  },
  {
    year: "2016",
    date: "2016-03-29",
    isoDate: "2016-03-29",
    time: noTime,
    timeBasis: "Date printed on JWC quotation 32331",
    phase: "Equipment quotation",
    kind: "operation",
    category: "10 · Process & site documents",
    title: "JWC quotes Channel Monster equipment with shipping terms and estimated lead times",
    finding: <>JWC Environmental quotation 32331, dated March 29 and included in the April 18 council attachment, prices the Channel Monster equipment package at <strong>$52,100</strong>, including shipping and handling. It estimates submittals four weeks after order and shipment eight weeks after approval and release, with FOB Origin and Net 30 terms. The following terms page identifies the dates as estimates.</>,
    significance: "Begins the quotation-to-award-to-installation source trail: April 18, 2016 minutes approve the purchase, and February 6, 2023 minutes later confirm installation of the same equipment type in 2016. This supports the chronological connection without identifying an exact unit. The quotation itself supplies no actual shipment date or carrier; the listed representative is not identified as the transporter.",
    sources: [{
      ...archivedSource("Channel Monster purchase recommendation and JWC Environmental quotation 32331.pdf", "/process-site-docs/process-site-019-1376a072059f.pdf", 4, "Page 1 is the April 18 recommendation; pages 2–3 contain the March 29 quotation, price, shipping terms and estimated lead times. No actual shipment date or carrier is recorded.", {
        eventStamp: "2016-03-29 · time not stated",
        basis: "Quotation date on PDF page 2",
        note: "The quotation date is distinct from the April 18 council recommendation and award. Estimated lead times are not converted into assumed delivery dates.",
      }),
      page: 2,
    }],
  },
  {
    year: "2016",
    date: "2016-04-18",
    isoDate: "2016-04-18",
    time: "Approximately 6:00 PM",
    timeBasis: "Call-to-order time in the council minutes",
    phase: "WWTP equipment purchase awards",
    kind: "operation",
    category: "10 · Process & site documents",
    title: "Council approves $52,100 in JWC equipment and two HESCO wastewater samplers",
    finding: <>Council unanimously approved <strong>$52,100 for JWC Environmental equipment</strong> under motion 2016-098 and the purchase of <strong>two HESCO automatic refrigerated wastewater samplers</strong> under motion 2016-099. City personnel were expected to install the grinder. The later February 6, 2023 minutes state that the same equipment type—a Channel Monster grinder—was installed in <strong>2016</strong>.</>,
    significance: "The quotation, approved purchase and later installation statement support a chronological procurement-to-installation connection; the 2023 statement does not identify the exact April 2016 unit. The award alone is not proof of physical delivery, and these records do not identify an exact 2016 arrival date, carrier or receiving ticket.",
    sources: [{
      ...archivedSource("April 18, 2016 Cadillac City Council Meeting Minutes.pdf", "/process-site-docs/process-site-018-26f79914deae.pdf", 7, "Page 5 records motions 2016-098 and 2016-099: the $52,100 JWC purchase and two HESCO wastewater samplers.", {
        eventStamp: "2016-04-18 approximately 6:00 PM · meeting opened",
        basis: "Meeting date and recorded purchasing motions",
        note: "Approval and intended City installation are distinguished from delivery and completed installation.",
      }),
      page: 5,
    }, {
      ...archivedSource("February 6, 2023 Cadillac City Council Minutes — 2016 installation cross-reference.pdf", "/process-site-docs/process-site-020-28d1cb87cb36.pdf", 3, "Pages 2–3 retrospectively state that the same equipment was installed in 2016. This later source is also shown separately in the 2023 year band.", {
        eventStamp: "2023-02-06 · retrospective statement about 2016",
        basis: "2023 meeting date; installation year stated on page 2",
        note: "The 2023 record does not establish the exact 2016 installation or delivery date. The failed unit discussed in 2023 was purchased in 1997, not 2016.",
      }),
      page: 2,
      role: "Cross-reference",
    }],
  },
  {
    year: "2016",
    date: "2016-05-09",
    isoDate: "2016-05-09",
    time: "Approximately 4:30 PM",
    timeBasis: "Opening time in the work-session minutes; budget attachments retained",
    phase: "Hauled-waste revenue and pollution-control goals",
    kind: "operation",
    category: "10 / 12 · Process, landfill & leachate",
    title: "Cadillac pursues hauled-waste revenue while warning against reliance on leachate income",
    finding: <>The May 9 work-session packet seeks <strong>new revenue from additional hauled waste</strong> alongside Water Resources goals to stay below NPDES permit levels, limit industrial waste through active monitoring and preserve Class A EQ biosolids (PDF p. 19). Its revenue highlights report <strong>leachate revenue continuing above budget</strong>, caution against building too much reliance on it, and direct the extra revenue toward system reinvestment (p. 21).</>,
    significance: "Places the revenue objective and pollution-control goals together in the City's own 2016 planning record, separately from the FY2019 budget. It does not quantify individual deliveries, identify their haulers, establish that additional waste was accepted or show whether the stated control goals were achieved.",
    sources: [{
      ...archivedSource("May 9, 2016 Cadillac work-session minutes and budget attachments — fiscal and environmental goals.pdf", "/process-site-docs/process-site-023-0fcc5cbb1c14.pdf", 29, "PDF page 19 sets out hauled-waste revenue, industrial-monitoring, NPDES and Class A EQ biosolids goals; page 21 reports above-budget leachate revenue and cautions against reliance. Both scanned pages were visually checked against OCR.", {
        eventStamp: "2016-05-09 approximately 4:30 PM · work session opened",
        basis: "Work-session date on the minutes accompanying the budget attachments",
        note: "The 29-page scan includes minutes and attachments. The revenue highlights provide no leachate dollar amount, per-load gallons or delivery dates.",
      }),
      page: 19,
    }, {
      ...archivedSource("May 9, 2016 budget attachment — leachate revenue highlights, PDF page 21", "/process-site-docs/process-site-023-0fcc5cbb1c14.pdf", 29, "Page 21 is the Water and Sewer Fund revenue discussion: above-budget leachate income, caution against excessive reliance and reinvestment of extra revenue.", {
        eventStamp: "2016-05-09 · work-session packet",
        basis: "Same original packet; direct link to the revenue page",
        note: "This is a second page reference to the same preserved original, not a separate document or delivery record.",
      }),
      page: 21,
      role: "Source page",
    }],
  },
  {
    year: "2017",
    date: "2017-11-20",
    isoDate: "2017-11-20",
    time: "6:00 PM",
    timeBasis: "Council-meeting time printed in the minutes",
    phase: "WWTP chemical contract award",
    kind: "operation",
    category: "10 · Process & site documents",
    title: "Cadillac awards Webb the 2018–2020 ferric-chloride contract at $0.245 per dry pound",
    finding: <>Motion 2017-225 awards Webb Chemical Service Corporation the WWTP ferric-chloride contract for <strong>January 1, 2018 through December 31, 2020</strong> at <strong>$0.245 per dry pound</strong>. The minutes identify ferric chloride as a wastewater-treatment chemical used for phosphorus removal.</>,
    significance: "Identifies the supplier, contract price and authorized supply period. This purchasing action is separate from the same meeting's landfill-leachate and injection-well discussion. It is not an invoice, payment statement or record of an individual chemical delivery.",
    sources: [{
      ...archivedSource("November 20, 2017 Cadillac City Council Minutes — Webb ferric-chloride award.pdf", "/findings-docs/164-519d4faa6c33.pdf", 9, "Pages 2–3 record the ferric-chloride contract, price, term and motion 2017-225. The separately discussed municipal-water chemicals are not classified as WWTP deliveries.", {
        eventStamp: "2017-11-20 6:00 PM · meeting time",
        basis: "Meeting date and time; purchasing motion on pages 2–3",
        note: "The award belongs under 2017; the January 2018 contract start is not proof of a delivery on that date.",
      }),
      page: 2,
    }],
  },
  {
    year: "2019",
    date: "2019-02-18",
    isoDate: "2019-02-18",
    time: "Approximately 6:00 PM",
    timeBasis: "Call-to-order time in the council minutes",
    phase: "WWTP pump purchase award",
    kind: "operation",
    category: "10 · Process & site documents",
    title: "Council authorizes $9,300 for three Mattoon & Lee WWTP metering pumps",
    finding: <>Under motion 2019-034, Council authorized <strong>$9,300 for three chemical-metering pumps</strong> from <strong>Mattoon &amp; Lee Equipment</strong> for the wastewater treatment plant.</>,
    significance: "Documents a named vendor, equipment quantity and approved WWTP purchase. It does not establish actual shipment, receipt or installation, and is separate from the meeting's unrelated water-well work.",
    sources: [{
      ...archivedSource("February 18, 2019 Cadillac City Council Minutes — WWTP metering pumps.pdf", "/process-site-docs/process-site-022-fe153aeaa6d9.pdf", 12, "Page 4 records motion 2019-034 and the $9,300 authorization for three WWTP chemical-metering pumps.", {
        eventStamp: "2019-02-18 approximately 6:00 PM · meeting opened",
        basis: "Meeting date and recorded purchasing motion",
        note: "This is a purchase authorization, not a delivery receipt or an installation record.",
      }),
      page: 4,
    }],
  },
  {
    year: "2023",
    date: "2023-02-06",
    isoDate: "2023-02-06",
    time: "Approximately 6:00 PM",
    timeBasis: "Call-to-order time; retrospective statement about 2016",
    phase: "Confirmation of 2016 equipment installation",
    kind: "operation",
    category: "10 · Process & site documents",
    title: "2023 council minutes confirm that the same JWC equipment was installed in 2016",
    finding: <>In discussing another Channel Monster grinder purchase, the February 6, 2023 minutes state that <strong>the same equipment was installed in 2016</strong> and express a preference to continue with the same manufacturer. This corroborates installation of the same equipment type in 2016. The failed unit discussed in the 2023 minutes was purchased in <strong>1997</strong>, not 2016.</>,
    significance: "Read with the March 29 quotation and April 18 award, this supports a procurement-to-installation connection as a chronological inference, not identification of the exact unit. The source stays in the 2023 year band and is cross-referenced under the 2016 award; it does not supply an exact 2016 delivery date, carrier or receiving ticket.",
    sources: [{
      ...archivedSource("February 6, 2023 Cadillac City Council Meeting Minutes.pdf", "/process-site-docs/process-site-020-28d1cb87cb36.pdf", 3, "Pages 2–3 discuss equipment history and the new 2023 purchase. Page 2 states that the same equipment was installed in 2016 and distinguishes the failed unit purchased in 1997.", {
        eventStamp: "2023-02-06 approximately 6:00 PM · meeting opened",
        basis: "Date of the minutes; 2016 is the installation year recounted within them",
        note: "The 2023 purchase is not recast as the 2016 award. The retrospective statement supports the installation year, not a precise 2016 arrival date.",
      }),
      page: 2,
    }],
  },
  {
    year: "2016",
    date: "2016-02-26",
    isoDate: "2016-02-26",
    time: noTime,
    timeBasis: "Response-letter date",
    phase: "Violation response",
    kind: "compliance",
    category: "08 · Compliance & enforcement",
    title: "Cadillac responds to Violation Notice VN-006346",
    finding: "The City's response identifies two violation periods—October 21 through November 27, 2014 and January 9 through June 23, 2015—and describes floating sludge, clarifier bulking, cloth-filter bypass, reduced UV dose and solids reaching the river. It lists repeated TSS, CBOD5, fecal-coliform, ammonia, phosphorus and pH violations and states that the prior supervisor did not provide the written notices required for each occurrence.",
    significance: "Adds the City's own causal and reporting account to the exceedance tables: operational instability and inadequate communication/supervision were expressly acknowledged, while the precise initiating material remained unresolved.",
    sources: [{
      name: "VN response from City Feb 29 2016.pdf",
      url: "https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/efa59ca098bc5d59adef6edd8705cd336b9fd601/public/compliance-docs/040-e1b7446e4226.pdf",
      preview: bundledPublicAsset("/source-previews/040-e1b7446e4226.jpg"),
      pages: 5,
      page: 1,
      format: "PDF",
      role: "Primary source",
      result: "Five-page municipal response to VN-006346, dated February 26 and agency-received February 29, with violation periods, parameters, causes and corrective actions.",
      clock: {
        eventStamp: "2016-02-26 · time not stated",
        basis: "Date printed on the signed response letter",
        note: "The supplied vn-014.jpg, v14-015.jpg and v14-016.jpg are duplicate page images of this complete response and were not added separately.",
      },
    }],
  },
  {
    year: "2016",
    date: "2016-03-09",
    isoDate: "2016-03-09",
    time: noTime,
    timeBasis: "Request date in the source package",
    phase: "Leachate management",
    kind: "operation",
    category: "12 · Landfill & leachate",
    title: "Landfill requests one-time groundwater discharge authorization",
    finding: "The landfill's request package seeks Rule 2210(y) authorization to remove leachate-impacted precipitation from the evaporator lagoon. The package also preserves a November 2, 2015 agency approval letter associated with the earlier handling arrangement.",
    significance: "Replaces the earlier broad 2015–2016 label with the dated original request and connects the lagoon-management record to the later formal application.",
    sources: [pdf("2015-2016_Wexford County Landfill_Leachate Request.pdf", "2015-2016-leachate-request", 3, "Three-page scanned request package, retained once because the supplied copy exactly matches the source already on the site.", {
      eventStamp: "2016-03-09 · time not stated",
      basis: "Request date documented in the source package",
      created: "2025-03-06 08:29:43 CST",
      modified: "2025-03-06 08:29:51 CST",
      note: "The PDF timestamps are later digitization metadata, not the date of the underlying request.",
    })],
  },
  {
    year: "2016",
    date: "2016-03-16",
    isoDate: "2016-03-16T15:31:00",
    time: "15:31 · zone not stated",
    timeBasis: "Portal submission timestamp",
    phase: "Groundwater application",
    kind: "regulatory",
    category: "12 · Landfill & leachate",
    title: "Rule 2210(y) application defines the proposed discharge",
    finding: "Submission 2E2-C5H5-QVVF proposes up to 50,400 gallons per day and 2,000,000 gallons per year, during April through June, using dilution and overland flow to remove impacted water from the evaporator lagoon.",
    significance: "Fixes the application clock, volume, seasonal window, treatment method and mapped discharge context in the primary portal record.",
    sources: [pdf("Wexford Landfill Groundwater Discharge Permit Application 2210(y).docx", "2016-03-16-rule-2210-application", 11, "Submitted Rule 2210(y) application with attached map and analytical-record index.", {
      eventStamp: "2016-03-16 15:31 · zone not stated",
      basis: "Portal submission timestamp printed in the record",
      created: "2016-07-12 15:53:11 EDT",
      note: "Despite its .docx filename, the source contains a valid PDF payload; the later PDF creation date records export, not submission.",
    }, "https://github.com/cazey43/cadillac-pfas-event-trace/blob/1f44c9e90e718f6e130bdfc319be48098d2163e5/public/wexford-docs/016-7ee1b2c9396c.pdf")],
  },
  {
    year: "2016",
    date: "2016-07-15",
    isoDate: "2016-07-15",
    time: noTime,
    timeBasis: "Public-notice date",
    phase: "Public notice",
    kind: "regulatory",
    category: "12 · Landfill & leachate",
    title: "DEQ issues the proposed groundwater-authorization public notice",
    finding: "The public notice identifies proposed permit GW1010342 and the Rule 2210(y) authorization process for the Wexford County Landfill discharge to ground or groundwater. DEQ's July 12 email transmitted the cover letter, public notice, certification form and draft permit, directed the recipients to have the notice published by July 15 and recorded that a public-notice email sent the preceding week had not been received.",
    significance: "Documents the formal public-notice stage between application review and final issuance, including the agency's publication instruction and acknowledged transmission delay. The email does not itself verify that newspaper publication occurred by July 15.",
    sources: [
      pdf("GW Public Notice Document.html", "2016-07-15-gw-public-notice", 1, "One-page public notice; the supplied file exactly matches Category 02 record 076.", {
        eventStamp: "2016-07-15 · time not stated",
        basis: "Date printed in the public notice",
        created: "2016-07-12 15:48:26 EDT",
        note: "The .html-named source is a valid PDF payload. Its creation metadata reflects preparation three days before publication.",
      }, "/npdes-docs/076-a611a75485cf.pdf"),
      {
        ...archivedSource("DEQ Email Transmitting Wexford County Landfill Public-Notice Documents.pdf", "/wexford-docs/013-46619080fc73.pdf", 1, "Email transmitting the four-document public-notice package, directing newspaper publication by July 15 and recording that an earlier public-notice email had not been received.", {
          eventStamp: "2016-07-12 3:36 PM · zone not stated",
          basis: "Sent date and time printed in the email",
          created: "2016-07-12 15:46:17 EDT",
          modified: "2016-07-12 15:46:17 EDT",
          note: "This exact established Wexford record is used as a cross-reference to the July 15 public-notice event. It proves the agency's instruction and acknowledged email delay, but not completion of newspaper publication by the stated date.",
        }),
        role: "Cross-reference",
      },
    ],
  },
  {
    year: "2016",
    date: "2016-09-06",
    isoDate: "2016-09-06",
    time: noTime,
    timeBasis: "Issued date printed on permit",
    phase: "Final authorization",
    kind: "regulatory",
    category: "12 · Landfill & leachate",
    title: "Final permit authorizes a one-time diluted-leachate discharge",
    finding: "Permit GW1010342 authorizes up to 50,400 gallons per day and 2,000,000 gallons per year from the evaporator lagoon by land application using overland flow and a spray bar. It takes effect October 1, 2016 and expires January 31, 2017.",
    significance: "Separates the final legal authorization and its operating window from the earlier draft and application records.",
    sources: [{
      ...pdf("Rule 2210 Permit Template-Wexford Landfill.docx", "2016-09-06-rule-2210-final", 26, "Final permit with limits, monitoring conditions and attachments.", {
      eventStamp: "2016-09-06 · time not stated",
      basis: "Issued date printed on permit page 1",
      created: "2016-09-16 13:43:08 EDT",
      note: "The source filename says .docx but the payload is PDF. The export/cover-email date is ten days after the permit's printed issued date.",
      }, "/docs/2016-09-06-rule-2210-final.pdf"),
      renderedPages: Array.from({ length: 26 }, (_, index) => bundledPublicAsset(`/document-pages/2016-09-06-rule-2210-final/${String(index + 1).padStart(2, "0")}.webp`)),
    }],
  },
  {
    year: "2017",
    date: "2017-04-03",
    isoDate: "2017-04-03T15:40:49",
    time: "15:40:49 · zone not stated on page",
    timeBasis: "Rendered portal submission timestamp",
    phase: "Permit record",
    kind: "regulatory",
    category: "02 · NPDES permits",
    title: "NPDES application fixes the regulated-system baseline",
    finding: "The application records the treatment configuration, regulated discharge framework and facility representations preceding the PFAS initiative.",
    significance: "Provides the permit baseline for later monitoring and compliance events.",
    sources: [pdf("2017-04-03_Cadillac_WWTP_NPDES_Application.pdf", "2017-npdes-application", 22, "Twenty-two-page Cadillac WWTP NPDES application.", {
      eventStamp: "2017-04-03 15:40:49 · zone not stated on page",
      basis: "Portal submission timestamp rendered on every page",
      created: "2017-04-03 14:40:49 CDT",
      note: "The rendered submission time and embedded PDF creation time differ by one hour; both are preserved without reconciliation.",
    }, "/npdes-docs/080-6a540cadcdc6.pdf")],
  },
  {
    year: "2017",
    date: "2017-04-05",
    isoDate: "2017-04-05",
    time: "5:30 PM · meeting opened",
    timeBasis: "Meeting opening on PDF page 1; public-comment time not stated",
    phase: "Public governance",
    kind: "gap",
    category: "12 · Landfill & leachate",
    title: "Cedar Creek reports missing landfill updates",
    finding: "During public comment, the Cedar Creek Township treasurer told the Wexford County Board that the township was not receiving updates or documents from Infrastructure, referred to RAP-area discussion and asked that Cedar Creek be included in the American Waste discussion concerning the County's yearly fee. The minutes state that the matter would be looked into.",
    significance: "Preserves a contemporaneous public communication concern without converting the statement into a finding that a legally required notice was missed or that a response was completed.",
    sources: [{
      ...archivedSource("Wexford County Board Minutes — Cedar Creek Updates and American Waste Discussion.pdf", "/findings-docs/134-3dc615cfcf9c.pdf", 9, "Nine-page adopted minutes; the relevant public-comment entry appears on PDF page 8.", {
        eventStamp: "2017-04-05 5:30 PM · meeting opened; zone not stated",
        basis: "Meeting opening on PDF page 1; public comment on page 8 has no separate time",
        note: "The source records the public statement and the Board's notation that the matter would be looked into. It does not establish a legal-notice violation or preserve a later response.",
      }),
      page: 8,
    }],
  },
  {
    year: "2015",
    date: "2015-10-21",
    isoDate: "2015-10-21",
    time: "5:30 PM · meeting opened",
    timeBasis: "Meeting opening on PDF page 1; public-comment time not stated",
    phase: "Public governance",
    kind: "gap",
    category: "12 · Landfill & leachate",
    title: "Cedar Creek raises RAP water-service and record-access concerns",
    finding: "Cedar Creek Township Treasurer Mary Hallett told the Wexford County Board that properties within the remedial action plan (RAP) area should receive water under the host agreement, described an unserved property, and stated her belief that DPW must maintain accurate records and that the township should have access to all legal documents. The minutes preserve these statements in public comment.",
    significance: "Documents a contemporaneous water-service and records-access concern. These are attributed statements, not the executed host agreement, an adjudication of its obligations, or leachate delivery records.",
    sources: [{
      ...archivedSource("Wexford County Board Minutes — October 21, 2015.pdf", "/wexford-docs/105-b03fe8433176.pdf", 7, "Public comments concerning RAP-area water service, the host agreement, DPW records and access to legal documents appear on PDF page 2.", {
        eventStamp: "2015-10-21 5:30 PM · meeting opened; zone not stated",
        basis: "Meeting opening on PDF page 1; public comments on page 2",
        note: "Meeting opening is not the time of the individual public comment. The minutes record the speaker's account, not an independent determination of host-agreement compliance.",
      }),
      page: 2,
    }],
  },
  {
    year: "2017",
    date: "2017-11-01",
    isoDate: "2017-11-01",
    time: "5:30 PM · meeting opened",
    timeBasis: "Meeting opening on PDF page 1; motion time not stated",
    phase: "Injection-well deliberation",
    kind: "regulatory",
    category: "12 · Landfill & leachate",
    title: "Wexford votes 8–1 to develop an injection-well opposition resolution",
    finding: <>After discussion of the proposed landfill injection wells and public comments, the County Board voted <strong>8–1 to develop a resolution opposing the injection wells</strong>, with Commissioner Hilty voting against. The minutes say the resolution would be prepared for the next meeting and, if approved, sent to EPA and DEQ.</>,
    significance: "This was direction to prepare an opposition resolution, not final adoption of that resolution. Concerns voiced about leachate chemistry and limestone are deliberative statements, not measured groundwater or PFAS findings. This County action is separate from Cadillac's November 20, 2017 action.",
    sources: [{
      ...archivedSource("Wexford County Board Minutes — November 1, 2017.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/b4705928d16ccaac9701ee43cba04369982c5ab6/public/wexford-docs/044-7c628f229e98.pdf", 8, "PDF page 6, item 15, records the injection-well discussion and 8–1 motion to develop a resolution.", {
        eventStamp: "2017-11-01 5:30 PM · meeting opened; zone not stated",
        basis: "Meeting opening on PDF page 1; motion on page 6",
        note: "The injection-well motion must not be confused with the separate delinquent-water-bill resolution in the same minutes. No completed delivery or final opposition-resolution adoption is established by this entry.",
      }),
      page: 6,
    }],
  },
  {
    year: "2020",
    date: "2020-09-21",
    isoDate: "2020-09-21",
    time: noTime,
    timeBasis: "EGLE letter date; included in the October 13 packet",
    phase: "Drinking-water monitoring",
    kind: "regulatory",
    category: "04 · PFAS monitoring",
    title: "EGLE requires Cedar Creek drinking-water PFAS sampling by February 3, 2021",
    finding: <>EGLE's September 21 letter requires initial PFAS compliance sampling for Cedar Creek's drinking-water system, WSSN 01258, by <strong>February 3, 2021</strong>. The attached schedule identifies <strong>TP001 Plant Tap (Well No. 1 and 2)</strong>. The letter describes the prior statewide-survey category as no detections or detections at or below 50% of the maximum contaminant level; it does not specify which alternative applied or provide measured concentrations.</>,
    significance: "A drinking-water monitoring requirement, not completed sampling, a PFAS exceedance, or Cadillac WWTP influent or effluent data. It is separate from the contaminated-soil disposal proposal elsewhere in the packet.",
    sources: [{
      ...archivedSource("EGLE Cedar Creek PFAS Sampling Letter and Schedule — in October 13, 2020 Executive Packet.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/8d7d759d5377b74e9aee5c7b13da2252fc1cde53/public/pfas-docs/014-990955a02a90.pdf", 15, "PDF pages 14–15 contain the September 21 letter and TP001 sampling schedule; printed packet pages 13–14.", {
        eventStamp: "2020-09-21 · time not stated",
        basis: "Date printed on EGLE letter, PDF page 14",
        note: "The letter's September 28 receipt stamp and October 13 packet date do not replace the September 21 letter date. The letter provides no analytical results or source attribution.",
      }),
      page: 14,
    }],
  },
  {
    year: "2020",
    date: "2020-10-13",
    isoDate: "2020-10-13",
    time: "4:00 PM · scheduled meeting",
    timeBasis: "Tentative agenda; not proof the meeting or disposal occurred",
    phase: "Soil-disposal proposal",
    kind: "regulatory",
    category: "12 · Landfill & leachate",
    title: "PFAS agenda item proposes 250–300 tons of soil for Wexford landfill",
    finding: <>The Executive Committee packet's PFAS Disposal Request describes AKT Peerless Environmental's request to dispose of an estimated <strong>250–300 tons of contaminated soil from a Bay City fire station</strong> at Wexford County Landfill. It states GFL would pay <strong>$0.65 per ton to the County and $0.60 per ton to Cedar Creek Township</strong>. Because Bay County was not an approved importing county under the solid-waste plan, the packet sought discussion and a motion for the full Board; an EGLE response was still pending.</>,
    significance: "Preserves the proposed material, origin, destination and anticipated fees. The packet is not an approval, shipment ticket, payment record or proof of completed delivery, and the proposed destination is the landfill—not Cadillac WWTP. Attached September 8 minutes on PDF pages 2–4 are marked DRAFT and are not minutes of October 13 action.",
    sources: [{
      ...archivedSource("Wexford Executive Committee Packet — PFAS Disposal Request, October 13, 2020.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/8d7d759d5377b74e9aee5c7b13da2252fc1cde53/public/pfas-docs/014-990955a02a90.pdf", 15, "PDF page 13 (printed page 12), agenda item G.4, sets out the proposed soil disposal and anticipated County and Township fees.", {
        eventStamp: "2020-10-13 4:00 PM · scheduled meeting; zone not stated",
        basis: "Tentative agenda date and time on PDF page 1; proposal on page 13",
        note: "This is an agenda-packet proposal. Neither actual tonnage received nor a completed disposal, fee payment, or WWTP delivery is established.",
      }),
      page: 13,
    }],
  },
  {
    year: "2018",
    date: "2018-02-20",
    isoDate: "2018-02-20",
    time: noTime,
    timeBasis: "Letter date",
    phase: "PFAS initiative",
    kind: "regulatory",
    category: "03 · IPP pretreatment",
    title: "EGLE directs PFAS source evaluation and reduction",
    finding: "The PFAS-IPP letter placed Cadillac into the statewide industrial pretreatment source-evaluation process and established reporting duties.",
    significance: "Begins the formal chain from screening to sampling, source confirmation and status reporting.",
    sources: [pdf("MI0020257 PFAS-IPP Letter 2-20-2018.pdf", "2018-02-20-pfas-ipp-letter", 5, "PFAS source-evaluation and reduction requirements for MI0020257.", {
      eventStamp: "2018-02-20 · time not stated",
      basis: "Letter date",
      created: "2018-02-21 10:03:16 CST",
      modified: "2018-02-21 10:03:16 CST",
      note: "The scan timestamp is the next day and is not used as the directive date.",
    })],
  },
  {
    year: "2018",
    date: "2018-03",
    isoDate: "2018-03",
    time: noTime,
    timeBasis: "Publication month and reporting year printed in source",
    phase: "Industrial significant noncompliance",
    kind: "compliance",
    category: "04 · Industrial pretreatment",
    title: "Cadillac publishes 2017 industrial SNC notice",
    finding: "The rendered newspaper notice identifies significant noncompliance (SNC) by Rec Boat divisions, Cadillac Castings and AAR Mobility Systems and lists the pollutants associated with the cited exceedances.",
    significance: "Adds the annual public-notice record to the industrial-compliance history without treating same-template facility records as duplicates.",
    sources: [ippSource("2018-03 Cadillac News IPP SNC notice.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/3553feaa71173065084148263f8911dfa61f174d/public/ipp-docs/040-99a3b1774a76.pdf", 1, "Image-only newspaper clipping publishing the 2017 industrial SNC notice.", {
      eventStamp: "2018-03 · time not stated",
      basis: "Publication month and reporting year printed in source",
      note: "The clipping is image-only; the notice was verified from the rendered page.",
    })],
  },
  {
    year: "2018",
    date: "2018-04-18",
    isoDate: "2018-04-18",
    time: noTime,
    timeBasis: "Agency-letter date",
    phase: "Program coordination",
    kind: "regulatory",
    category: "04 · PFAS monitoring",
    title: "DEQ links IPP screening to landfill-leachate sampling",
    finding: "DEQ's follow-up letter tells Cadillac that the waste program is developing landfill-leachate sampling and reporting procedures, encourages coordination with landfill customers and moves the extension or alternative-plan request deadline to May 8, 2018.",
    significance: "Connects landfill sampling to Cadillac's formal PFAS-source investigation before the interim report.",
    sources: [archivedSource("DEQ PFAS Source Evaluation Follow Up - Cadillac WWTP.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/49922c706588f236e1edbad5fa8996e4c249e330/public/pfas-docs/097-e13fc785334f.pdf", 2, "Two-page agency follow-up explaining the landfill-leachate initiative and revised request deadline.", {
      eventStamp: "2018-04-18 · time not stated",
      basis: "Agency-letter date",
      created: "2018-04-19 14:21:40 EDT",
      modified: "2018-04-19 14:21:40 EDT",
      note: "The dated letter controls the event. Both image-only pages were OCR-verified; scanner metadata records the following day's file creation.",
    })],
  },
  {
    year: "2018",
    date: "2018-05-24",
    isoDate: "2018-05-24",
    time: noTime,
    timeBasis: "Approval-letter date",
    phase: "Schedule approval",
    kind: "regulatory",
    category: "03 · IPP pretreatment",
    title: "Alternative monitoring schedule approved",
    finding: "DEQ approved the alternative plan, setting the Interim Report deadline at July 31, 2018 and Summary Report deadline at November 30, 2018.",
    significance: "Fixes the official timetable used to assess the source investigation.",
    sources: [pdf("Cadillac WWTP_PFAS Extension Approval FINAL.pdf", "2018-05-24-extension-approval", 1, "Approval granted with revised interim and summary deadlines.", {
      eventStamp: "2018-05-24 · time not stated",
      basis: "Approval-letter date",
      created: "2018-05-23 12:18:00 CDT",
      modified: "2018-05-24 15:50:00 CDT",
      note: "The letter date controls the event; embedded timestamps record drafting and final modification.",
    })],
  },
  {
    year: "2018",
    date: "2018-06-27",
    isoDate: "2018-06-27",
    time: noTime,
    timeBasis: "Monitoring-plan record date",
    phase: "Monitoring design",
    kind: "regulatory",
    category: "04 · PFAS monitoring",
    title: "Screening and source-sampling method documented",
    finding: "The plan describes surveys, probable-source notification, priority sampling, laboratory delivery and follow-up POTW effluent sampling.",
    significance: "Defines how a probable source would be tested and connected to POTW results.",
    sources: [pdf("2018 IPP Screening - Monitoring Plan.180627modif.pdf", "2018-06-27-monitoring-plan", 3, "Three-page PFAS screening, notification and sampling workflow.", {
      eventStamp: "2018-06-27 · time not stated",
      basis: "Dated monitoring-plan record",
      created: "2018-07-30 12:46:00 CDT",
      modified: "2018-07-30 12:46:00 CDT",
      note: "The embedded PDF timestamp reflects later file generation and does not replace the plan date.",
    })],
  },
  {
    year: "2018",
    date: "2018-07-30",
    isoDate: "2018-07-30T14:49:05-04:00",
    time: "14:49:05 EDT",
    timeBasis: "MiWaters submission history",
    phase: "Interim source screening",
    kind: "regulatory",
    category: "11 · Form submission",
    title: "Cadillac flags Wexford County Landfill as a probable PFAS source",
    finding: "The interim MiWaters report lists Wexford County Landfill as the only probable source among the screened facilities, says it is participating in the waste program's initiative and records source-sampling results as pending. POTW effluent had not yet been sampled.",
    significance: "Documents the landfill link as the submitted working hypothesis before the leachate laboratory result.",
    sources: [archivedSource("HNF-P7H3-DCN87 V1 - IPP PFAS Interim Report.pdf", "/form-submission-docs/form-submission-073-c84ac8484363.pdf", 3, "Born-digital MiWaters interim submission listing screened facilities, probable-source status and pending sampling.", {
      eventStamp: "2018-07-30 14:49:05 EDT",
      basis: "MiWaters submission-history entry",
      created: "2018-07-30 14:49:08 EDT",
      modified: "2018-07-30 14:49:08 EDT",
      note: "The portal history records submission three seconds before the digitally certified PDF was generated.",
    })],
  },
  {
    year: "2018",
    date: "2018-08-27",
    isoDate: "2018-08-27T16:04:00",
    time: "16:04 · zone not stated",
    timeBasis: "DEQ email sent time",
    phase: "Interim-report review",
    kind: "regulatory",
    category: "04 / 09 · PFAS monitoring & correspondence",
    title: "DEQ opens a six-facility PFAS source review",
    finding: "DEQ asks Cadillac to verify possible PFAS pathways at AAR, Rec Boat, Michigan Rubber Products, Avon Automotive, ARVCO and Hutchinson. The preserved thread includes Cadillac's September responses and DEQ's September 20 acknowledgement that review would continue.",
    significance: "Documents the agency's detailed follow-up between the interim source-screening submission and the later sampling direction without treating a survey or SDS review as an analytical result.",
    sources: [archivedSource("2018-09-20 - PFAS Interim Report Follow-Up Questions and City Response.pdf", "https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/623d9abbdd9aa2dd388da68e3e95c23e59c31387/public/correspondence-docs/corr-041-7797237d5b67.pdf", 4, "Four-page City/DEQ thread preserving the August 27 questions, September responses and September 20 acknowledgement.", {
      eventStamp: "2018-08-27 16:04 · zone not stated",
      basis: "Sent time printed on the initiating DEQ email",
      note: "The event uses the initiating review request. The same record preserves subsequent replies through September 20; the PDF provides no reliable embedded creation timestamp.",
    })],
  },
  {
    year: "2018",
    date: "2018-10-03",
    isoDate: "2018-10-03T09:30:00",
    time: "09:30–09:35 · zone not stated",
    timeBasis: "Primary and duplicate sample collection",
    phase: "Source characterization",
    kind: "sampling",
    category: "06 · Lab results",
    title: "Wexford leachate shows a strong PFAS burden",
    finding: <>TestAmerica job J17646-1 reports the October 3 landfill leachate sample at <strong>PFOS 120 ng/L</strong>, <strong>PFOA 590 ng/L</strong>, <strong>PFHxS 610 ng/L</strong>, <strong>PFBS 950 ng/L</strong>, <strong>PFHxA 2,100 ng/L</strong>, <strong>PFPeA 610 ng/L</strong> and <strong>PFPeS 160 ng/L</strong>. The package also includes a duplicate leachate sample plus equipment, field and method blanks.</>,
    significance: "Provides the upstream profile for comparison with WWTP effluent and receptor-water results. The duplicate reports the same general PFAS pattern, while the equipment, field and method blanks report the listed compounds below their respective reporting limits. These source results do not by themselves establish passage through the WWTP.",
    sources: [pdf("J17646-1 UDS Level 2 Report Final Report (Leachate).pdf", "2018-10-03-j17646-leachate", 23, "Full TestAmerica analytical package for leachate collected October 3, 2018, including primary and duplicate leachate samples plus equipment, field and method blanks.", {
      eventStamp: "2018-10-03 09:30–09:35 · zone not stated",
      basis: "Laboratory sample collection records",
      created: "2018-10-29 06:51:04 CDT",
      modified: "2018-10-29 06:51:04 CDT",
      note: "The event uses collection time; embedded metadata dates the later final report file.",
    })],
  },
  {
    year: "2018",
    date: "2018-10-29",
    isoDate: "2018-10-29T09:51:00",
    time: "09:51–09:56 · zone not stated",
    timeBasis: "City laboratory and Utilities Director email sent times",
    phase: "PFAS result response",
    kind: "operation",
    category: "04 / 06 / 09 · PFAS monitoring, lab & correspondence",
    title: "City identifies PFOS exceedance and ability to stop trucked leachate",
    finding: <>At 09:51, Cadillac laboratory supervisor Cindy Tomaszewski told Utilities Director Jeff Dietlin that the TestAmerica leachate results exceeded the applicable PFOS water-quality standard of 12 ng/L. At 09:56, Dietlin asked DEQ whether the City should test its effluent to see whether PFAS was “making it through the plant.” He wrote: <strong>“Since this leachate is a trucked in source we could stop it at any time.”</strong></>,
    significance: "Documents the City's contemporaneous knowledge of the PFOS exceedance, its concern about passage through the WWTP and Dietlin's stated operational ability to stop the trucked source. The email does not establish that Cadillac actually stopped accepting the leachate on October 29, answer whether PFAS passed through the plant or provide the final delivery date.",
    sources: [archivedSource("2018-10-29 - City PFOS Exceedance Email and TestAmerica Leachate Package.pdf", "/lab-docs/042-17dfcc25e8a0.pdf", 42, "Complete City email chain with the 23-page TestAmerica leachate report and 15-page DEQ IPP PFAS screening guidance.", {
      eventStamp: "2018-10-29 09:51–09:56 · zone not stated",
      basis: "Sent times printed on the City laboratory and Utilities Director emails",
      created: "2022-06-24 05:19:14 EDT (archive export)",
      modified: "2022-06-24 05:19:14 EDT (archive export)",
      note: "The PDF timestamp reflects the later archive export. Dietlin's statement describes an ability to stop the trucked source, not proof that acceptance stopped on that date.",
    })],
  },
  {
    year: "2018",
    date: "2018-11-01",
    isoDate: "2018-11-01T15:06:00",
    time: "15:06 · zone not stated",
    timeBasis: "DEQ email sent time",
    phase: "Probable-source sampling direction",
    kind: "regulatory",
    category: "04 / 09 · PFAS monitoring & correspondence",
    title: "DEQ directs Avon PFAS sampling and landfill follow-up",
    finding: "DEQ states that Avon Automotive should be sampled as a probable source based on the reviewed Dyneon information, asks Cadillac for the sampling schedule and seeks clarification about Rec Boat process wastewater. The same exchange records continued landfill evaluation; Cadillac's inline response says bottles were ordered and reports that the landfill had not yet provided a treatment plan.",
    significance: "Provides the agency's dated rationale and requested next steps between the leachate result and the November sampling and summary-report records.",
    sources: [archivedSource("2018-11-01 - Avon PFAS Sampling Direction and Landfill Follow-Up.pdf", "https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/623d9abbdd9aa2dd388da68e3e95c23e59c31387/public/correspondence-docs/corr-042-c73c0b45e14a.pdf", 6, "Six-page City/DEQ thread containing the November 1 sampling direction, schedule request and contemporaneous inline response.", {
      eventStamp: "2018-11-01 15:06 · zone not stated",
      basis: "Sent time printed on the DEQ direction email",
      note: "The event uses the agency's 15:06 message. Cadillac's inline reply is timestamped 15:27:23; the PDF provides no reliable embedded creation timestamp.",
    })],
  },
  {
    year: "2018",
    date: "2018-11-05",
    isoDate: "2018-11-05T13:15:00",
    time: "13:15 · zone not stated",
    timeBasis: "Effluent and duplicate collection",
    phase: "Pathway characterization",
    kind: "sampling",
    category: "06 · Lab results",
    title: "PFAS measured in Cadillac WWTP effluent",
    finding: "J17993-1 documents the WWTP effluent panel. The later DEQ approval letter records PFOS at 6.5 ng/L; the laboratory package reports PFOA near 20 ng/L.",
    significance: "Documents an effluent signature during the landfill-leachate receiving period.",
    sources: [pdf("J17993-1 UDS Level 2 Report Final Report.pdf", "2018-11-05-j17993-effluent", 21, "Full TestAmerica package for Cadillac WWTP effluent collected November 5, 2018.", {
      eventStamp: "2018-11-05 13:15 · zone not stated",
      basis: "Laboratory sample collection record",
      created: "2018-12-10 17:34:34 CST",
      modified: "2018-12-10 17:34:34 CST",
      note: "The event uses collection time; the report itself states a November 29, 2018 16:22 report time and was later packaged as a PDF.",
    })],
  },
  {
    year: "2018",
    date: "2018-11-07",
    isoDate: "2018-11-07T11:15:00-05:00",
    time: "11:15 EST · Avon Auto; 11:25 EST · Avon 5th Street",
    timeBasis: "Sample collection records; duplicate time not recorded",
    phase: "Industrial-source investigation",
    kind: "sampling",
    category: "06 / 08 · Lab results & industrial pretreatment",
    title: "Avon sampling reports PFAS detections with blank and QC qualifications",
    finding: "Job 190-18036-1 reports Avon Auto PFBS 660, PFOS 7.1, PFBA 17, PFDS 16, 6:2 FTS 14 and estimated PFOA 0.94 J ng/L. Avon 5th Street reports PFOS 1.8 and 6:2 FTS 4.3 ng/L. The field blank contains PFOS 1.4 J and 6:2 FTS 3.5 ng/L, complicating interpretation of low detections. Avon Auto also has matrix interference, raised reporting limits and injection/extraction-standard QC exceptions. The sample labeled Avon Duplic. is nondetect for all listed analytes; its paired location and collection time are not identified.",
    significance: "Documents testing in the Avon source investigation, not a determination of Avon's share of WWTP PFAS or evidence excluding Wexford. J denotes an estimated result; nondetect is not zero. The collection event is distinct from Lancaster's November 29 report and TestAmerica's December 10 release. Custody records concern laboratory sample transport, not leachate hauling.",
    sources: [archivedSource("J18036-1 UDS Level 2 Report Final Report.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/3553feaa71173065084148263f8911dfa61f174d/public/ipp-docs/044-c1b8c7e5c6e0.pdf", 22, "Complete Avon report: results pp. 7–11, quality control pp. 12–14 and custody/receipt records pp. 15–16 and 20–22.", {
      eventStamp: "2018-11-07 11:15 / 11:25 Eastern",
      basis: "Collection times printed in the sample and custody records",
      note: "The duplicate time is blank on custody records; the summary's 00:00 is not verified midnight sampling. Final release: December 10, 2018 at 18:26:09, zone not stated.",
    })],
  },
  {
    year: "2018",
    date: "2018-11-29",
    isoDate: "2018-11-29T10:11:30-05:00",
    time: "10:11:30 EST",
    timeBasis: "MiWaters submission history",
    phase: "Summary reporting",
    kind: "regulatory",
    category: "11 · Form submission",
    title: "Summary submission connects the leachate report to the source review",
    finding: "Cadillac's submitted form says Wexford County Landfill sampling was completed by the POTW, attaches the J17646-1 leachate report and the updated monitoring plan, and records Avon sampling as pending. In the corrective-action table, the municipal submission states that no landfill action had been taken and comments that the landfill refused to invest in cleanup.",
    significance: "Preserves the City's contemporaneous account and links the laboratory and monitoring records to the formal portal submission without treating that account as an independent agency finding.",
    sources: [archivedSource("HNJ-P0ZX-8AVDS V1 - IPP PFAS Summary Report.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/49922c706588f236e1edbad5fa8996e4c249e330/public/form-submission-docs/form-submission-030-7cac269c4207.pdf", 2, "Born-digital MiWaters summary submission preserved in place of a page-identical scan derivative.", {
      eventStamp: "2018-11-29 10:11:30 EST",
      basis: "MiWaters submission-history entry",
      created: "2018-11-29 10:11:32 EST",
      modified: "2018-11-29 10:11:32 EST",
      note: "The born-digital file reproduces the same submission and page sequence as the removed scan derivative while restoring searchable source text.",
    })],
  },
  {
    year: "2018",
    date: "2018-11-30",
    isoDate: "2018-11-30",
    time: noTime,
    timeBasis: "Updated monitoring-record date",
    phase: "Source-screen update",
    kind: "regulatory",
    category: "04 · PFAS monitoring",
    title: "Updated monitoring record lists Wexford County Landfill",
    finding: "The updated IPP screening record includes Wexford County Landfill in the facility list used during the PFAS investigation.",
    significance: "Ties the sampled leachate source into the formal monitoring record.",
    sources: [pdf("2018 IPP Screening - Monitoring Plan.Update181130.pdf", "2018-11-30-monitoring-plan-update", 2, "Updated two-page source-screening record.", {
      eventStamp: "2018-11-30 · time not stated",
      basis: "Update date carried in filename/record",
      created: "2018-11-28 11:03:14 CST",
      modified: "2018-11-28 11:03:14 CST",
      note: "Embedded file generation precedes the stated update date; the two clocks remain separate.",
    })],
  },
  {
    year: "2018",
    date: "2018-12-31",
    isoDate: "2018-12-31",
    time: noTime,
    timeBasis: "Audited fiscal-year end",
    phase: "Landfill remediation accounting",
    kind: "regulatory",
    category: "12 · Landfill & leachate",
    title: "County audit carries the landfill groundwater-remediation obligation",
    finding: "Wexford County's audited financial statements say the 2011 landfill purchaser did not assume the County's groundwater-contamination cleanup duty. The audit describes a 2007 MDEQ agreement requiring 30 years of remedial action and operation and maintenance, reports an $819,916 liability, and identifies restricted investments reserved for that obligation.",
    significance: "Confirms that the County retained a funded, long-term groundwater-remediation responsibility after the landfill sale. It is financial and governance evidence, not PFAS sampling data or proof of a contaminant source.",
    sources: [{
      ...archivedSource("Wexford County Audited Financial Statements — Year Ended December 31, 2018.pdf", "https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/b34a99be7592d7423df0db300f0bd3b100ee3d0e/public/findings-docs/133-b131111d7828.pdf", 112, "Note 9 on PDF page 65 describes the 2007 MDEQ agreement, 30-year remedial-action and operation-and-maintenance period, $819,916 liability, and restricted investments.", {
        eventStamp: "Fiscal year ended 2018-12-31 · time not stated",
        basis: "Audited-report fiscal period",
        note: "The liability documents a groundwater-remediation obligation. It does not identify PFAS, quantify leachate treatment or attribute a PFAS source.",
      }),
      page: 65,
    }],
  },
  {
    year: "2019",
    date: "2019-03-04",
    isoDate: "2019-03-04",
    time: noTime,
    timeBasis: "Agency-letter date",
    phase: "Agency determination",
    kind: "regulatory",
    category: "08 · Compliance",
    title: "DEQ approves reports and acknowledges a confirmed source",
    finding: "DEQ states Cadillac accepted wastewater from one facility discharging PFOS above 12 ng/L, approves the reports and calls for work with the confirmed source to reduce PFOS in discharge and biosolids.",
    significance: "Moves the record from screening to confirmed-source reduction work.",
    sources: [pdf("Cadillac WWTP PFAS Interim and Summary Rpt Approval Letter.pdf", "2019-03-04-report-approval", 3, "DEQ approval letter acknowledging a confirmed source and continuing controls.", {
      eventStamp: "2019-03-04 · time not stated",
      basis: "Agency-letter date",
      created: "2019-03-04 08:40:24 CST",
      modified: "2019-03-05 09:53:28 CST",
      note: "Embedded metadata is shown as document history; no issuance time appears in the letter text.",
    })],
  },
  {
    year: "2019",
    date: "2019-03-20",
    isoDate: "2019-03-20T14:55:06-04:00",
    time: "14:55:06 EDT",
    timeBasis: "MiWaters submission history",
    phase: "Annual pretreatment reporting",
    kind: "regulatory",
    category: "11 · Form submission",
    title: "Cadillac certifies its 2018 IPP annual report",
    finding: "Cadillac's certified MiWaters report answers no to local-limit adoption, evaluation or pollutant-list changes and reports no pass-through, interference, NPDES-limit or biosolids-use problems during calendar year 2018. It lists the SIU/CIU list, oversight table, proof of publication and annual pollutant monitoring summary as uploaded attachments.",
    significance: "Preserves the City's contemporaneous certified answers and attachment inventory. The two-page form is a municipal self-report, not an independent agency finding, and its listed attachments must be reviewed separately.",
    sources: [archivedSource("2019-03-20 - IPP annual report - Submission HNN-0QFE-AG22Q v1.pdf", "/form-submission-docs/form-submission-033-bffd8eec3c32.pdf", 2, "Certified MiWaters annual IPP report covering January 1 through December 31, 2018.", {
      eventStamp: "2019-03-20 14:55:06 EDT",
      basis: "MiWaters submission-history entry",
      created: "2019-03-20 14:55:08 EDT",
      modified: "2019-03-20 14:55:08 EDT",
      note: "The status history records submission two seconds before the copy-of-record signature and PDF creation time. The form's answers are preserved as the City's certified report and are not treated as independent verification that no unreported problem occurred.",
    })],
  },
  {
    year: "2019",
    date: "2019-06-04",
    isoDate: "2019-06-04T13:15:00-04:00",
    time: "13:15–13:17 EDT",
    timeBasis: "Primary and duplicate sample collection",
    phase: "Follow-up sampling",
    kind: "sampling",
    category: "06 · Lab results",
    title: "June 2019 effluent PFAS: primary and duplicate results",
    finding: "Primary Effluent 190-19915-1 / 1074244, collected June 4, 2019 at 13:15 EDT: PFOS 7.8 ng/L and PFOA 16 ng/L (PDF p8). Effluent Duplicate 190-19915-2 / 1074245 at 13:17 EDT: PFOS 7.1 ng/L and PFOA 15 ng/L (p9). The June 28 City status form’s 7.1/15 values match the duplicate; the statewide Table 3 values of 7.8/16 match the primary. These are two samples in one sampling event, not conflicting versions of a single sample.",
    significance: "Equipment and field blanks (pp10–11) and method blank (p12) report nondetections, not zero. The package discloses an opening-CCV d5-NEtFOSAA recovery exception and high labeled fluorotelomer extraction-standard recoveries attributed to sample matrix (pp8–14); PFOS/PFOA results have no result qualifier. No influent, landfill leachate, biosolids or groundwater sample is included. This does not establish treatment-removal efficiency, source causation or a final leachate delivery date. Custody shipping details concern laboratory samples, not leachate loads into the WWTP.",
    sources: [pdf("J19915-1 UDS Level 2 Report Final Report.pdf", "2019-06-04-j19915-effluent", 22, "Existing 22-page copy of the same laboratory report, including the complete receipt-log page 16; not a second sampling event.", {
      eventStamp: "2019-06-04 13:15–13:17 EDT",
      basis: "Laboratory sample collection records",
      created: "2019-06-25 15:57:38 EDT",
      modified: "2026-05-01 08:31:07 EDT",
      note: "The subcontract custody form (p15) identifies collection times as Eastern. The Lancaster report is dated June 21; the TestAmerica cover authorizes release June 25, 2019. This rendition has a later May 1, 2026 PDF modification timestamp, not a new sampling or laboratory-release date. Collection, reporting, release and file modification are distinct from delivery timestamps.",
    }), archivedSource("ORIGINAL-J19915-1 UDS Level 2 Report Final Report.pdf", "/lab-docs/091-c2427c56e094.pdf", 22, "Exact uploaded rendition; primary results p8, duplicate p9, QC pp10–14 and custody pp15–16, 21–22. Page16 is clipped; use the accompanying complete receipt-log copy for that page. Same report, not independent corroboration.", {
      eventStamp: "2019-06-04 13:15–13:17 EDT",
      basis: "Sample collection; Eastern stated on subcontract custody form p15",
      created: "2019-06-25 15:57:38 EDT",
      modified: "2019-06-25 15:57:38 EDT",
      note: "TestAmerica job 190-19915-1 released June 25, 2019; Lancaster report dated June 21. Uploaded original preserved unchanged.",
    })],
  },
  {
    year: "2019",
    date: "2019-06-28",
    isoDate: "2019-06-28T15:46:11-04:00",
    time: "15:46:11 EDT",
    timeBasis: "MiWaters submission history",
    phase: "Source confirmation",
    kind: "regulatory",
    category: "11 · Form submission",
    title: "Submitted report: landfill source status “PFOS eliminated” through deep-well injection",
    finding: "Cadillac’s submitted MiWaters form identifies Wexford County Landfill as its source and states that the landfill had gone to deep-well injection and told the City it would no longer bring leachate. The form’s June 4 PFOS 7.1 ng/L and PFOA 15 ng/L match J19915-1’s Effluent Duplicate, not its primary sample (7.8/16). The written cessation/transition report is held; June28 is the submission date, not a stated final-truckload date.",
    significance: "Page 2 names Wexford County Landfill as the confirmed source, lists “Other: Deep Well injection” as the reduction method and reports “PFOS eliminated” as the source status. These are the City’s submitted statements, not a laboratory finding that all PFOS was eliminated from the WWTP. Page 1 still reports effluent PFOS of 7.1 ng/L. Page 3 records Jeffrey Dietlin changing the report from Draft at 15:19:42 to Submitted at 15:46:11 EDT on June 28, 2019; the report is not merely an unsubmitted draft, and no separate agency-approval status is shown. The State of Michigan system Copy Of Record signature follows at 15:46:12 EDT; certificate trust was not independently validated. Review complete for this submission; the written source-status and cessation statement is held. Exact final-load date/time, carrier and gallons remain unresolved. The source-status field does not prove PFAS destruction.",
    sources: [pdf("HNQ-VZP8-TWNRX V1.pdf", "2019-06-28-source-status", 3, "Pages1–2 contain the City’s source and cessation/transition report; p1 has the system digital signature and p3 the submission history. These dates do not identify the final load.", {
      eventStamp: "2019-06-28 15:46:11 EDT",
      basis: "MiWaters submission-history entry",
      created: "2019-06-28 15:46:12 EDT",
      modified: "2019-06-28 15:46:12 EDT",
      note: "The nForm_nCore_MiWaters_Cert system Copy Of Record signature follows the submission-history entry by one second. Signature-field presence was checked; certificate trust was not independently validated. Neither timestamp states the final delivery date.",
    })],
  },
  {
    year: "2019",
    date: "2019-12-03",
    isoDate: "2019-12-03",
    time: noTime,
    timeBasis: "Agency-letter date",
    phase: "Statewide program status",
    kind: "regulatory",
    category: "04 · PFAS monitoring",
    title: "EGLE summarizes statewide IPP PFAS progress",
    finding: "EGLE's status letter reports substantial statewide source-identification and reduction progress, identifies landfills among significant PFOS sources to wastewater plants and describes continued monitoring and source-control expectations.",
    significance: "Provides statewide program context for Cadillac's later site-specific status report without treating statewide observations as measurements from Cadillac.",
    sources: [pdf("Cadillac WWTP MI0020257 IPP PFAS Dec 2019 Status.pdf", "2019-12-pfas-status", 5, "Five-page EGLE status and continued-efforts letter sent to Cadillac's IPP representative.", {
      eventStamp: "2019-12-03 · time not stated",
      basis: "Agency-letter date",
      created: "2019-12-03 13:44:30 CST",
      modified: "2019-12-04 14:58:08 CST",
      note: "The printed letter date controls the event; embedded scan timestamps describe later file production.",
    })],
  },
  {
    year: "2019",
    date: "2019-12-18",
    isoDate: "2019-12-18T13:59:04-05:00",
    time: "13:59:04 EST",
    timeBasis: "MiWaters submission history",
    phase: "Post-cessation status",
    kind: "regulatory",
    category: "11 · Form submission",
    title: "Cadillac reports that it no longer accepts Wexford leachate",
    finding: <>The certified MiWaters report again identifies Wexford County Landfill as Cadillac&apos;s confirmed PFOS source, states that Cadillac was no longer accepting its leachate and records deep-well injection as the reduction method. It lists October 22 WWTP effluent results of <strong>PFOS 2.4 ng/L</strong> and <strong>PFOA 3.4 ng/L</strong> at 1.98 MGD.</>,
    significance: "Corroborates cessation and continued effluent monitoring after the June source-confirmation report. It does not provide the date, volume or manifest for the final leachate delivery.",
    sources: [archivedSource("2019-12-18 - IPP PFAS status report - Submission HNV-XK97-EV0GR v1.pdf", "/form-submission-docs/form-submission-036-1873afe1dd72.pdf", 3, "Certified MiWaters status report preserving the cessation statement, deep-well-injection status and October 22 effluent results.", {
      eventStamp: "2019-12-18 13:59:04 EST",
      basis: "MiWaters submission-history entry",
      created: "2019-12-18 13:59:16 EST",
      modified: "2019-12-18 13:59:16 EST",
      note: "The portal history records submission twelve seconds before the digitally certified PDF was generated.",
    })],
  },
  {
    year: "2020",
    date: "2020-10-22",
    isoDate: "2020-10-22T15:41:19-04:00",
    time: "15:41:19 EDT",
    timeBasis: "Digital signature timestamp",
    phase: "Compliance control",
    kind: "compliance",
    category: "08 · Compliance",
    title: "VN-011108 identifies systemic AAR permit and enforcement deficiencies",
    finding: "After reviewing Cadillac's AAR Rinse Tank file, EGLE identified deficiencies involving legal authority, applicable categorical and local limits, sampling locations, self-monitoring, discharge notification, overdue flow reporting that constituted significant noncompliance, approved analytical methods, representative composite sampling and enforcement of monitoring requirements.",
    significance: "Documents weaknesses in Cadillac's industrial-pretreatment controls and required a written response with a revised AAR permit by November 30, 2020. It does not independently prove contaminant pass-through or groundwater migration.",
    sources: [archivedSource("2020-10-22 VN-011108 Cadillac WWTP.pdf", "/compliance-docs/008-5fff30df4912.pdf", 5, "Digitally signed EGLE IPP Reconnaissance Evaluation and Violation Notice VN-011108.", {
      eventStamp: "2020-10-22 15:41:19 EDT",
      basis: "Digital signature timestamp printed on page 5",
      created: "2020-10-22 15:40:46 EDT",
      modified: "2020-10-22 15:41:21 EDT",
      note: "The signature time supplies the event time; embedded metadata records PDF creation and final modification around that signature.",
    })],
  },
  {
    year: "2021",
    date: "2021-09-30",
    isoDate: "2021-09-30T12:25:07-04:00",
    time: "12:25:07 EDT",
    timeBasis: "Digital signature timestamp",
    phase: "Pretreatment enforcement",
    kind: "compliance",
    category: "08 · Compliance",
    title: "VN-012230 finds Cadillac failed to enforce industrial-user compliance",
    finding: "EGLE found that Cadillac had not implemented its approved Enforcement Response Plan after correctly determining that Cadillac Casting was in significant noncompliance. The notice also identifies missed cadmium resampling, inadequate process, flow and production records, a deficient industrial-user permit, copper violations requiring local-limit review and potentially insufficient pretreatment staffing or training.",
    significance: "Establishes continuing program-control failures after VN-011108 and requires a corrective-action plan, revised permits, a categorical determination, a technically based local-limits evaluation and a staffing or training plan by November 30, 2021.",
    sources: [archivedSource("2021-09-30 VN-012230 Cadillac WWTP.pdf", "/compliance-docs/010-96bc79c5922b.pdf", 7, "Digitally signed EGLE pretreatment compliance inspection and Violation Notice VN-012230.", {
      eventStamp: "2021-09-30 12:25:07 EDT",
      basis: "Digital signature timestamp printed on page 7",
      created: "2021-09-30 12:24:27 EDT",
      modified: "2021-09-30 12:25:08 EDT",
      note: "The signature time supplies the event time; embedded modification follows one second later.",
    })],
  },
  {
    year: "2022",
    date: "2022-05-23",
    isoDate: "2022-05-23",
    time: noTime,
    timeBasis: "Letter date",
    phase: "Pretreatment corrective action",
    kind: "compliance",
    category: "04 · Industrial pretreatment",
    title: "EGLE responds to Cadillac's IPP corrective-action plan",
    finding: "EGLE accepted the revised MAHL study plan with recommendations, extended the remaining categorical-determination response to November 4, 2022, and noted that Wexford County Landfill had ceased discharge to Cadillac and should be removed from the sampling plan if that status remained true.",
    significance: "Connects the violation-notice response, MAHL/local-limit work, Cadillac Casting categorical review and Wexford discharge status in one agency record.",
    sources: [ippSource("2022-05-23 Follow-up to VN-012230 and VN-011108 - Cadillac WWTP.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/3553feaa71173065084148263f8911dfa61f174d/public/ipp-docs/083-df40de58ffcc.pdf", 3, "EGLE follow-up letter addressing the CAP, MAHL study plan, CCI categorical review and Wexford sampling status.", {
      eventStamp: "2022-05-23 · time not stated",
      basis: "Letter date printed in source",
      note: "No time of day is stated in the letter.",
    })],
  },
  {
    year: "2023",
    date: "2023-04-27",
    isoDate: "2023-04-27T09:35:27-04:00",
    time: "09:35:27 EDT",
    timeBasis: "Digital signature timestamp",
    phase: "Continuing pretreatment enforcement",
    kind: "compliance",
    category: "08 · Compliance",
    title: "SVN-01351 says Cadillac's pretreatment violations continued",
    finding: "EGLE's second notice states that Cadillac had not returned to compliance after VN-012230. Cadillac's 2022 annual report identified AAR Mobility Systems, Cadillac Casting and Rec Boats Holding in significant noncompliance for reporting or pretreatment standards, but showed that Cadillac issued no enforceable orders required by its approved Enforcement Response Plan.",
    significance: "Documents that the enforcement-response deficiency persisted into the 2022 reporting year and required return-to-compliance evidence or appropriate enforcement documentation by June 1, 2023. It does not establish PFAS occurrence or a source-to-receptor pathway.",
    sources: [archivedSource("2023-04-27 SVN-01351 Cadillac WWTP.pdf", "/compliance-docs/011-afac7f09906b.pdf", 3, "Digitally signed EGLE Second Violation Notice SVN-01351 documenting continuing pretreatment enforcement failures.", {
      eventStamp: "2023-04-27 09:35:27 EDT",
      basis: "Digital signature timestamp printed on page 3",
      created: "2023-04-27 09:30:58 EDT",
      modified: "2023-04-27 09:35:29 EDT",
      note: "The signature time supplies the event time; embedded modification follows two seconds later.",
    })],
  },
  {
    year: "2023",
    date: "2023-08",
    isoDate: "2023-08",
    time: noTime,
    timeBasis: "Month printed in source filename and letter",
    phase: "Local-limits submission",
    kind: "regulatory",
    category: "04 · Industrial pretreatment",
    title: "Cadillac submits proposed MAHLs and local limits",
    finding: "The City asked EGLE to review and approve proposed maximum allowable headworks loadings and industrial local limits and included a table of proposed limits and compatible-pollutant MAHLs.",
    significance: "Establishes the proposal stage that precedes the later EGLE review comments; it is not represented as final approval.",
    sources: [ippSource("2023-08 City of Cadillac proposed MAHL and local limits.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/3553feaa71173065084148263f8911dfa61f174d/public/ipp-docs/100-20ef2ece7370.pdf", 2, "City transmittal requesting review and approval of proposed MAHLs and local limits.", {
      eventStamp: "2023-08 · time not stated",
      basis: "Month printed in source filename and letter",
      note: "The available source establishes the month but not a reliable day or time.",
    })],
  },
  {
    year: "2023",
    date: "2023-09-29",
    isoDate: "2023-09-29T11:53:59-04:00",
    time: "11:53:59 EDT",
    timeBasis: "Inspection-transmittal email timestamp",
    phase: "Compliance sampling inspection",
    kind: "compliance",
    category: "08 · Compliance",
    title: "EGLE transmits the July 2023 compliance sampling findings",
    finding: "The inspection spot-check records phosphorus and ammonia DMR values that did not match the underlying site records and describes them as apparent data-entry mistakes. It also records follow-up work for DMR-QA 42 results, laboratory procedures, flow-meter calibration and analytical methods.",
    significance: "Provides direct inspection evidence about monitoring-data quality and corrective follow-up. The transmittal package is retained with the standalone inspection form because it adds 13 pages of correspondence and final sampling material.",
    sources: [
      archivedSource("07-10-2023 - Cadillac WWTP WRD CSI Inspection Form.pdf", "/compliance-docs/053-366393f7752d.pdf", 16, "Standalone EGLE facility site-review and laboratory inspection form for the July 10, 2023 CSI.", {
        eventStamp: "2023-07-10 13:00 EDT",
        basis: "Inspection date and time printed on the form",
        created: "2023-09-29 11:31:24 EDT",
        modified: "2023-09-29 11:32:47 EDT",
        note: "The PDF timestamps record later preparation of the inspection form, not the inspection time.",
      }),
      archivedSource("09-29-2023 - Cadillac WWTP July 2023 Inspection Transmittal and Sampling Report.pdf", "/compliance-docs/054-f9bc1e000199.pdf", 29, "Formal EGLE email package containing the inspection form and additional final sampling-report material.", {
        eventStamp: "2023-09-29 11:53:59 EDT",
        basis: "Email sent timestamp printed on page 1",
        created: "2023-09-29 12:13:45 EDT",
        modified: "2023-09-29 12:13:45 EDT",
        note: "The file-production timestamp follows the transmittal email by about 20 minutes.",
      }),
    ],
  },
  {
    year: "2024",
    date: "2024-01-22",
    isoDate: "2024-01-22T10:08:23-05:00",
    time: "10:08:23 EST",
    timeBasis: "Digital signature timestamp",
    phase: "Corrective-action review",
    kind: "compliance",
    category: "08 · Compliance",
    title: "EGLE requires further revision after VN-012230",
    finding: "The follow-up requires revised MAHL/local limits, Sewer Use Ordinance, procedures manual, Enforcement Response Plan and template documents.",
    significance: "Extends the institutional-control chronology without substituting for pathway evidence.",
    sources: [pdf("2024-01-22 Follow-up to VN-012230 IPP Procedures Manual Mod - City of Cadillac.pdf", "2024-01-22-vn-012230-followup", 466, "EGLE follow-up package requiring further pretreatment-control revisions.", {
      eventStamp: "2024-01-22 10:08:23 EST",
      basis: "Digital signature timestamp printed in source",
      created: "2024-01-22 08:30:26 CST",
      modified: "2024-01-22 09:08:25 CST",
      note: "The printed signature time and embedded modification time represent the same instant in adjacent U.S. time zones.",
    })],
  },
  {
    year: "2024",
    date: "2024-11-18",
    isoDate: "2024-11-18",
    time: "08:04 and 09:25 · zone not stated",
    timeBasis: "Collection date and times printed on the chain-of-custody record",
    phase: "UCMR5 drinking-water sampling",
    kind: "sampling",
    category: "04 / 06 · PFAS monitoring & lab results",
    title: "UCMR5 sampling reports no PFAS detections at two city water-system taps",
    finding: "Pace reported the Crosby Wellfield Service Building and 44 Road Water Service Building primary samples with U qualifiers—analyzed but not detected—across the PFAS analytes listed under EPA 533 and EPA 537.1. The report includes analytical and quality-control pages, qualifier definitions, sample-receipt records and a chain of custody listing the two primary samples and two field reagent blanks.",
    significance: "Adds a documented municipal drinking-water monitoring point at two City water-system facilities. It is not Cadillac WWTP influent, effluent or sludge data; it is not a Plett Road receptor sample; and it does not close the remaining treatment-history, hydrogeology or source-to-receptor evidence requests.",
    sources: [archivedSource("Pace UCMR5 Plant-Tap PFAS Report — Crosby and 44 Road.pdf", "/pfas-docs/100-cea8f3321719.pdf", 19, "Pace Project 35919999; sample summary, EPA 533 and EPA 537.1 result pages, QC data, qualifier definitions and chain-of-custody/sample-receipt records.", {
      eventStamp: "2024-11-18 · 08:04 and 09:25; time zone not stated",
      basis: "Collection date and times printed on the chain-of-custody record",
      created: "2024-12-19 10:40:55 EST",
      modified: "2026-08-12 13:58:56 EDT",
      note: "The analytical pages report the two primary drinking-water samples. Two field reagent blank samples are listed in the sample summary and chain of custody; the record is not represented as a WWTP or Plett Road sampling package.",
    })],
  },
  {
    year: "2024",
    date: "2024-11-19",
    isoDate: "2024-11-19",
    time: noTime,
    timeBasis: "Operating-license issue date",
    phase: "Solid-waste operating license",
    kind: "regulatory",
    category: "12 · Landfill & leachate",
    title: "Operating License 9758 renews the landfill authorization",
    finding: "EGLE issued License 9758 for the 196.4-acre Wexford County Landfill through November 19, 2029. The license incorporates Construction Permits 4100 and 4127, the March 2018 hydrogeologic monitoring plan, the leachate recirculation plan and later lagoon, cover and engineering documents.",
    significance: "Provides the current official operating framework and identifies the historical plans incorporated by reference; it does not by itself prove the contents of those separately listed plans.",
    sources: [pdf("Wexford-County-Landfill.PDF · Operating License 9758", "2024-11-19-operating-license-9758", 8, "Official operating license and Attachment A site map.", {
      eventStamp: "2024-11-19 · time not stated",
      basis: "Issue date printed on license page 1",
      note: "This is distinct from the three-page 2012 Construction Permit 4127 despite the shared base filename.",
    }, "https://github.com/cazey43/cadillac-pfas-event-trace/blob/1f44c9e90e718f6e130bdfc319be48098d2163e5/public/wexford-docs/017-4b475079a927.pdf")],
  },
  {
    year: "2025",
    date: "2025-02-21",
    isoDate: "2025-02-21",
    time: noTime,
    timeBasis: "Report date on February address-round table, PDF page 7",
    phase: "AOI and LDFA analytical compilation",
    kind: "sampling",
    category: "04 / 06 / 13 · PFAS monitoring, lab results & wells",
    title: "EGLE compiles multi-round Cadillac-area PFAS results",
    finding: "The 26-page compilation preserves EGLE Cadillac Industrial Park address tables for samples collected October 30, November 20 and December 18-19, 2024 and February 7, 2025. It also includes Plant Effluent, I-5 influent/effluent and S- and I-series LDFA investigation samples. Field blanks are named in notes, not supplied as a complete blank-results/QC package. LDFA entries are not established main sewage-WWTP samples.",
    significance: "Adds a consolidated analytical bridge between the area-of-interest and LDFA monitoring records. Because the addresses are anonymized and the source lacks a coordinate-to-sample crosswalk, chain-of-custody package and synchronized source-to-receptor transect, it does not identify which address is Plett Road, close an evidence request or prove a migration pathway.",
    sources: [archivedSource("EGLE - Complete Results.pdf", "/pfas-docs/082-18e25560cde6.pdf", 26, "Complete fixed-layout EGLE results compilation covering address rounds and LDFA special-investigation samples.", {
      eventStamp: "2025-02-21 · time not stated",
      basis: "Report date on February address-round table, PDF page 7",
      created: "2025-03-19 11:59:18 EDT",
      modified: "2025-03-19 11:59:42 EDT",
      note: "Page 7 prints Report Date 2/21/2025 16:55 (timezone unspecified); the event follows that address-round report date, not PDF production. Pages 25–26 print November 27, 2025 analysis dates for three November 18, 2024 samples where pages 23–24 print November 27, 2024. The unresolved analysis-year conflict is preserved.",
    })],
  },
  {
    year: "2025",
    date: "2025-03-07",
    isoDate: "2025-03-07",
    time: "09:30 · timezone unspecified",
    timeBasis: "Sampling Date printed in the report; original filename differs",
    phase: "Receptor discovery",
    kind: "receptor",
    category: "13 · Groundwater & wells",
    title: "PFAS detected at 1140 Plett Road",
    finding: "The owner-commissioned Cyclopure result documents a multi-compound pattern in warehouse well water, including PFOA, PFOS, PFHxS and PFBS.",
    significance: "Creates the receptor-side result for comparison with source and pathway records.",
    sources: [pdf("TEST #1 - 3-4-2025 CYCLOPURE - SELF TESTING.pdf", "2025-03-cyclopure-property", 3, "Cyclopure kit WTK_PFAS_16874: Sampling Date March 7, 2025 at 09:30 as printed; report dated March 19. Original filename retained despite its March 4 date.", {
      eventStamp: "2025-03-07 · 09:30 · timezone unspecified",
      basis: "Printed Sampling Date, corroborated by the comparability source packet",
      created: "2025-11-08 08:32:41 CST",
      modified: "2025-11-08 08:32:41 CST",
      note: "The embedded timestamp reflects a later scan and is not the sampling time. The original filename says March 4; the report prints March 7, 09:30, with no timezone.",
    })],
  },
  {
    year: "2025",
    date: "2025-03-05",
    isoDate: "2025-03-05T15:15:30-05:00",
    time: "15:15:30 EST",
    timeBasis: "Email sent timestamp",
    phase: "Industrial pretreatment update",
    kind: "regulatory",
    category: "04 · Industrial pretreatment",
    title: "EGLE reviews Cadillac's revised MAHL and local limits",
    finding: "EGLE's review email says the January 2025 MAHL revision still contains inconsistencies and typographical errors, including proposed limits that require clarification before approval can move forward.",
    significance: "Documents active agency review of Cadillac's industrial local-limit update; it is not evidence of final approval.",
    sources: [{
      name: "2025-03-05__3055689922791814885__Cadillac MAHL.msg.pdf · page 1",
      url: repositoryAssetUrl("/ipp-docs/007-9aecbfcf4abc.pdf"),
      preview: bundledPublicAsset("/source-previews/007-9aecbfcf4abc.jpg"),
      pages: 204,
      page: 1,
      format: "PDF",
      role: "Source page",
      result: "EGLE email transmitting review comments on the revised MAHL/local-limits package.",
      clock: {
        eventStamp: "2025-03-05 15:15:30 EST",
        basis: "Email sent timestamp printed in source",
        created: "2025-03-05 15:20:09 EST",
        modified: "2025-03-05 15:20:09 EST",
        note: "The PDF timestamp is five minutes after the email sent time and is retained as file-production history.",
      },
    }],
  },
  {
    year: "2025",
    date: "2025-03-19",
    isoDate: "2025-03-19",
    time: noTime,
    timeBasis: "Affidavit publication date",
    phase: "Industrial significant noncompliance",
    kind: "compliance",
    category: "04 · Industrial pretreatment",
    title: "Public notice documents 2024 industrial SNC",
    finding: "The affidavit's published notice identifies local-limit exceedances during 2024 at Rec Boats Trailer, AAR Mobility Systems, ARVCO, Cadillac Castings, FIAMM, Hutchinson and Michigan Rubber, with pollutants and quarters stated for each facility.",
    significance: "Preserves the annual SNC record while distinguishing industrial-user permit exceedances from violations by the Cadillac WWTP itself.",
    sources: [ippSource("Cadillac News Affidavit of Publication 03-19-2025.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/3553feaa71173065084148263f8911dfa61f174d/public/ipp-docs/126-724054a11ecd.pdf", 1, "Affidavit and annexed public notice of 2024 industrial significant noncompliance.", {
      eventStamp: "2025-03-19 · time not stated",
      basis: "Affidavit publication date",
      note: "The notice states there were no known Cadillac WWTP violations or known Clam River or Muskegon River watershed impacts from the listed industrial exceedances.",
    })],
  },
  {
    year: "2025",
    date: "2025-05-19",
    isoDate: "2025-05-19T18:00:00-04:00",
    time: "Approximately 6:00 PM EDT",
    timeBasis: "Meeting call-to-order time printed in the minutes",
    phase: "Municipal PFAS response update",
    kind: "sampling",
    category: "13 · Groundwater & wells",
    title: "Council minutes record private-well retesting and PFAS response",
    finding: "Official minutes record the Utilities Director stating that 48 private-well tests had been completed, 32 results had returned, roughly 10 remained pending and seven were being retested after Cyclopure warned of possible sample contamination. The same update attributes to him statements about quarterly biosolids testing, a latest non-detect result, municipal-water monitoring and effluent testing.",
    significance: "Preserves a dated public accounting of the testing workflow, delayed results, resampling and infrastructure planning. These are attributed statements in meeting minutes—not laboratory reports—and the source's test-count figures are retained as stated rather than silently reconciled.",
    sources: [archivedSource("May 19 2025 City Council Meeting Minutes.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/acfdd5bb24b35545948a9b0078262cfacaf85510/public/findings-docs/052-8659ed67102c.pdf", 38, "Pages 2–4 contain the PFAS testing, biosolids, municipal-water and mapping update; page 6 records the 2019 loss of landfill-leachate treatment revenue; pages 12–14 preserve further public and council statements.", {
      eventStamp: "2025-05-19 · approximately 6:00 PM EDT",
      basis: "Meeting date and approximate call-to-order time printed on page 1",
      created: "2025-05-29 12:53:51 EDT",
      modified: "2025-05-29 15:43:06 EDT",
      note: "The PDF timestamps reflect later preparation of the minutes package, not the meeting time. The 38-page file is distinct from the 92-page May 19 council packet despite shared attachments.",
    })],
  },
  {
    year: "2025",
    date: "2025-05-19",
    isoDate: "2025-05-19T10:40:00-04:00",
    time: "10:40 and 10:05 · zone not stated",
    timeBasis: "Collection date and times printed in the sample summary and chain-of-custody record",
    phase: "UCMR5 drinking-water sampling",
    kind: "sampling",
    category: "04 / 06 · PFAS monitoring & lab results",
    title: "Second UCMR5 round reports no PFAS detections at two city water-system taps",
    finding: "Pace reported the Crosby Wellfield Service Building and 44 Road Water Service Building primary samples with U qualifiers—analyzed but not detected—across the PFAS analytes listed under EPA 533 and EPA 537.1. The package also preserves two listed field reagent blanks, laboratory quality-control data, qualifier definitions, chain-of-custody documentation and sample-receipt/preservation records.",
    significance: "Adds a second comparable municipal drinking-water monitoring round at the two City water-system facilities after the November 2024 sampling. It is not wastewater-treatment-process sampling, a Plett Road receptor sample, a Wexford leachate-delivery record or source-to-receptor pathway proof, so the related evidence requests remain open.",
    sources: [archivedSource("Pace UCMR5 Plant-Tap PFAS Report — Crosby and 44 Road — May 2025.pdf", "/pfas-docs/101-8fd975e9aa54.pdf", 19, "Pace Project 35956761; sample summary, EPA 533 and EPA 537.1 result pages, laboratory QC, qualifier definitions, chain of custody and sample-receipt/preservation forms.", {
      eventStamp: "2025-05-19 · 10:40 and 10:05; time zone not stated",
      basis: "Collection date and times printed in the sample summary and chain-of-custody record",
      created: "2025-06-16 17:30:22 EDT",
      modified: "2026-08-12 14:00:04 EDT",
      note: "The analytical pages report the two primary drinking-water samples. Two field reagent blanks are listed in the sample summary and chain of custody; the record is not represented as wastewater-process, Plett Road or migration-pathway evidence.",
    })],
  },
  {
    year: "2025",
    date: "2025-08-19",
    isoDate: "2025-08-19T15:01:02-04:00",
    time: "15:01:02 EDT",
    timeBasis: "Compliance-communication email timestamp",
    phase: "NPDES compliance evaluation",
    kind: "compliance",
    category: "08 · Compliance",
    title: "EGLE identifies sampling-preservation and reporting violations",
    finding: "Following the June 10 CEI, EGLE states that ammonia samples were not being immediately preserved with sulfuric acid as required, the DMR-QA Study 44 submission lacked required forms and signatures, and multiple effluent and schedule-of-compliance violations remained unaddressed in MiEnviro.",
    significance: "Connects the detailed inspection form to the formal compliance communication and required corrective-action plan while keeping analytical, administrative and schedule violations distinct.",
    sources: [
      archivedSource("06-10-2025 - Cadillac WWTP NPDES Compliance Evaluation Inspection Report.pdf", "/compliance-docs/055-b7cfc87f596b.pdf", 16, "EGLE facility site-review, self-monitoring, sampling-procedure and analytical-methodology inspection report.", {
        eventStamp: "2025-06-10 10:00 EDT",
        basis: "Inspection date and time printed on the report",
        created: "2025-07-30 11:19:00 EDT",
        modified: "2025-07-30 11:19:00 EDT",
        note: "The PDF timestamp records later report production, not the inspection time.",
      }),
      archivedSource("08-19-2025 - EGLE Compliance Communication CC-006510.pdf", "/compliance-docs/037-6434f255c127.pdf", 7, "Formal EGLE compliance communication, corrective-action request and violation attachment following the June 10 CEI.", {
        eventStamp: "2025-08-19 15:01:02 EDT",
        basis: "Email sent timestamp printed in the preserved package",
        note: "The attached letter is dated August 19, 2025 and requires a corrective-action response within 60 days.",
      }),
    ],
  },
  {
    year: "2025",
    date: "2025-08-20",
    isoDate: "2025-08-20",
    time: "10:31-11:27 · zone not stated",
    timeBasis: "Call-to-order and adjournment times printed in the minutes",
    phase: "LDFA PFAS sampling planning",
    kind: "regulatory",
    category: "04 / 13 · PFAS monitoring & wells",
    title: "LDFA authorizes PFAS pilot testing and seeks an updated well plan",
    finding: "Approved LDFA minutes record completion of a well survey, a unanimous motion to ask EPA for a new test-well sampling plan, work on PFAS QAPP approval and a 14D sampling plan, and unanimous authorization to spend up to $1,000 for proposed PFAS pilot-study testing. The board also requested MPART expert input on whether air stripping could release PFAS to air.",
    significance: "Documents response planning, board authorization and attributed operational updates. The minutes do not provide the QAPP, sampling plans, chain-of-custody records, analytical results or a site-specific migration analysis, so they do not close an evidence request or prove a pathway.",
    sources: [
      archivedSource("Cadillac LDFA Board Minutes - August 20, 2025.pdf", "/findings-docs/163-c3da045eb140.pdf", 3, "Pages 1-2 record the well survey, EPA sampling-plan motion, PFAS QAPP and 14D planning, pilot-study testing authorization and air-toxicity discussion.", {
        eventStamp: "2025-08-20 10:31-11:27 · zone not stated",
        basis: "Meeting date, call-to-order time and adjournment time printed in the minutes",
        created: "2025-09-18 09:58:31 EDT",
        modified: "2025-09-18 09:58:31 EDT",
        note: "The PDF timestamps reflect later production of the approved minutes, not the meeting time. The record documents decisions and statements, not completed testing or laboratory results.",
      }),
    ],
  },
  {
    year: "2025",
    date: "2025-08-22",
    isoDate: "2025-08-22",
    time: noTime,
    timeBasis: "Release date printed on the news release",
    phase: "City response to EPA review",
    kind: "regulatory",
    category: "04 / 13 / 19 · PFAS monitoring, wells & technical literature",
    title: "City publishes its perspective on EPA's Five-Year Review",
    finding: "In an August 22 news release, the City states that groundwater monitoring was paused after the monitoring contractor died and EPA required new quality-assurance project plans; updated testing was expected to resume in 2025 after QAPP approval. The release says the LDFA agreed to PFAS and 1,4-dioxane testing, arranged interim testing of some monitoring wells and treatment-system influent and effluent, and understood that five of approximately 200 monitoring wells might require repair or replacement.",
    significance: "Preserves the City's contemporaneous account of the monitoring interruption, planned response, PFAS testing, treatment-system operation and water-system extensions. The release also states that possible PFAS discharge from the treatment system was below EGLE surface-water criteria and that City drinking water had never had PFAS detected; those are attributed City statements, not substitutes for EPA's review, approved QAPPs, laboratory packages, well-repair records or an independent source-and-pathway determination.",
    sources: [
      archivedSource("City Perspective Regarding EPA's Five-Year Review.pdf", "/findings-docs/109-804e9a08651c.pdf", 3, "All three pages comprise the August 22, 2025 City news release; pages 1-2 state the City's position on cleanup history, the monitoring interruption, planned QAPP-governed testing, PFAS and 1,4-dioxane work, treatment-system operation and possible well repairs.", {
        eventStamp: "2025-08-22 · time not stated",
        basis: "Release date printed on PDF page 1",
        created: "2025-08-22 13:21:29 EDT",
        modified: "2025-08-22 13:21:30 EDT",
        note: "The record is explicitly a City news release. Its statements are attributed to the City and are not treated as EPA conclusions or independent laboratory findings.",
      }),
    ],
  },
  {
    year: "2025",
    date: "2025-04-09",
    isoDate: "2025-04-09",
    time: noTime,
    timeBasis: "Date printed in the supplied map filename",
    phase: "AOI follow-up sampling plan",
    kind: "regulatory",
    category: "04 / 13 / 14 · PFAS monitoring, wells & maps",
    title: "Self-sample reports shape six proposed EGLE follow-up areas",
    finding: "Six Wexford map sheets distinguish original self-sampled properties from proposed additional EGLE sampling around W 32 Road/Boon, east and west Lake Mitchell, Constitution Boulevard, S 45 Road and 13th/Plett Road. The 13th/Plett sheet estimates about 35 wells, subject to EGLE and local-health verification.",
    significance: "Documents the geographic scope of follow-up planning after self-sample reports. The maps do not establish that the proposed samples were collected, provide analytical results or prove a source-to-receptor migration pathway.",
    sources: [
      archivedSource("2025-04-09 Wexford Self Sample AOI Maps.pdf", "/findings-docs/161-945324bfdf2a.pdf", 6, "All six map sheets distinguish original self-sampled properties from proposed additional EGLE sampling; PDF page 6 contains the 13th/Plett estimate.", {
        eventStamp: "2025-04-09 · time not stated",
        basis: "Date printed in the supplied map filename",
        note: "The symbols record proposed response areas, not completed sampling, results or pathway proof.",
      }),
    ],
  },
  {
    year: "2025",
    date: "2025-05-20",
    isoDate: "2025-05-20",
    time: noTime,
    timeBasis: "Date written beside the signature line",
    phase: "AOI residential sampling access",
    kind: "receptor",
    category: "04 / 13 · PFAS monitoring & wells",
    title: "Signed agreement authorizes access to sample the 1140 Plett Road well",
    finding: "A signed EGLE sampling questionnaire and access agreement records an irrigation well at 1140 Plett Road, no water-treatment system, an available untreated outdoor spigot and instructions for accessing the sample point. The public copy permanently obscures the phone-number and email fields.",
    significance: "Establishes property-access authorization and sample-point context only. It is not the unsigned 2012 Plett Road project agreement, a chain-of-custody or field sheet, proof that sampling occurred, an analytical result or evidence of a PFAS migration pathway.",
    sources: [
      archivedSource("2025-05-20 Sampling Questionnaire and Access Agreement — Phone and Email Redacted.pdf", "/findings-docs/162-a51176d31cfd.pdf", 1, "The flattened public page records the well use, treatment status, untreated outdoor sample point, access instructions and signature date; the phone-number and email fields are irreversibly obscured.", {
        eventStamp: "2025-05-20 · time not stated",
        basis: "Date written beside the signature line",
        note: "This public derivative uses the supplied replacement page and permanently covers the phone-number and email fields; the underlying contact characters are not present in the PDF.",
      }),
    ],
  },
  {
    year: "2025",
    date: "2025-09-10",
    isoDate: "2025-09-10",
    time: noTime,
    timeBasis: "Collection date carried in source result",
    phase: "Independent reproduction",
    kind: "receptor",
    category: "04 · PFAS monitoring",
    title: "September sampling reproduces the property pattern",
    finding: "The Cyclopure result and available EGLE Work Order 2509147 laboratory page document repeat testing associated with 1140 Plett Road.",
    significance: "Adds another sampling interval and a state-laboratory record to the receptor evidence.",
    sources: [
      { ...pdf("09102025_Analyte Original Cyclopure Test Kit Results (collected .pdf", "2025-09-cyclopure-property", 1, "Original one-page Cyclopure result for September 10, 2025.", {
        eventStamp: "2025-09-10 · time not stated",
        basis: "Collection date carried in source result",
        created: "2026-04-29 09:37:39 CDT",
        modified: "2026-04-29 09:37:39 CDT",
        note: "The embedded timestamp reflects later scanning and is not the sampling time.",
      }), displayName: "Cyclopure Test Kit Results — September 10, 2025.pdf" },
      { name: "EGLE-TEST-2509147-LAB-WORK-ORDER.png", url: repositoryAssetUrl("/docs/2025-egle-work-order-2509147-page.png"), preview: bundledPublicAsset("/docs/2025-egle-work-order-2509147-page.png"), pages: 1, format: "PNG", role: "Source page", result: "Available EGLE result page; the full 49-page Work Order remains an acquisition target.", clock: {
        eventStamp: "2025-09-10 · time not stated",
        basis: "Associated sampling-result date",
        note: "Original embedded source timestamp is unavailable for this extracted page; workspace export time is excluded from evidence.",
      } },
    ],
  },
  {
    year: "2025",
    date: "2025-10-22",
    isoDate: "2025-10-22",
    time: noTime,
    timeBasis: "Effluent sample collection date",
    phase: "WWTP effluent PFAS monitoring",
    kind: "sampling",
    category: "04 · PFAS monitoring",
    title: "October effluent sample reports three PFAS detections",
    finding: "EGLE Work Order 2510354 reports PFBS at 4.4 ng/L, PFHxA at 6.3 ng/L and PFPrA at 16.0 ng/L in Cadillac WWTP effluent collected October 22, 2025. PFOS, PFOA, PFNA and PFHxS were not detected at the 1.7 ng/L reporting limit; the associated trip blank was non-detect at its 1.9 ng/L reporting limit.",
    significance: "Provides a late-2025 EPA Method 1633 effluent checkpoint and distinguishes the WWTP result from private-well and biosolids records. The combined 41-page email package is not duplicated in the app because its laboratory report and structured data export are already preserved as canonical sources.",
    sources: [
      archivedSource("2510354_1 ENVReport 11 24 2025 1129.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/5be18df044489dcea83c7c3154f83ca047b6e5cb/public/lab-docs/062-45b4b12f25d4.pdf", 18, "EGLE Environmental Laboratory Work Order 2510354 with effluent, trip-blank and QA/QC results.", {
        eventStamp: "2025-10-22 · time not stated",
        basis: "Sample collection date printed in the laboratory report",
        note: "Reported November 24, 2025. The report date is not substituted for the sample-collection date.",
      }),
      archivedSource("2510354 FINAL EGLE Excel 24 Nov 25 1129.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/dd0e6a55db0e34b9c781ec8523eabd7f4af1370c/public/dmr-docs/029-250158ca9c72.pdf", 20, "Printable structured-data export for the same Work Order 2510354 analytical results.", {
        eventStamp: "2025-10-22 · time not stated",
        basis: "Sample collection date carried in the data export",
        note: "This is a data export for the same sampling event, retained separately from the laboratory narrative package.",
      }),
    ],
  },
  {
    year: "2026",
    date: "2026-04-02",
    isoDate: "2026-04-02T11:31:22",
    time: "11:31:22 · zone not stated",
    timeBasis: "Email sent timestamp",
    phase: "DMR-QA reassessment",
    kind: "compliance",
    category: "01 · DMR & QA",
    title: "EGLE narrows the DMR-QA Study 45 violation",
    finding: "EGLE states that it re-evaluated Cadillac's Study 45 submission and found all permit-parameter results acceptable. It removed the Total Solids and missing-corrective-action language, while retaining a violation for missing signed data-report, laboratory-checklist and analyte-checklist forms.",
    significance: "Distinguishes an accepted analytical result set from the remaining administrative reporting violation and preserves the complete March 30-April 2 email sequence.",
    sources: [{
      name: "2026-04-02 - RE Cadillac WWTP - DMRQA Study 45.msg.pdf",
      url: "https://github.com/cazey43/cadillac-pfas-event-trace/blob/c152ca117801b3ae5888efcaea2b4d354ed92298/public/dmr-docs/271-16ce608395de.pdf",
      pages: 2,
      format: "PDF",
      role: "Primary source",
      result: "Two-page browser-readable rendering of the complete email thread; the original Outlook MSG is preserved in the same immutable source commit.",
      clock: {
        eventStamp: "2026-04-02 11:31:22 · zone not stated",
        basis: "Sent timestamp in the original Outlook message",
        created: "2026-08-28 15:04:51 EDT (browser rendering)",
        note: "The PDF creation time records preservation rendering, not the email event. The original message contains only two inline signature images and no substantive file attachments.",
      },
    }],
  },
  {
    year: "2026",
    date: "2026-04-09",
    isoDate: "2026-04-09",
    time: noTime,
    timeBasis: "PFAS panel collection date",
    phase: "Multi-panel confirmation",
    kind: "receptor",
    category: "06 · Lab results",
    title: "EPA 533 testing confirms the receptor PFAS pattern",
    finding: "The package reports PFOA 34.6 ng/L, PFOS 10.6 ng/L, PFHxS 33.4 ng/L and PFBS 24.3 ng/L, plus the broader property-water testing suite.",
    significance: "Extends receptor reproducibility; the migration route still requires site-specific hydrogeologic confirmation.",
    sources: [pdf("All MyTapScore Tests 2026.pdf", "2026-04-mytapscore-property", 26, "Twenty-six-page analytical package for 1140 Plett Road.", {
      eventStamp: "2026-04-09 · time not stated",
      basis: "PFAS panel collection date printed in the package",
      created: "2026-04-29 11:35:18 CDT",
      modified: "2026-04-29 11:37:14 CDT",
      note: "The event uses the collection date; embedded timestamps date later report packaging.",
    })],
  },
  {
    year: "2026",
    date: "2026-05-27",
    isoDate: "2026-05-27T10:50:26",
    time: "10:50:26 · zone not stated",
    timeBasis: "Email sent timestamp",
    phase: "Pretreatment enforcement authority",
    kind: "regulatory",
    category: "04 · Industrial pretreatment",
    title: "EGLE directs penalty-authority revisions",
    finding: "EGLE advised that POTWs must have authority to assess a civil penalty of at least $1,000 per day for each IPP violation and identified three Cadillac procedures-manual and enforcement-template sections requiring revision.",
    significance: "Documents a specific 2026 change requested for Cadillac's enforcement authority; the email also says the current Sewer Use Ordinance language appeared to meet that minimum.",
    sources: [ippSource("05-27-2026 - Cadillac WWTP IPP - Civil and criminal penalties.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/3553feaa71173065084148263f8911dfa61f174d/public/ipp-docs/134-ab2692869ee6.pdf", 1, "EGLE email identifying the minimum civil-penalty authority and sections requiring revision.", {
      eventStamp: "2026-05-27 10:50:26 · zone not stated",
      basis: "Email sent timestamp printed in source",
      note: "The source does not print a time-zone abbreviation, so none is inferred.",
    })],
  },
  {
    year: "1987",
    date: "1987-07",
    isoDate: "1987-07",
    time: noTime,
    timeBasis: "Study publication month",
    phase: "Historical watershed baseline",
    kind: "receptor",
    category: "13 · Groundwater & wells",
    title: "Clam River floodplain and hydraulic context mapped",
    finding: "The Soil Conservation Service study maps flood-hazard areas along the Clam River, Lake Cadillac, Lake Mitchell and Pleasant Lake and supplies flood profiles plus 10-, 50-, 100- and 500-year discharge and elevation tables.",
    significance: "Provides historical receptor and floodplain context for later site-specific work. It does not establish PFAS contamination, groundwater flow direction or source attribution.",
    sources: [archivedSource("Flood Plain Management Study — Clam River, Wexford County, Michigan.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/0355e48fffbcaaa07b108c2346423e3aeee32296/public/findings-docs/006-d8496c7348a6.pdf", 150, "Complete July 1987 study with narrative, flood-hazard photomaps, profiles, tables and appendices.", {
      eventStamp: "1987-07 · time not stated",
      basis: "Publication month printed on the title page",
      note: "Historic archive source; current conditions and PFAS conclusions cannot be inferred from this study alone.",
    })],
  },
  {
    year: "2001",
    date: "2001-09-11",
    isoDate: "2001-09-11",
    time: noTime,
    timeBasis: "Latest approved field-measurement date in the supplied USGS export",
    phase: "Clam River discharge measurement",
    kind: "operation",
    category: "13 / 19 · Surface water & technical data",
    title: "USGS measures Clam River discharge at Plett Road",
    finding: "The official USGS export contains ten approved discrete discharge measurements at station 04121241 from June 11, 1975 through September 11, 2001. Reported discharge ranges from 6.24 to 57.6 cubic feet per second; the latest observation is 7.43 cubic feet per second.",
    significance: "Adds documented surface-water hydrology at the Plett Road crossing. The dataset is a sparse series of field visits, not continuous monitoring, and it does not establish groundwater direction, PFAS conditions or a contaminant pathway.",
    sources: [
      {
        name: "field-measurements.csv",
        url: "/reference-data/124-560341e4477c.csv",
        pages: 0,
        format: "CSV",
        role: "Primary source",
        result: "Ten USGS-approved discrete discharge observations for station 04121241, including values, units, dates and approval status.",
        clock: {
          eventStamp: "2001-09-11 · time not stated",
          basis: "Latest approved field-measurement date in the table",
          note: "The table records ten field visits from 1975 through 2001; the exported last-modified timestamp is not treated as the observation date.",
        },
      },
      {
        name: "channel-measurements.csv",
        url: "/reference-data/123-9f1ffc274f7f.csv",
        pages: 0,
        format: "CSV",
        role: "Primary source",
        result: "Ten linked USGS channel-measurement rows with measurement numbers, observation times, discharge values and cubic-feet-per-second units.",
        clock: {
          eventStamp: "2001-09-11 · time not stated",
          basis: "Latest channel-measurement date in the table",
          note: "The table is the channel-measurements member of the preserved USGS station export and matches the ten field visits.",
        },
      },
      {
        name: "monitoring-location-metadata.csv",
        url: "/reference-data/125-ffca040a7195.csv",
        pages: 0,
        format: "CSV",
        role: "Primary source",
        result: "USGS station metadata identifying 04121241 as Clam River at Plett Road at Cadillac, Michigan, site type Stream.",
        clock: {
          eventStamp: "Station metadata · time not stated",
          basis: "Monitoring-location identity in the supplied export",
          note: "The coordinates are reported as map-interpolated NAD27 station coordinates and are not a surveyed groundwater-control point.",
        },
      },
      {
        name: "USGS 04121241 Clam River at Plett Road Flow Data.zip",
        url: "/reference-data/118-2e333d1adab3.zip",
        pages: 0,
        format: "ZIP",
        role: "Primary source",
        result: "Preserved three-table USGS export containing the same station metadata and ten approved field and channel measurements.",
        clock: {
          eventStamp: "2001-09-11 · time not stated",
          basis: "Latest field-measurement date in the supplied export",
          note: "The ZIP remains the canonical source package; its three exact CSV members are also exposed individually for direct review and download.",
        },
      },
    ],
  },
  {
    year: "2010",
    date: "2010-03-15",
    isoDate: "2010-03-15",
    time: noTime,
    timeBasis: "EPA report date",
    phase: "Federal noncompliance reporting",
    kind: "compliance",
    category: "13 · Compliance & enforcement",
    title: "EPA QNCR carries Cadillac mercury noncompliance forward",
    finding: "EPA Region 5's report for October–December 2009 lists Cadillac WWTP as noncompliant and identifies total mercury at outfall 001A with a July 31, 2005 violation date and status 'NC — continuing noncompliance.'",
    significance: "Preserves the federal quarterly status entry as reported. The row does not supply a measured concentration, an enforcement action or a PFAS finding.",
    sources: [archivedSource("EPA Region 5 Michigan First-Quarter 2010 QNCR.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/0355e48fffbcaaa07b108c2346423e3aeee32296/public/findings-docs/001-9863804c33e3.pdf", 63, "Cadillac-specific row appears on PDF page 6 / report page 5.", {
      eventStamp: "2010-03-15 · time not stated",
      basis: "Report date printed in the EPA QNCR header",
      note: "The report period is October 1 through December 31, 2009; the underlying listed violation date is July 31, 2005.",
    })],
  },
  {
    year: "2010",
    date: "2010-04-19",
    isoDate: "2010-04-19",
    time: noTime,
    timeBasis: "Council meeting date; individual motion times not stated",
    phase: "Utility finance and environmental-service procurement",
    kind: "regulatory",
    category: "10 · Public finance & environmental services",
    title: "Council raises water and sewer rates and awards hazardous-waste collection",
    finding: "April 19, 2010 minutes record unanimous adoption of 4.5% water and sewer rate increases effective July 1, 2010 (motions 2010.088 and 2010.089). Motion 2010.096 awards Environmental Recycling Group household-hazardous-waste collection at a $725 site fee plus $0.83 per pound for 2010–2011, with a two-year option and County/City cost shares of 60%/40%.",
    significance: "Establishes adopted utility rates and a service award, not leachate revenue, payment, actual material delivery or disposal at Cadillac WWTP. The same minutes' Miscellaneous File No. 869 concerns delinquent taxes, not leachate-treatment File No. 842.",
    sources: [{
      ...archivedSource("Cadillac City Council Minutes — April 19, 2010.pdf", "/findings-docs/175-1abad5ad01bd.pdf", 7, "Rates: PDF pp2–3; household-hazardous-waste award: pp4–5. Final page is blank.", {
        eventStamp: "2010-04-19 · time not stated",
        basis: "Meeting date printed on page 1",
        note: "The rate increases take effect July 1, 2010; this is not a delivery date.",
      }),
      page: 3,
    }],
  },
  {
    year: "2010",
    date: "2010-10-18",
    isoDate: "2010-10-18",
    time: noTime,
    timeBasis: "Council meeting date",
    phase: "Landfill-sale and solid-waste-plan deliberation",
    kind: "regulatory",
    category: "12 · Landfill governance & financial context",
    title: "Council hears landfill-sale, waste-import and tipping-fee proposals",
    finding: "October 18, 2010 minutes continue the Wexford Solid Waste Management Plan amendment hearing. Speakers discuss American Waste, the proposed landfill sale, expanded waste imports, tipping fees and landfill life. County Administrator Ken Hinton describes increased imports as potentially lowering tipping fees while shortening landfill life. These minutes contain no plan-amendment adoption.",
    significance: "Documents attributed policy and financial statements, not completed transactions. November 1 minutes subsequently correct the earlier discussion to future flow-control options upon sale or after a set period. Solid-waste flow control is not wastewater flow; neither record supplies a leachate load ticket.",
    sources: [{
      ...archivedSource("Cadillac City Council Minutes — October 18, 2010.pdf", "/findings-docs/177-b1426df447ba.pdf", 6, "Landfill hearing and attributed statements: PDF pp2–4; final page is blank.", {
        eventStamp: "2010-10-18 · time not stated",
        basis: "Meeting date printed on page 1",
        note: "The hearing continuation begins at 7:13 p.m.; subsequent corrections are preserved in the November 1 original.",
      }),
      page: 2,
    }, {
      ...archivedSource("Cadillac City Council Minutes — November 1, 2010.pdf", "/findings-docs/178-d632a7779e92.pdf", 7, "PDF pp1–2, motion 2010.239, approve corrections to the October 18 discussion; this does not enact the described options.", {
        eventStamp: "2010-11-01 · time not stated",
        basis: "Date of Council approval of corrected prior minutes",
        note: "Both immutable originals are retained; the earlier file has not been overwritten.",
      }),
      page: 1,
      role: "Cross-reference",
    }],
  },
  {
    year: "2010",
    date: "2010-11-01",
    isoDate: "2010-11-01",
    time: noTime,
    timeBasis: "Council meeting date; vote time not stated",
    phase: "Solid-waste-plan amendment approval",
    kind: "regulatory",
    category: "12 · Landfill governance & environmental obligations",
    title: "Council approves solid-waste-plan amendment after landfill-sale discussion",
    finding: "November 1, 2010 minutes, PDF pp4–5, discuss American Waste’s proposed landfill acquisition and conditional rate decreases. County financial consultant Bob Joseph describes anticipated transfer of equipment, cells and buildings, assumption of closure/post-closure costs, and required relocation of trash from an unlined cell. Motion 2010.248 approves the 2009 Solid Waste Management Plan amendment by 3–2.",
    significance: "Establishes this Council vote and the attributed obligations—not all required approvals, a completed sale, completed waste relocation, or delivery to Cadillac WWTP. Corrected page 5 attributes the County’s future flow-control pledge to John Divozzo, not Bob Joseph. No per-load records or PFAS results are supplied.",
    sources: [{
      ...archivedSource("Cadillac City Council Minutes — November 1, 2010.pdf", "/findings-docs/178-d632a7779e92.pdf", 7, "PDF pp4–5 contain the sale discussion, obligations and motion 2010.248. Final page is blank.", {
        eventStamp: "2010-11-01 · time not stated",
        basis: "Meeting date printed on page 1",
        note: "The vote approves the 2009 amendment; 2010 is the Council action year, not a renamed amendment year.",
      }),
      page: 5,
    }],
  },
  {
    year: "2014",
    date: "2014-06-14",
    isoDate: "2014-06-14",
    time: noTime,
    timeBasis: "EPA data-run date",
    phase: "Federal noncompliance reporting",
    kind: "compliance",
    category: "13 · Compliance & enforcement",
    title: "EPA ICIS report records overdue Cadillac DMR",
    finding: "The January–March 2014 QNCR detail row records a Cadillac WWTP DMR overdue to EPA/State for outfall 001, violation date December 31, 2013, status date February 20, 2014 and code 2D reporting violation. EPA's April–June 2014 report carries the same underlying DMR violation forward as continuing noncompliance in its September 13 data run.",
    significance: "Adds the primary federal status row and distinguishes a reporting violation from a pollutant-limit exceedance. Neither report links an enforcement action or final order, and the later entry is treated as a status cross-reference rather than a new violation event.",
    sources: [
      {
        ...archivedSource("EPA ICIS Michigan Second-Quarter 2014 QNCR.pdf", "/findings-docs/002-2ee7fa5b072b.pdf", 50, "Cadillac-specific detail appears on PDF page 2.", {
          eventStamp: "2014-06-14 · time not stated",
          basis: "EPA ICIS data-run and refresh date",
          note: "The report period is January 1 through March 31, 2014. The underlying violation and status dates are December 31, 2013 and February 20, 2014, respectively.",
        }),
        page: 2,
      },
      {
        ...archivedSource("2014-04-01 to 2014-06-30 - EPA ICIS Michigan Quarterly Non-Compliance Report.pdf", "/compliance-docs/021-2bd817167074.pdf", 53, "PDF page 2 carries forward the same overdue outfall 001 DMR status.", {
          eventStamp: "2014-09-13 · time not stated",
          basis: "EPA ICIS data-run and refresh date",
          note: "This later quarterly report records continuing noncompliance for the same December 31, 2013 reporting violation; it is not counted as a new violation event.",
        }),
        page: 2,
        role: "Cross-reference",
      },
    ],
  },
  {
    year: "2015",
    date: "2015-06-13",
    isoDate: "2015-06-13",
    time: noTime,
    timeBasis: "EPA data-run date",
    phase: "Federal noncompliance reporting",
    kind: "compliance",
    category: "13 · Compliance & enforcement",
    title: "EPA QNCR lists seven Cadillac ammonia and carbonaceous-BOD violations",
    finding: "EPA's January–March 2015 QNCR detail table lists seven code 3A1 non-monthly-average permit-effluent violations at Cadillac WWTP outfall 001-A. The parameters are total ammonia as nitrogen and carbonaceous biochemical oxygen demand, with underlying violation dates from October 31, 2014 through March 31, 2015.",
    significance: "Preserves the federal ICIS status evidence as reported. The table does not supply concentrations, loads, root cause or PFAS findings, and it shows no linked enforcement action or final order.",
    sources: [{
      ...archivedSource("2015-01-01 to 2015-03-31 - EPA ICIS Michigan Quarterly Non-Compliance Report.pdf", "/compliance-docs/062-4c293cc26b89.pdf", 47, "Cadillac-specific detail appears on PDF page 3.", {
        eventStamp: "2015-06-13 · time not stated",
        basis: "EPA ICIS data-run and refresh date",
        created: "2015-06-14",
        modified: "2015-09-09",
        note: "The report period is January 1 through March 31, 2015; the seven underlying entries span October 31, 2014 through March 31, 2015.",
      }),
      page: 3,
    }],
  },
  {
    year: "2017",
    date: "2017-11-06",
    isoDate: "2017-11-06",
    time: noTime,
    timeBasis: "AQD inspection date",
    phase: "Landfill air-compliance inspection",
    kind: "compliance",
    category: "12 · Landfill & leachate",
    title: "AQD inspection records landfill systems and compliance",
    finding: "The scheduled N3862 inspection describes the 3.45-million-Mg landfill, active gas collection and flare, accepted waste streams, a post-closure groundwater-remediation aeration system and an exempt leachate evaporation system. The inspector recorded compliance and no odors, visible emissions or recent complaints.",
    significance: "Supplies a dated operational snapshot and corroborates systems later discussed in the leachate and air-permit record. It is not a PFAS sampling result.",
    sources: [archivedSource("N3862 Scheduled Inspection — Wexford County Landfill.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/0355e48fffbcaaa07b108c2346423e3aeee32296/public/findings-docs/003-e0a3523951f8.pdf", 3, "Complete three-page AQD activity report; the separately supplied '(1)' file was byte-identical and excluded.", {
      eventStamp: "2017-11-06 · time not stated",
      basis: "Inspection date and inspector signature date",
      note: "One exact duplicate copy was suppressed after SHA-256 and visual comparison; no duplicate filename label is carried forward.",
    })],
  },
  {
    year: "2017",
    date: "2017-11-20",
    isoDate: "2017-11-20",
    time: "6:00 PM",
    timeBasis: "Council-meeting time printed in the minutes",
    phase: "Landfill leachate treatment and injection-well opposition",
    kind: "regulatory",
    category: "12 · Landfill & leachate",
    title: "Cadillac records paid landfill leachate treatment and rejects the injection alternative",
    finding: <>The official minutes record City Manager Marcus Peccia stating that the landfill company deposited leachate at Cadillac&apos;s WWTP, the City was paid to treat it, a deep injection well would take that revenue source away, and Cadillac was responsible for treating the waste and discharging the treated water. Utilities Director Jeff Dietlin explained that leachate—rainwater and liquid from garbage—was collected in landfill cells, pumped into a tank and hauled to Cadillac&apos;s WWTP. Council then unanimously approved motion 2017-232 opposing draft permit MI-165-1I-0002. The associated draft resolution states that Cadillac treated Wexford County Landfill leachate for <strong>over 20 years</strong>, treated and discharged <strong>14 million gallons in 2016</strong>, and had capacity for <strong>up to 20 million gallons annually</strong>. It identifies cadmium, lead, nickel, chromium, arsenic, benzene, ethylbenzene, ammonia, silver, copper and toluene and states that contaminants were removed before discharge under NPDES limits.</>,
    significance: "This is direct municipal evidence of the landfill-to-WWTP receiving and paid-treatment relationship, the treatment-and-discharge pathway, and the Council's recorded action. The volume, duration, capacity and removal statements are City assertions in an unsigned draft resolution, not the underlying delivery logs, DMR totals, capacity calculations, analytical results or contaminant-removal measurements. The record does not provide the exact final delivery date, PFAS concentrations or a proven groundwater migration pathway.",
    sources: [{
      name: "November 20, 2017 Cadillac City Council Meeting Minutes.pdf",
      url: "/findings-docs/164-519d4faa6c33.pdf",
      preview: bundledFirstPagePreview("/findings-docs/164-519d4faa6c33.pdf"),
      pages: 9,
      page: 6,
      format: "PDF",
      role: "Primary source",
      result: "Pages 6–8 record the paid-treatment statements, Cadillac's treatment and environmental-discharge role, the landfill collection and hauling explanation, motion number, permit number and unanimous vote.",
      clock: {
        eventStamp: "2017-11-20 6:00 PM · meeting time",
        basis: "Meeting date and time printed on page 1",
        created: "2017-12-05 08:42:52 EST",
        modified: "2017-12-05 08:42:52 EST",
        note: "The December timestamps describe production of the minutes PDF, not the November 20 meeting. The complete nine-page official-minutes record is distinct from the earlier 102-page council packet and unsigned proposed-resolution attachment.",
      },
    }, {
      name: "Cadillac Resolution Opposing Wexford Water Technologies Injection-Well Permit.pdf",
      url: "/findings-docs/100-850f00b27330.pdf",
      preview: bundledFirstPagePreview("/findings-docs/100-850f00b27330.pdf"),
      pages: 5,
      page: 3,
      format: "PDF",
      role: "Cross-reference",
      result: "Pages 3–4 state the over-20-year treatment history, 14 million gallons treated and discharged in 2016, capacity for up to 20 million gallons annually, the listed contaminants and the claim that contaminants were removed before NPDES-compliant discharge.",
      clock: {
        eventStamp: "2017-11-20 6:00 PM · meeting time",
        basis: "Meeting date and time printed in the draft and corroborated by the official minutes",
        created: "2017-11-16 08:22:48 EST",
        modified: "2017-11-16 08:22:48 EST",
        note: "The newly supplied filename is an exact SHA-256 match to established record 100. Its resolution number, mover, seconder, vote and certification fields are blank, so it remains labeled as draft text. The official minutes separately establish unanimous adoption of motion 2017-232 for a resolution bearing the same title and permit number.",
      },
    }],
  },
  {
    year: "2018",
    date: "2018-05-21",
    isoDate: "2018-05-21",
    time: noTime,
    timeBasis: "Budget-approval date printed in Ordinance 2018-06",
    phase: "Water and Sewer Fund budgeting",
    kind: "operation",
    category: "10 / 12 · Process, landfill & leachate",
    title: "Cadillac adopts FY2019 budget with leachate revenue and hauled-waste goals",
    finding: <>The adopted budget reports leachate revenue of <strong>$447,684</strong> for FY2017 actual, <strong>$350,000</strong> for FY2018 estimated and <strong>$150,000</strong> for FY2019 proposed. The Water Resources Division&apos;s fiscal goal includes evaluating new revenue through additional hauled waste. In the same goals section, the division commits to keeping discharges below NPDES permit levels, limiting industrial waste through active monitoring and maintaining Class A EQ biosolids.</>,
    significance: "The budget separately documents a revenue incentive and pollution-control obligations within the same Water Resources program. Read together, those goals create a policy tension worth tracing, but the budget does not state that the goals conflicted in practice, identify the source or contents of additional hauled waste, establish a permit violation, or replace load-level treatment and delivery records.",
    sources: [{
      name: "City of Cadillac FY2019 Adopted Operating Budget.pdf",
      url: "/findings-docs/165-676065b15331.pdf",
      preview: bundledFirstPagePreview("/findings-docs/165-676065b15331.pdf"),
      pages: 235,
      page: 105,
      format: "PDF",
      role: "Primary source",
      result: "PDF page 41 contains the Water Resources fiscal and environmental goals; page 46 records approval on May 21, 2018; page 105 contains the Water and Sewer Fund revenue table.",
      clock: {
        eventStamp: "2018-05-21 · exact time not stated",
        basis: "Approval date printed on the FY2019 Budget Appropriations Act",
        created: "2018-03-29 14:57:56 EDT",
        modified: "2018-08-03 09:10:10 EDT",
        note: "The PDF metadata dates describe document production and later modification. The timeline event uses the separate May 21 budget-approval date printed on page 46, not the November 2017 council-minutes date.",
      },
    }],
  },
  {
    year: "2021",
    date: "2021-01-22",
    isoDate: "2021-01-22",
    time: noTime,
    timeBasis: "EGLE letter date",
    phase: "Landfill groundwater monitoring",
    kind: "regulatory",
    category: "12 · Landfill & leachate",
    title: "EGLE accepts Wexford's 2020 long-term monitoring report",
    finding: "EGLE's Materials Management Division acknowledged receipt of the 2020 Annual Long-Term Monitoring Program Report for the Remedial Action Plan area north of the current Wexford County Landfill, accepted the report and authorized groundwater monitoring to continue as detailed in the RAP.",
    significance: "Confirms continuing RAP groundwater monitoring and agency acceptance of the 2020 annual report. The one-page correspondence does not supply the underlying monitoring data, PFAS results, surveyed water levels or a Plett Road migration analysis.",
    sources: [{
      ...archivedSource("Wexford County Board Agenda — February 3, 2021.pdf", "/wexford-docs/104-6815e2f8b48e.pdf", 88, "Eighty-eight-page county agenda packet; the January 22 EGLE monitoring-acceptance letter appears on PDF page 88.", {
        eventStamp: "2021-01-22 · time not stated",
        basis: "Letter date printed on the EGLE correspondence",
        created: "2021-01-29 15:27:16 EST",
        modified: "2021-01-29 15:40:48 EST",
        note: "The timeline uses the January 22 agency-letter date; February 3 is the meeting date of the packet in which the correspondence appears.",
      }),
      page: 88,
    }],
  },
  {
    year: "2021",
    date: "2021-03-10",
    isoDate: "2021-03-10",
    time: noTime,
    timeBasis: "Tier 2 report date",
    phase: "Landfill-gas testing",
    kind: "sampling",
    category: "12 · Landfill & leachate",
    title: "Tier 2 testing models Wexford NMOC generation",
    finding: "The report documents January 19–21 field sampling and models 2021 NMOC generation at 35.81 Mg/year average and 38.64 Mg/year maximum, below the 50-Mg/year NSPS threshold. Under its assumptions, the maximum projection crosses 50 in 2028 and the average projection crosses 50 in 2030.",
    significance: "Preserves both the contemporaneous below-threshold conclusion and the report's later projected crossings. The model concerns landfill-gas NMOC, not PFAS.",
    sources: [archivedSource("Wexford County Landfill Tier 2 NMOC Results.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/0355e48fffbcaaa07b108c2346423e3aeee32296/public/findings-docs/004-00a43fa54cad.pdf", 20, "Report, laboratory summary, field logs and sampling maps; scan-only pages were visually reviewed.", {
      eventStamp: "2021-03-10 · time not stated",
      basis: "Report date; field sampling occurred January 19–21, 2021",
      note: "The report states retesting was required by January 19, 2026 to maintain the exemption.",
    })],
  },
  {
    year: "2021",
    date: "2021-04",
    isoDate: "2021-04",
    time: noTime,
    timeBasis: "Report month",
    phase: "Statewide PFAS synthesis",
    kind: "sampling",
    category: "04 / 06 · PFAS monitoring & lab results",
    title: "EGLE/AECOM report publishes Cadillac PFAS tables",
    finding: "The full Michigan WWTP study identifies Cadillac as PFAS-sampled under permit MI0020257. Table 3 reports Cadillac effluent at 20 ng/L PFOA and 6.5 ng/L PFOS on November 5, 2018; 16 and 7.8 ng/L on June 4, 2019; and 3.4 and 2.0 ng/L on October 22, 2019. Table 14 lists one coded active Type II landfill SIU sample associated with Cadillac at 590 ng/L PFOA and 120 ng/L PFOS.",
    significance: "Adds the complete official statewide synthesis and independently consolidates Cadillac results already represented by underlying records. The coded landfill row does not name Wexford County Landfill, document a leachate delivery or establish a PFAS migration pathway to Plett Road.",
    sources: [{
      ...archivedSource("EGLE/AECOM Full Report — PFAS in Michigan Wastewater Treatment Plants.pdf", "/pfas-docs/102-03b43f8e8597.pdf", 119, "Cadillac is identified on PDF page 77; its three effluent results appear on page 83; the coded active Type II landfill SIU row appears on page 105.", {
        eventStamp: "2021-04 · day and time not stated",
        basis: "Report month printed on the title page",
        created: "2021-03-29 11:59:11 EDT",
        modified: "2025-02-04 05:49:54 EST",
        note: "The report month controls this publication event. Individual Cadillac samples retain their separate 2018-2019 collection dates, and the coded landfill row is not expanded beyond the source table.",
      }),
      page: 83,
    }],
  },
  {
    year: "2022",
    date: "2022-07-20",
    isoDate: "2022-07-20T16:00:00-04:00",
    time: "4:00 PM",
    timeBasis: "Board-meeting time printed on packet",
    phase: "Landfill remedial-action budgeting",
    kind: "regulatory",
    category: "12 · Landfill & leachate",
    title: "Wexford packet publishes $57,400 landfill RAP budget",
    finding: "The July 20 Board packet publishes Pescador's August 8, 2021 proposal for the 2022 Wexford County Landfill Remedial Action Plan budget. The scope includes annual long-term groundwater monitoring, an annual monitoring report, financial-assurance work, RAP tasks and analytical costs. The total estimated 2022 annual budget is $57,400, with $52,600 remaining after two listed invoices.",
    significance: "Documents the proposed monitoring and remedial-action budget under the 2002 consent order. It does not prove that work was completed or amounts were paid, and it supplies no PFAS results, surveyed water-level round, site-specific groundwater-flow map or Plett Road source-to-receptor analysis.",
    sources: [{
      ...archivedSource("Wexford County Board of Commissioners Packet — July 20, 2022.pdf", "/findings-docs/172-f779ef08f411.pdf", 115, "The packet lists the landfill correspondence on PDF page 2; the proposal and budget appear on PDF pages 113-115.", {
        eventStamp: "2022-07-20 4:00 PM",
        basis: "Meeting date and time printed on the packet",
        created: "2022-07-08 16:52:21 EDT",
        modified: "2022-07-15 12:24:43 EDT",
        note: "The packet event is dated July 20, 2022. The embedded budget proposal is separately dated August 8, 2021 and is characterized as a proposal rather than proof of performance or payment.",
      }),
      page: 114,
    }],
  },
  {
    year: "2022",
    date: "2022-08-15",
    isoDate: "2022-08-15",
    time: noTime,
    timeBasis: "ROP staff-report date",
    phase: "Air-permit renewal",
    kind: "regulatory",
    category: "12 · Landfill & leachate",
    title: "ROP staff report updates leachate and air-control history",
    finding: "The N3862 staff report states that deep-well leachate injection began in early 2019, the former contaminated-groundwater aeration ponds had been dismantled and removed since 2017, and the active gas collection system routes gas to a flare. It also reports 2021 emissions and March 2022 Tier 2 NMOC calculations.",
    significance: "Provides a later agency synthesis of facility changes, not the final Cadillac leachate delivery date, proof that all groundwater remediation ended, PFAS clearance or comprehensive environmental compliance. AQD's expected air-permit compliance and proposed permit approval remain qualified statements.",
    sources: [archivedSource("N3862 Renewable Operating Permit Staff Report.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/0355e48fffbcaaa07b108c2346423e3aeee32296/public/findings-docs/005-0f46024ab583.pdf", 8, "August 15 staff report with September 15 addendum for MI-ROP-N3862-2022.", {
      eventStamp: "2022-08-15 · time not stated",
      basis: "Staff-report date printed on the title page",
      note: "The September 15 addendum states no pertinent public comments were received and makes no changes to the draft ROP. The supplied N3862 Staff Report 11-01-22.pdf is an exact duplicate; November 1 in its filename is not the staff-report date. Page 4 supplies the historical injection and pond statements, not an exact cessation date or final signed permit.",
    })],
  },
  {
    year: "2026",
    date: "2026-02-02",
    isoDate: "2026-02-02",
    time: noTime,
    timeBasis: "Council communication date",
    phase: "WWTP capital planning",
    kind: "operation",
    category: "10 · Process & site",
    title: "Cadillac acknowledges deferred WWTP upgrades and capacity constraints",
    finding: "The City states that it postponed several needed upgrades. F&V's proposal says the 1960s headworks has aging, inefficient equipment and a building in poor condition; the 18- to 23-year-old UV system has recurring pneumatic-wiper, intensity-meter and individual bank-control problems; and one primary clarifier is being used as a waste-activated-sludge holding tank, reducing available primary-settling capacity. The proposed project plan would evaluate current performance, regulatory-compliance status and projected 20-year capacity and treatment needs.",
    significance: "Provides contemporaneous infrastructure context for evaluating the separate April 2026 bypass records. The planning proposal does not itself establish that any listed condition caused a bypass or that construction, funding or a final project scope was approved.",
    sources: [archivedSource("Cadillac WWTP CWSRF Project Plan and Funding Proposal.pdf", "/findings-docs/007-238cf9655b70.pdf", 9, "Council communication, January 8 engineering proposal, project-plan outline and 2013 professional-services agreement. The deferred-upgrade statement and cited system conditions appear on PDF pages 1-3.", {
      eventStamp: "2026-02-02 · time not stated",
      basis: "Council communication date",
      note: "The proposal anticipated an April draft and May 1, 2026 submission deadline. Completion and a causal link to any later bypass are not inferred from this source.",
    })],
  },
  {
    year: "2026",
    date: "2026-02-25",
    isoDate: "2026-02-25",
    time: noTime,
    timeBasis: "Meeting date and adoption certification printed on the signed resolution",
    phase: "PFAS cleanup-system funding",
    kind: "receptor",
    category: "13 · Groundwater treatment & PFAS response",
    title: "LDFA unanimously supports PFAS carbon-regeneration grant",
    finding: "The signed resolution states that Cadillac's Local Finance Development Authority operates the Kysor Superfund groundwater cleanup system, including two 5,000-pound carbon-filter vessels repurposed to capture PFAS. It states that one vessel was no longer effective because foulants had accumulated and records a 7-0 vote supporting the City's NextCycle grant request for onsite carbon regeneration and PFAS-destruction technology.",
    significance: "Converts the carbon-regeneration proposal into a signed LDFA action and documents the board's stated filter condition. It does not establish that the grant was awarded, a contractor was selected, regeneration or PFAS destruction occurred, or treatment performance was verified. It is separate from the later unsigned municipal-water project resolution in the July 2026 council packet.",
    sources: [archivedSource("2026-02-25 - Signed LDFA Carbon Regeneration Grant Resolution.pdf", "/findings-docs/167-322217e52758.pdf", 2, "Two-page signed resolution recording the carbon-vessel condition, grant support, 7-0 vote and chairperson certification.", {
      eventStamp: "2026-02-25 · exact time not stated",
      basis: "Meeting date and certification printed on the resolution",
      note: "The signed vote supports the grant application. No grant award, contract, completed regeneration or performance result is included.",
    })],
  },
  {
    year: "2026",
    date: "2026-06-10",
    isoDate: "2026-06-10",
    time: noTime,
    timeBasis: "Date printed on EGLE's violation notice",
    phase: "Treatment-bypass enforcement",
    kind: "compliance",
    category: "08 · Compliance & enforcement",
    title: "EGLE cites a 16.369-million-gallon April bypass",
    finding: "EGLE's Violation Notice VN-019184 states that Cadillac reported approximately 16.369 million gallons of partially treated sewage discharged to the Clam River from April 16 through April 29, 2026. The notice says the flow passed preliminary, primary and secondary treatment and UV disinfection but bypassed tertiary treatment when peak flow approached 5.0 MGD against a stated 3.5 MGD tertiary capacity. EGLE also states that required agency, health-department and public notifications were not completed within 24 hours.",
    significance: "Records EGLE's formal violation finding and its request for event-specific proof that the reportable-discharge-scenario storm threshold was exceeded or, alternatively, a corrective-action schedule. The notice is not a final order and does not establish how EGLE later evaluated Cadillac's response.",
    sources: [archivedSource("2026-06-10 - EGLE Violation Notice VN-019184 — Cadillac WWTP.pdf", "/compliance-docs/007-5e26c04f42e1.pdf", 2, "Two-page EGLE notice stating the bypass volume, treatment path, reporting findings and requested response.", {
      eventStamp: "2026-06-10 · time not stated",
      basis: "Issue date printed on the notice",
      note: "The findings are attributed to EGLE. The notice requests a response by July 31, 2026 and is not represented as a final disposition.",
    })],
  },
  {
    year: "2026",
    date: "2026-07-14",
    isoDate: "2026-07-14",
    time: noTime,
    timeBasis: "Date printed on Cadillac's signed response",
    phase: "Violation response",
    kind: "compliance",
    category: "08 · Compliance & enforcement",
    title: "Cadillac attributes April bypass to an RDS-exceeding flood",
    finding: "Cadillac's signed response says March ice and snowmelt, frozen ground and April flooding infiltrated the sewer system and caused a partial tertiary-treatment bypass. The City reports 11.79 inches of April precipitation, including 11.24 inches during the first 18 days, asserts that the reportable-discharge-scenario threshold was exceeded and confirms that future bypasses will be reported. Attached April 22 and April 27 EGLE emails document contemporaneous reporting directions and EGLE's view that the partial-treatment bypass was reportable.",
    significance: "Preserves Cadillac's weather-based defense, the City's description of the bypass and its future-reporting commitment. The response package contains no later EGLE decision accepting the defense, withdrawing the notice or closing the violation.",
    sources: [
      archivedSource("2026-07-14 - Cadillac Response to Violation Notice VN-019184.pdf", "/compliance-docs/063-bfbcd24d8a0a.pdf", 5, "Signed two-page City response with a NOAA precipitation table and two EGLE reporting-reminder emails.", {
        eventStamp: "2026-07-14 · time not stated",
        basis: "Date printed on the signed response",
        note: "The RDS conclusion is the City's assertion. No agency acceptance or final compliance disposition is included in the supplied package.",
      }),
      {
        ...archivedSource("2026-06-10 - EGLE Violation Notice VN-019184 — Cadillac WWTP.pdf", "/compliance-docs/007-5e26c04f42e1.pdf", 2, "The underlying notice to which Cadillac responded.", {
          eventStamp: "2026-06-10 · time not stated",
          basis: "Issue date printed on the notice",
          note: "Included as a cross-reference so EGLE's findings remain separate from Cadillac's response.",
        }),
        role: "Cross-reference",
      },
    ],
  },
  {
    year: "1985",
    date: "1985-07-23",
    isoDate: "1985-07-23",
    time: noTime,
    timeBasis: "Issue date printed on the progress report",
    phase: "Historical groundwater investigation",
    kind: "receptor",
    category: "13 / 14 · Groundwater, wells & hydrogeology",
    title: "DNR calls for a broader Cadillac-area groundwater study",
    finding: "Michigan DNR's fourth Northernaire progress report says the initial investigation found elevated cadmium and chromium in site soils and sewer sediment and recommended excavation and off-site disposal. It states that complex hydrogeology, limited groundwater-flow information and other possible area sources required more study. The report records a requested $244,162 EPA supplement and approximately $1.3 million in Act 307 funding, including $872,000 for water-supply extensions and about $445,000 for investigation.",
    significance: "Preserves the contemporaneous recognition that the groundwater problem was regional and not yet adequately defined. The report predates PFAS investigation, and its funding and proposed-study statements do not establish completed field work, a current flow direction or a source-to-Plett pathway.",
    sources: [archivedSource("1985-07-23 - Northernaire Plating Progress Report No. 4.pdf", "/findings-docs/166-fd889bd49fef.pdf", 3, "Three-page Michigan DNR/EPA progress report covering soil and sewer contamination, remedial alternatives and the need for broader groundwater study.", {
      eventStamp: "1985-07-23 · exact time not stated",
      basis: "Issue date printed on the report",
      created: "2004-05-18 19:51:09 EDT (EPA archive scan)",
      note: "The 2004 PDF timestamp records archival production, not the 1985 event. The source describes historical metals and regional groundwater uncertainty, not PFAS.",
    })],
  },
  {
    year: "1986",
    date: "1986-05",
    isoDate: "1986-05",
    time: noTime,
    timeBasis: "Publication month printed on the RI/FS work plan",
    phase: "Regional groundwater investigation design",
    kind: "receptor",
    category: "13 / 14 · Groundwater, wells & hydrogeology",
    title: "Cadillac-area RI/FS plan maps a multi-source investigation",
    finding: "The E.G. Jordan/Michigan DNR work plan says private wells had shown industrial-solvent contamination since 1978 and identifies Kysor, former Four Star, 4-Winns and the Ingraham property as known or suspected source areas, with hexavalent chromium discharged at Northernaire. Its preliminary interpretation describes three aquifers, estimated shallow flow northeast at about 200 feet per year and intermediate flow northwest at about 25 feet per year, while stating that plume boundaries and hydrogeology remained insufficiently defined. The proposed program includes 60 approximately 90-foot source-location wells, 26 tentative shallow/deep wells, groundwater sampling, aquifer testing and a flow-and-transport model.",
    significance: "Adds the period-specific investigation design and the limits acknowledged when it was written. This is a work plan, not the completed RI/FS: it does not provide the resulting well logs, synoptic water levels, hydraulic-test results or a modern PFAS source-to-Plett pathway.",
    sources: [archivedSource("1986-05 - Cadillac Area Groundwater Contamination RI-FS Work Plan.pdf", "/findings-docs/168-cdc906173203.pdf", 196, "Complete work plan with the problem statement, preliminary hydrogeologic interpretation, proposed well network, sampling and aquifer-testing methods, schedule and appendices.", {
      eventStamp: "May 1986 · exact day/time not stated",
      basis: "Publication month printed on the title page",
      created: "2004-05-20 07:16:24 EDT (EPA archive scan)",
      note: "The 2004 timestamp records archive scanning. Planned activities are not represented as completed results, and the document predates PFAS investigation.",
    })],
  },
  {
    year: "1988",
    date: "April 1988",
    isoDate: "1988-04",
    time: noTime,
    timeBasis: "Study publication month",
    phase: "Historical groundwater remediation",
    kind: "receptor",
    category: "14 · Hydrogeology & mapping",
    title: "Feasibility study maps industrial-park VOC and chromium plumes",
    finding: "The MDNR/E.C. Jordan interim study identifies five known or probable industrial-park source areas and seven groundwater plumes involving volatile organic compounds and hexavalent chromium. It evaluates cleanup levels and treated-groundwater discharge options, including possible discharge to the Cadillac POTW subject to pretreatment.",
    significance: "Establishes the documented 1980s groundwater-remediation setting. The study predates the PFAS investigation and does not establish PFAS contamination, a modern flow path or current source attribution.",
    sources: [archivedSource("Cadillac Area Groundwater Contamination Feasibility Study.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/e792937dad5338952723a5b79b1a2f51f9ddae5e/public/findings-docs/011-05c2a0fb3666.pdf", 50, "April 1988 interim feasibility study; an OCR-fixed copy is retained after comparison with a byte-different scan of the same document.", {
      eventStamp: "April 1988 · time not stated",
      basis: "Publication month printed on the title page",
      note: "This is historical VOC and chromium remediation evidence, not a PFAS analytical record.",
    })],
  },
  {
    year: "1988",
    date: "August 1988",
    isoDate: "1988-08",
    time: noTime,
    timeBasis: "Publication month; report marked FINAL DRAFT",
    phase: "Historical groundwater pathways",
    kind: "receptor",
    category: "14 · Hydrogeology & mapping",
    title: "Sand aquifers, clay barriers and groundwater pathways",
    finding: "The August 1988 E.C. Jordan investigation for Michigan DNR describes three predominantly sandy aquifers. Shallow sands are well-rounded, well-sorted, fine- to medium-grained quartz with some feldspar (USCS SP), generally with less than 3% fines but locally up to 17%. Gravel, silt and clay lenses create local variation. The upper clay aquitard thins and pinches out near the middle of the study area, where shallow and intermediate aquifers merge. The lower barrier is a variable clay–sand–clay sequence: at MB-4 the upper clay member is absent and only 3 feet of bottom clay was encountered. Its horizontal continuity could not be reliably assessed everywhere. The study describes shallow groundwater moving predominantly northeast, intermediate groundwater north-northwest, and lower-aquifer water east of the municipal wellfield moving west toward the wells. Downward hydraulic gradients, thin clay and pumping provide mechanisms for movement between aquifers.",
    significance: "Historical pathway context, not a confirmed PFAS route to Plett Road. Estimated average groundwater movement of about 200 feet/year shallow and 80 feet/year intermediate is not a PFAS travel-time calculation. A dense gravel-and-silt drilling zone is not automatically an impermeable barrier. Modern water levels, well-screen depths, pumping conditions and chemical data are needed to establish a present-day source-to-receptor connection. The upper clay pinch-out is documented; the lower barrier is not proven absent everywhere.",
    sources: [archivedSource("CADILLAC - WATER- 234880.pdf", "/findings-docs/1988-cadillac-ri-234880.pdf", 169, "August 1988 remedial investigation, FINAL DRAFT. Sand and clay profile: PDF pp. 58–59 and 63 (printed 4-7, 4-8, 4-12); groundwater movement and vertical pathways: PDF p. 98 (printed 6-1). The contents list supporting appendices, but this copy ends with the glossary.", {
      eventStamp: "August 1988 · exact day/time not stated",
      basis: "Title-page publication month",
      note: "Historical VOC/chromium investigation. Groundwater-flow estimates are not contaminant-specific velocities or proof of present-day PFAS transport.",
    })],
  },
  {
    year: "2009",
    date: "2009-09-08",
    isoDate: "2009-09-08",
    time: noTime,
    timeBasis: "Special-meeting date",
    phase: "Leachate service agreement",
    kind: "operation",
    category: "12 · Landfill & leachate",
    title: "Council approves Wexford leachate agreement as Miscellaneous File No. 842",
    finding: "The September 8, 2009 special-meeting minutes record unanimous approval of motion 2009.216 for Cadillac to accept and treat Wexford County Landfill leachate. The approved agreement, identified as Cadillac Miscellaneous File No. 842, was effective July 1, 2009 through June 30, 2011 and used a reduced sliding-scale rate based on pretreatment.",
    significance: "Provides direct official evidence that the City formally approved the landfill-to-WWTP treatment relationship years before the PFAS source investigation. The minutes identify the agreement but do not contain the fully executed agreement or its signed rate schedule.",
    sources: [archivedSource("Miscellaneous File 842 — September 8 2009 Approval Minutes.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/e792937dad5338952723a5b79b1a2f51f9ddae5e/public/findings-docs/008-5b67e1ed1d5c.pdf", 6, "Motion 2009.216 approves miscellaneous file 842 on PDF page 2. These are approval minutes, not the executed agreement.", {
      eventStamp: "2009-09-08 · time not stated",
      basis: "Date of the official special-meeting minutes",
      note: "Separate well-field planning in the same minutes is not characterized as PFAS evidence.",
    })],
  },
  {
    year: "2009",
    date: "2009-11-19",
    isoDate: "2009-11-19",
    time: noTime,
    timeBasis: "Inspection date",
    phase: "Industrial pretreatment reconnaissance",
    kind: "compliance",
    category: "08 · Compliance & enforcement",
    title: "Inspection traces elevated biosolids zinc to Cadillac Castings",
    finding: "MDEQ's post-inspection report says a September 2009 point-source survey found elevated zinc in biosolids and records the plant superintendent's identification of Cadillac Castings as the source. The report calls for a January 15, 2010 compliance submission and stronger permit monitoring for zinc discharge.",
    significance: "Preserves the agency's contemporaneous source-control account and required follow-up. This is zinc and industrial-pretreatment evidence; it does not establish PFAS use, release or attribution.",
    sources: [archivedSource("2009-11-19 - Cadillac WWTP IPP Reconnaissance Post-Inspection Report.pdf", "/compliance-docs/061-87297e8f6401.pdf", 4, "MDEQ post-inspection report for the November 19, 2009 IPP reconnaissance evaluation.", {
      eventStamp: "2009-11-19 · time not stated",
      basis: "Inspection start and end date printed on the report",
      note: "The report records the plant superintendent's source identification; it is not treated as a PFAS finding or independent chemical-source adjudication.",
    })],
  },
  {
    year: "2022",
    date: "2022-08-18",
    isoDate: "2022-08-18",
    time: noTime,
    timeBasis: "EGLE evaluation-letter date",
    phase: "Landfill fiscal and waste-origin review",
    kind: "compliance",
    category: "12 / 13 · Landfill, compliance & enforcement",
    title: "EGLE evaluation identifies financial-assurance shortfall and import questions",
    finding: "EGLE calculated a $131,920.40 perpetual-care fund shortfall for the Wexford County Landfill and asked for a deposit. Re-TRAC data also indicated 2,300 cubic yards from Clare County and 648 cubic yards from Oscoda County that may not have been authorized by the applicable county plans, prompting a written-response request.",
    significance: "Preserves the agency's FY2021 evaluation and compliance questions. The letter requests a response and does not establish a final violation, penalty or adjudication.",
    sources: [archivedSource("2022-09-13 Draft Executive Committee Packet.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/e792937dad5338952723a5b79b1a2f51f9ddae5e/public/findings-docs/009-ef4cb426969a.pdf", 17, "EGLE's August 18, 2022 Wexford County Landfill evaluation appears on PDF pages 13–17.", {
      eventStamp: "2022-08-18 · time not stated",
      basis: "Date printed on the EGLE evaluation letter",
      note: "The surrounding executive packet is dated September 13, 2022; the event date follows the underlying agency letter.",
    })],
  },
  {
    year: "2026",
    date: "2026-07-20",
    isoDate: "2026-07-20",
    time: noTime,
    timeBasis: "Council-packet meeting date",
    phase: "PFAS response infrastructure planning",
    kind: "receptor",
    category: "13 · PFAS response & municipal water",
    title: "Council packet schedules PFAS municipal-water project action",
    finding: "The packet describes an $8.206 million Emerging Contaminants Grant designation and a project plan to extend municipal water service to private-well users in PFAS response areas. It also reports an anticipated federal PFAS grant of approximately $1.7 million.",
    significance: "Documents the response project presented for council action. The included resolution is unsigned with blank vote and certification fields, so the packet alone does not prove adoption, receipt of funds or construction.",
    sources: [archivedSource("Council Packet 7-20-26.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/e792937dad5338952723a5b79b1a2f51f9ddae5e/public/findings-docs/010-1aba682de0b8.pdf", 62, "PFAS update appears on PDF page 7; project communication and unsigned draft resolution appear on pages 45–47.", {
      eventStamp: "2026-07-20 · time not stated",
      basis: "Meeting date printed on the council packet",
      note: "This source records a proposed action and funding designations; it is not an executed resolution or expenditure record.",
    })],
  },
  {
    year: "2018",
    date: "2018-03-28",
    isoDate: "2018-03-28T19:43:42",
    time: "19:43:42 · zone not stated",
    timeBasis: "MiWaters submission history",
    phase: "Annual pretreatment reporting",
    kind: "regulatory",
    category: "11 · Form submission",
    title: "2017 IPP annual report is submitted",
    finding: "MiWaters submission HNB-J69X-W1FHA records Cadillac's annual Industrial Pretreatment Program report for calendar year 2017. The City answered no to local-limit adoption, evaluation or pollutant-list changes and reported no POTW-effluent or biosolids problems during the reporting period; the listed attachments include the SIU/CIU list, oversight table, significant-noncompliance notice and monitoring summary.",
    significance: "Preserves the certified portal record and its attachment inventory without treating the form answers as a substitute for the underlying monitoring and enforcement records.",
    sources: [archivedSource("2018-03-28 - IPP Annual Report Submission HNB-J69X-W1FHA v1.pdf", "/form-submission-docs/form-submission-074-120dbeb59d52.pdf", 2, "Born-digital annual IPP report submission and certification record.", {
      eventStamp: "2018-03-28 19:43:42 · zone not stated",
      basis: "MiWaters status-history entry",
      note: "The event follows the submitted status time printed in the portal record; the attachment upload times are earlier that day.",
    })],
  },
  {
    year: "2026",
    date: "2026-02-27",
    isoDate: "2026-02-27",
    time: noTime,
    timeBasis: "Agency email date",
    phase: "Cyanide exceedance follow-up",
    kind: "compliance",
    category: "08 · Compliance & enforcement",
    title: "EGLE acknowledges Cadillac's cyanide exceedance notice",
    finding: "EGLE thanked Cadillac for providing an NPDES permit-exceedance notification and for running a retest to determine whether an issue remained.",
    significance: "Establishes an agency-acknowledged compliance follow-up before the later cyanide investigation sequence.",
    sources: [archivedSource("2026 Cadillac Cyanide Messages — February 27 agency acknowledgment.pdf", "/compliance-docs/056-7c7c68a98555.pdf", 24, "Page 1 preserves EGLE's acknowledgment of the exceedance notification and planned retest review.", {
      eventStamp: "2026-02-27 · time not stated",
      basis: "Date displayed on the agency email",
      note: "This is the first page of a 24-page chronological source compilation; statements remain attributed to the displayed sender.",
    })],
  },
  {
    year: "2026",
    date: "2026-05-04",
    isoDate: "2026-05-04T14:24:00",
    time: "14:24 · zone not stated",
    timeBasis: "Municipal email sent time",
    phase: "Cyanide resampling",
    kind: "compliance",
    category: "08 · Compliance & enforcement",
    title: "Cadillac reports repeat high cyanide results",
    finding: "Cadillac told EGLE that its April cyanide sample was higher than normal, the resample remained high and additional plant and upstream samples were collected. A later message in the sequence says the added samples did not identify a source and raises possible laboratory error while committing to duplicate and upgradient sampling.",
    significance: "Preserves the City's contemporaneous uncertainty and follow-up plan; the messages do not support treating the April result as either confirmed source attribution or proven laboratory error.",
    sources: [{
      ...archivedSource("2026 Cadillac Cyanide Messages — May 4 exceedance and resampling.pdf", "/compliance-docs/056-7c7c68a98555.pdf", 24, "Pages 2–4 preserve the initial notification, follow-up sampling account and EGLE acknowledgment.", {
        eventStamp: "2026-05-04 14:24 · zone not stated",
        basis: "Sent time printed on the municipal email",
        note: "The event retains the uncertainty expressed in the source rather than resolving it retrospectively.",
      }),
      page: 2,
      preview: bundledPublicAsset("/source-previews/056-7c7c68a98555-p2.jpg"),
      previewPage: 2,
    }],
  },
  {
    year: "2026",
    date: "2026-06-12",
    isoDate: "2026-06-12T12:00:00",
    time: "12:00 · zone not stated",
    timeBasis: "Municipal email sent time",
    phase: "Industrial-user source investigation",
    kind: "compliance",
    category: "08 · Compliance & enforcement",
    title: "Cadillac identifies Cadillac Casting in the cyanide inquiry",
    finding: "Cadillac told EGLE that it was still experiencing cyanide issues, stated that it had pinpointed the source to Cadillac Casting and said the industrial user had been put on notice. The related exchange shows Cadillac Casting asking for data and arranging additional testing.",
    significance: "Documents the City's source-identification statement and immediate industrial-user response. The entry attributes that conclusion to Cadillac and does not present the email as an independent agency finding.",
    sources: [{
      ...archivedSource("2026 Cadillac Cyanide Messages — June 12 source inquiry.pdf", "/compliance-docs/056-7c7c68a98555.pdf", 24, "Pages 5–8 preserve the Cadillac Casting exchange, the City's statement to EGLE and EGLE's acknowledgment.", {
        eventStamp: "2026-06-12 12:00 · zone not stated",
        basis: "Sent time printed on Cadillac's email to EGLE",
        note: "The record is a correspondence sequence; source attribution is stated by the City and is not recast as an adjudicated determination.",
      }),
      page: 5,
      preview: bundledPublicAsset("/source-previews/056-7c7c68a98555-p5.jpg"),
      previewPage: 5,
    }],
  },
  {
    year: "2026",
    date: "2026-06-19",
    isoDate: "2026-06-19T12:41:00",
    time: "12:41 · zone not stated",
    timeBasis: "Industrial-user email sent time",
    phase: "Industrial-user sampling",
    kind: "sampling",
    category: "06 · Lab results & sampling",
    title: "Industrial sample reports 3.5 mg/L cyanide",
    finding: "The correspondence package includes a Trace Analytical result for a Cadillac Casting plant-weir sample collected June 17 and an email in which Cadillac states that the reported 3.5 mg/L result is above the City's stated 4 µg/L local limit.",
    significance: "Preserves the reported result, sampling point and unit comparison in the source sequence; it does not substitute for the complete industrial-user enforcement file or resolve later corrective action.",
    sources: [{
      ...archivedSource("2026 Cadillac Cyanide Messages — June 17 plant-weir result.pdf", "/compliance-docs/056-7c7c68a98555.pdf", 24, "Pages 11–15 contain the Trace report exchange and Cadillac's stated comparison with the local limit.", {
        eventStamp: "Sample collected 2026-06-17 15:15; email sent 2026-06-19 12:41 · zone not stated",
        basis: "Laboratory collection field and industrial-user email sent time",
        note: "The event date follows the correspondence that transmitted and discussed the result; the sample collection date is preserved separately.",
      }),
      page: 13,
      preview: bundledPublicAsset("/source-previews/056-7c7c68a98555-p13.jpg"),
      previewPage: 13,
    }],
  },
  {
    year: "2026",
    date: "2026-07-01",
    isoDate: "2026-07-01T15:02:00",
    time: "15:02 · zone not stated",
    timeBasis: "Notice email sent time",
    phase: "Industrial-user enforcement",
    kind: "compliance",
    category: "08 · Compliance & enforcement",
    title: "Cadillac sends a cyanide notice of violation",
    finding: "Cadillac emailed an official cyanide notice of violation to Cadillac Casting and said a paper copy would also be mailed. The industrial user confirmed receipt and reported that its samples from the prior week were good.",
    significance: "Establishes transmission and acknowledgment of the municipal notice while keeping the industrial user's later sampling statement separate from an agency compliance determination.",
    sources: [{
      ...archivedSource("2026 Cadillac Cyanide Messages — July 1 notice and receipt.pdf", "/compliance-docs/056-7c7c68a98555.pdf", 24, "Pages 21–22 preserve the planned transmission, emailed notice and industrial-user receipt acknowledgment.", {
        eventStamp: "2026-07-01 15:02 · zone not stated",
        basis: "Sent time printed on the notice email",
        note: "The compiled source contains the correspondence around the notice; the underlying signed notice should be reviewed separately if available.",
      }),
      page: 22,
      preview: bundledPublicAsset("/source-previews/056-7c7c68a98555-p22.jpg"),
      previewPage: 22,
    }],
  },
  {
    year: "2026",
    date: "2026-07",
    isoDate: "2026-07",
    time: noTime,
    timeBasis: "Report month",
    phase: "Wastewater asset reporting",
    kind: "operation",
    category: "10 · Process & site documents",
    title: "Asset report records system condition and planned work",
    finding: "Cadillac's July report summarizes 2025–2026 wastewater asset activities, a 3.2 MGD design flow and 1.8 MGD average flow, 13 lift stations, 60.3 miles of gravity sewer and planned operations, maintenance and replacement work. It reports $5,635,500 in anticipated upcoming expenditures and $5,639,000 in annual revenue.",
    significance: "Adds the underlying operating, condition and financial summary to the event trace; the figures are reported by the City and are not independently audited in this record.",
    sources: [archivedSource("2026-07 - Cadillac Wastewater Asset Management Report.pdf", "/process-site-docs/process-site-016-5d332dd173ef.pdf", 3, "Three-page report covering 2025–2026 wastewater asset activities and the upcoming work program.", {
      eventStamp: "2026-07 · exact day/time not stated",
      basis: "Report month printed on the document",
      note: "The month-level event stamp is retained because the report does not print a specific issue day.",
    })],
  },
  {
    year: "2026",
    date: "2026-07-24",
    isoDate: "2026-07-24T08:10:06-04:00",
    time: "08:10:06 EDT",
    timeBasis: "MiEnviro digital signature",
    phase: "Asset-management submission",
    kind: "regulatory",
    category: "11 · Form submission",
    title: "Asset-management annual report is submitted",
    finding: "MiEnviro submission HQQ-9FG9-RCPF3 records the Asset Management Annual Report for Cadillac WWTP and lists the 2025–2026 asset report, rate information, sanitary sewer map, sewer rates and the initial 2026–2031 capital-program draft as attachments.",
    significance: "Establishes the certified portal submission and its attachment set without treating the attachment list as proof that every proposed capital project was approved or completed.",
    sources: [archivedSource("2026-07-24 - Asset Management Annual Report Submission HQQ-9FG9-RCPF3 v1.pdf", "/form-submission-docs/form-submission-075-6f3e801807fe.pdf", 2, "Born-digital MiEnviro submission record, attachment list and certification statement.", {
      eventStamp: "2026-07-24 08:10:06 EDT",
      basis: "MiEnviro digital signature and printed page timestamp",
      note: "The five attachment upload entries are stamped 08:07, shortly before the signed submission.",
    })],
  },
  {
    year: "2026",
    date: "2026-08-20",
    isoDate: "2026-08-20",
    time: noTime,
    timeBasis: "City-letter date",
    phase: "Local-limits approval request",
    kind: "regulatory",
    category: "09 · Correspondence & letters",
    title: "Cadillac requests approval of local limits",
    finding: "Cadillac asked EGLE to approve the maximum allowable headworks loading limits in Table 11 of its report and referred to the City's May 21 request.",
    significance: "Documents a municipal request for agency action; the letter is not described as an approval or final EGLE determination.",
    sources: [archivedSource("2026-08-20 - Cadillac Letter Requesting EGLE Approval of Local Limits.pdf", "/correspondence-docs/corr-036-139ab8b49931.pdf", 1, "Signed one-page City request for EGLE review and approval of the Table 11 limits.", {
      eventStamp: "2026-08-20 · time not stated",
      basis: "Date printed on the City letter",
      note: "The source records the request; a separate agency response is needed to establish approval status.",
    })],
  },
  {
    year: "2026",
    date: "2026-09-02",
    isoDate: "2026-09-02",
    time: noTime,
    timeBasis: "Date printed on the EGLE letter",
    phase: "Local-limits review",
    kind: "regulatory",
    category: "04 / 08 · Industrial pretreatment & compliance",
    title: "EGLE finds three proposed toxic local limits approvable",
    finding: "EGLE reviewed Cadillac's January 2026 local-limit evaluation, revisions through June 26 and August 20 program-revision request. WRD found proposed daily maximum local limits of 0.6 µg/L for benzidine, 17 µg/L for beryllium and 1,737 µg/L for phenol approvable.",
    significance: "Advances the SVN-01952 corrective-action record but is not final approval. EGLE requires an attorney certification and certified adopted legal authorities by December 31, 2026, and says its review did not include worker-health-and-safety compliance under 40 CFR 403.5(b)(7).",
    sources: [archivedSource("2026-09-02 - EGLE Follow-up to SVN-01952 - Local Limits.pdf", "/compliance-docs/065-b2448afb1ecd.pdf", 2, "Signed EGLE follow-up identifying three approvable toxic local limits and the remaining conditions for final approval.", {
      eventStamp: "2026-09-02 · time not stated",
      basis: "Date printed on the EGLE letter",
      created: "2026-09-02 13:18:54 EDT",
      modified: "2026-09-02 13:18:54 EDT",
      note: "The letter supplies no event time; embedded metadata records the file-production time later that day.",
    })],
  },
  {
    year: "2016",
    date: "2016-11-03",
    isoDate: "2016-11-03",
    time: noTime,
    timeBasis: "Activity date printed in the AQD report",
    phase: "Industrial-site closure record",
    kind: "regulatory",
    category: "08 · Compliance & enforcement",
    title: "AQD records closure of the former Western Concrete operation",
    finding: "An AQD activity report states that the concrete operation at 510 Fifth Street was closed, its equipment had been removed and AAR Mobility was using the building for pallet storage. The inspector recommended voiding the Western Concrete air permits.",
    significance: "Preserves a dated industrial-site history entry. The report does not document PFAS use, a PFAS release or a source-to-receptor pathway.",
    sources: [archivedSource("N0358 Scheduled Inspection Activity Report — Western Concrete.pdf", "/compliance-docs/057-9c1d000fd0af.pdf", 1, "One-page AQD activity report documenting the closed operation, removed equipment, later building use and permit status.", {
      eventStamp: "2016-11-03 · time not stated",
      basis: "Activity date printed in the AQD report",
      note: "The record is retained as site history and is not treated as evidence of PFAS use or release.",
    })],
  },
  {
    year: "2022",
    date: "2022-06-29",
    isoDate: "2022-06-29",
    time: noTime,
    timeBasis: "Inspection date printed in the AQD report",
    phase: "Landfill air-program inspection",
    kind: "regulatory",
    category: "12 · Landfill & leachate",
    title: "AQD documents landfill gas controls and deep-well leachate disposal",
    finding: "AQD's scheduled inspection records an active gas collection and flare system and a March 2022 nonmethane-organic-compound estimate of 32.33 megagrams per year. The report states that a deep injection well was installed in 2018 and that leachate was no longer trucked or evaporated.",
    significance: "Provides agency inspection evidence for the timing of a landfill leachate-management change. It does not establish PFAS concentrations or source attribution.",
    sources: [archivedSource("N3862 Scheduled Inspection Activity Report — Wexford County Landfill.pdf", "/compliance-docs/058-5b4f4183c1fc.pdf", 4, "Four-page AQD activity report covering gas collection, flare operation, NMOC reporting and the inspector's leachate-disposal account.", {
      eventStamp: "2022-06-29 · time not stated",
      basis: "Inspection date printed in the AQD report",
      note: "The leachate statement is attributed to the AQD inspection record; it is not expanded into a PFAS finding.",
    })],
  },
  {
    year: "2025",
    date: "2025-11-26",
    isoDate: "2025-11-26T09:18:00-05:00",
    time: "09:18 EST",
    timeBasis: "Email timestamp printed on the cover message",
    phase: "Agency results transmittal",
    kind: "sampling",
    category: "04 / 09 · PFAS monitoring & correspondence",
    title: "EGLE transmits the October effluent PFAS results",
    finding: "EGLE's cover email states that the October 22 effluent sample was in compliance with the five PFAS compounds having Water Quality Values and that the result package was uploaded to MiEnviro evaluation E-45504.",
    significance: "Preserves the agency's stated interpretation and portal disposition. The analytical values remain tied to the October 22 laboratory event and are not counted as a second sampling event.",
    sources: [archivedSource("October 2025 PFAS sample results — EGLE cover email and attachments.pdf", "/correspondence-docs/corr-037-1a12e67c31b1.pdf", 41, "Composite transmittal retained for its distinct cover email; pages 2–35 reproduce analytical attachments already represented elsewhere in the source library.", {
      eventStamp: "2025-11-26 09:18 EST",
      basis: "Email timestamp printed on the cover message",
      note: "The event records the transmittal and agency statement; it does not duplicate the October 22 sampling event.",
    })],
  },
  {
    year: "2026",
    date: "2026-08-19",
    isoDate: "2026-08-19T06:23:00-04:00",
    time: "06:23 EDT",
    timeBasis: "Report-generation timestamp printed in the certified DMR",
    phase: "Monthly DMR certification",
    kind: "compliance",
    category: "01 · DMR & QA",
    title: "July 2026 DMR is certified without reported exceedances",
    finding: "The certified July 2026 DMR summary reports zero exceedances and includes no DMR comments. Its generated daily and summary records preserve the monthly monitoring endpoint for permit MI0020257.",
    significance: "Adds the certified July reporting record while keeping it separate from earlier cyanide notices and other event-specific correspondence.",
    sources: [archivedSource("MI0020257 July 2026 Discharge Monitoring Report.pdf", "/dmr-docs/272-6251fd5c146e.pdf", 17, "Certified daily and summary DMR package for July 1–31, 2026.", {
      eventStamp: "2026-08-19 06:23 EDT",
      basis: "Report-generation timestamp printed on the DMR cover and pages",
      note: "The summary reports zero exceedances; that statement is not used to negate separate incident or industrial-user records.",
    })],
  },
  {
    year: "1977",
    date: "1977-04-29",
    isoDate: "1977-04-29",
    time: noTime,
    timeBasis: "Award date printed in the EPA grant register",
    phase: "Federal treatment-works funding",
    kind: "regulatory",
    category: "10 / 19 · Funding, construction & technical records",
    title: "EPA awards Cadillac $4.719 million for treatment works",
    finding: "EPA's April 1977 construction-grant register records continuation grant 262523-03-0 to the City of Cadillac, with a $4,719,150 award and $6,292,200 in eligible project costs for an increase in treatment capacity.",
    significance: "Provides the contemporaneous federal award record behind the major treatment-works construction later described in wastewater-service litigation.",
    sources: [archivedSource("EPA April 1977 Wastewater Treatment Construction Grant Awards.pdf", "/findings-docs/140-e190873ad45d.pdf", 138, "Cadillac's project record appears on PDF page 68, printed page 60.", {
      eventStamp: "1977-04-29 · time not stated",
      basis: "Award date printed on the Cadillac project record",
      note: "The award register establishes the listed grant action and amount; it does not by itself establish project completion or later operating performance.",
    })],
  },
  {
    year: "1983",
    date: "1983-12",
    isoDate: "1983-12",
    time: noTime,
    timeBasis: "EPA report publication month",
    phase: "Historic POTW operating benchmark",
    kind: "operation",
    category: "10 / 19 · Process & technical literature",
    title: "EPA proceedings publish Cadillac WWTP operating data",
    finding: "A treatment-optimization paper in EPA's December 1983 proceedings includes Cadillac among eight Michigan audit sites, lists a 2.0 MGD design capacity and 10,200-person service area, and reports a 52 percent electricity and 48 percent natural-gas energy split. Its Cadillac figure summarizes operating data from March 1976 through September 1978.",
    significance: "Preserves a contemporaneous technical benchmark for the plant's historical configuration and energy use without treating it as PFAS evidence or a measure of later performance.",
    sources: [archivedSource("EPA Operation and Maintenance of Publicly Owned Treatment Works Conference Proceedings.pdf", "/findings-docs/141-ffb3658949f7.pdf", 268, "Paper 16 begins on PDF page 218; Cadillac-specific tables and the operating-data figure appear on pages 229–237.", {
      eventStamp: "1983-12 · exact day/time not stated",
      basis: "Publication month printed on the EPA proceedings cover",
      note: "The underlying conference occurred January 12–14, 1982; the event date follows the published source record.",
    })],
  },
  {
    year: "1999",
    date: "1999-07-02",
    isoDate: "1999-07-02",
    time: noTime,
    timeBasis: "Court-opinion date",
    phase: "Wastewater-service contract interpretation",
    kind: "regulatory",
    category: "10 · Wastewater agreements & capacity",
    title: "Court affirms the 1977 wastewater service-area scope",
    finding: "The Michigan Court of Appeals affirmed the trial court's interpretation that Cadillac had to accept wastewater from service districts 1 through 5 and part of district 11 contemplated by the facilities plan, subject to the negotiated 360,000-gallon contractual limit.",
    significance: "Defines the judicially affirmed geographic and capacity scope of the historic County-to-City wastewater relationship.",
    sources: [archivedSource("Michigan Court of Appeals — County of Wexford v City of Cadillac, No. 205933.pdf", "/findings-docs/137-ecd87ef13168.pdf", 3, "The holding and service-district discussion appear on PDF pages 1–3.", {
      eventStamp: "1999-07-02 · time not stated",
      basis: "Date printed on the unpublished appellate opinion",
      note: "The event states the opinion's holding and does not extend it beyond the contract and districts discussed by the court.",
    })],
  },
  {
    year: "2007",
    date: "2007-08-30",
    isoDate: "2007-08-30",
    time: noTime,
    timeBasis: "Binding-commitment date in the state report",
    phase: "State revolving fund commitment",
    kind: "regulatory",
    category: "10 · Public finance & infrastructure",
    title: "State report records $3.87 million Cadillac WWTP commitment",
    finding: "Michigan's FY2018 State Revolving Fund report lists Cadillac project 5277-01 for wastewater-treatment-plant and pump-station improvements in Wexford County, with a binding commitment of $3,870,000 dated August 30, 2007.",
    significance: "Adds an official funding trace for plant and pump-station improvements while keeping the historical commitment separate from construction-completion evidence.",
    sources: [archivedSource("Michigan FY2018 State Revolving Fund Annual Report.pdf", "/findings-docs/143-be8756e643c5.pdf", 82, "Cadillac project 5277-01 appears on PDF pages 38 and 68; page 68 gives the binding-commitment date and amount.", {
      eventStamp: "2007-08-30 · time not stated",
      basis: "Binding-commitment date in the funded-project table",
      note: "The source is a later official annual report reproducing the 2007 commitment; it does not establish the work's completion date.",
    })],
  },
  {
    year: "2010",
    date: "2010-10-12",
    isoDate: "2010-10-12",
    time: noTime,
    timeBasis: "Court-opinion date",
    phase: "Wastewater-service contract expiration",
    kind: "regulatory",
    category: "10 · Wastewater agreements & capacity",
    title: "Court upholds the May 2017 wastewater-contract expiration",
    finding: "The Michigan Court of Appeals affirmed that Cadillac's 1977 and 1980 contracts with Haring, Selma and Clam Lake govern the City's wastewater-service duties and expire on May 12, 2017. The opinion rejected a continuing duty based on treatment-system design life or public-utility status.",
    significance: "Establishes the published appellate interpretation of the agreements' duration before their stated expiration date.",
    sources: [archivedSource("Michigan Court of Appeals — Haring, Selma and Clam Lake v City of Cadillac, Nos. 292122 and 292164.pdf", "/findings-docs/138-5c29ab75dc0e.pdf", 14, "The facts and contract dates appear on pages 2–5; the holding appears on pages 12–14.", {
      eventStamp: "2010-10-12 · time not stated",
      basis: "Opinion date printed on page 1",
      note: "The opinion was approved for publication on November 23, 2010; the event date follows the judicial decision date.",
    })],
  },
  {
    year: "2012",
    date: "2012-08-23",
    isoDate: "2012-08-23",
    time: noTime,
    timeBasis: "Court-opinion date",
    phase: "Additional wastewater capacity",
    kind: "regulatory",
    category: "10 · Wastewater agreements & capacity",
    title: "Court affirms Haring's right to 0.121 MGD of added capacity",
    finding: "The Michigan Court of Appeals affirmed the order requiring Cadillac to sell Haring Township 0.121 MGD of wastewater-treatment capacity under the 1980 contract. It also affirmed that future service expansions must remain within the boundary shown in the contract's Exhibit A.",
    significance: "Preserves the appellate capacity determination and service-area boundary that governed the parties' pre-expiration wastewater relationship.",
    sources: [archivedSource("Michigan Court of Appeals — Haring Charter Township v City of Cadillac, No. 299683.pdf", "/findings-docs/139-b8fc380e3939.pdf", 7, "The capacity holding begins on page 1 and the service-boundary holding concludes on page 7.", {
      eventStamp: "2012-08-23 · time not stated",
      basis: "Date printed on the unpublished appellate opinion",
      note: "The event reports the affirmed order and does not treat the expert scenarios discussed in the opinion as current plant capacity.",
    })],
  },
  {
    year: "2025",
    date: "2025-06-16",
    isoDate: "2025-06-16",
    time: noTime,
    timeBasis: "Council-communication date",
    phase: "Tertiary-filter maintenance",
    kind: "operation",
    category: "10 · Process & site infrastructure",
    title: "Plant reports failure points at all three tertiary filters",
    finding: "A council communication states that all three AquaDisc tertiary filters were failing at pipe penetrations, that replacement parts had been ordered and that plant staff considered the repair urgent. The attached proposal quotes $11,137 for installation work.",
    significance: "Documents the filter condition and proposed repair one year before a June 2026 DMR comment attributed a CBOD exceedance to a tertiary-filter failure.",
    sources: [archivedSource("Cadillac WWTP Tertiary Filter Pipe Replacement.pdf", "/findings-docs/142-e631ea6ceff8.pdf", 3, "The June 16 council communication is on page 1; the contractor proposal is on pages 2–3.", {
      eventStamp: "2025-06-16 · time not stated",
      basis: "Date printed on the council communication",
      note: "The packet recommends authorization and includes a proposal; it does not establish the council vote, contract execution or completed repair.",
    })],
  },
  {
    year: "2026",
    date: "2026-07-20",
    isoDate: "2026-07-20T13:22:06",
    time: "13:22:06 · zone not stated",
    timeBasis: "DMR submission timestamp",
    phase: "June DMR certification",
    kind: "compliance",
    category: "01 / 08 · DMR, compliance & enforcement",
    title: "June DMR reports cyanide and CBOD exceedances",
    finding: "Cadillac's certified June DMR reports available-cyanide values of 0.917 against a 0.16 maximum monthly average and 47.50 against a 5.9 maximum monthly average, with comments attributing them to an industrial discharge. It also reports CBOD5 at 12.30 against a 10 maximum daily limit and comments that a tertiary-filter failure was reported to EGLE.",
    significance: "Links the certified monthly compliance record to the contemporaneous industrial-discharge inquiry and identifies a separate treatment-process failure in the same reporting period.",
    sources: [archivedSource("MI0020257 June 2026 Discharge Monitoring Report.pdf", "/dmr-docs/037-f1501daa350b.pdf", 16, "The reported exceedances and DMR value comments appear on PDF page 15; the submission certification appears on page 16.", {
      eventStamp: "2026-07-20 13:22:06 · zone not stated",
      basis: "Submission timestamp printed on the certification page",
      note: "The event follows the certified DMR summary and keeps the reported industrial-discharge and tertiary-filter comments distinct.",
    })],
  },
  {
    year: "2012",
    date: "2012-07-16",
    isoDate: "2012-07-16",
    time: noTime,
    timeBasis: "Source filename and PDF metadata; signature date is blank",
    phase: "Plett Road infrastructure planning",
    kind: "operation",
    category: "10 / 19 · Infrastructure & maps",
    title: "Plett project agreement places plans and specifications on file",
    finding: "A two-page Road Commission–City agreement form describes the Plett Road/13th Street roundabout and box-culvert project, places the plans and specifications on file with the City and assigns construction and cost responsibilities.",
    significance: "Adds dated infrastructure context at the Plett Road crossing. The supplied copy is unsigned with blank signature and agreement-date lines, so it does not establish that the agreement was executed.",
    sources: [{
      name: "2012 Road Commission–City Plett Road Project Agreement.pdf",
      url: "/findings-docs/147-501cb6326dac.pdf",
      preview: bundledFirstPagePreview("/findings-docs/147-501cb6326dac.pdf"),
      pages: 2,
      format: "PDF",
      role: "Primary source",
      result: "Two-page project agreement form; both supplied filenames resolve to this same exact binary.",
      clock: {
        eventStamp: "2012-07-16 · time not stated",
        basis: "Source filename and PDF creation metadata",
        created: "2012-07-16 11:43:48 EDT",
        modified: "2012-07-16 11:43:58 EDT",
        note: "All date and signature lines in the supplied copy are blank. The record is not described as signed or executed.",
      },
    }],
  },
  {
    year: "2026",
    date: "2026-04-24",
    isoDate: "2026-04-24",
    time: noTime,
    timeBasis: "Issue date printed on the City news release",
    phase: "Flood response",
    kind: "receptor",
    category: "06 / 13 · Sampling, groundwater & wells",
    title: "City routes flooded-well testing to the 1121 Plett laboratory",
    finding: "Cadillac's post-flood release tells residents whose private wells were flooded that drinking-water sampling kits are available from the City laboratory at 1121 Plett Road. It also reports that observed flooding was associated mainly with lake and swamp conditions rather than a burst sewer, broken water main or damaged lift station.",
    significance: "Documents the laboratory's public-health role and the City's stated infrastructure assessment during the flood response. The release contains no PFAS result and does not establish a contaminant source or migration route.",
    sources: [{
      name: "City of Cadillac April 2026 Flood News Release.pdf",
      url: "/findings-docs/148-c1f66e091159.pdf",
      preview: bundledFirstPagePreview("/findings-docs/148-c1f66e091159.pdf"),
      pages: 5,
      format: "PDF",
      role: "Primary source",
      result: "Five-page City release with the April 24 update and two pages of response photographs.",
      clock: {
        eventStamp: "2026-04-24 · time not stated",
        basis: "Issue date printed on the news release",
        note: "The City release is emergency-response context. It is not treated as a laboratory report or PFAS finding.",
      },
    }],
  },
  {
    year: "2019",
    date: "2019-03-18",
    isoDate: "2019-03-18",
    time: noTime,
    timeBasis: "Date of the official City work session",
    phase: "Receiving-cessation planning",
    kind: "operation",
    category: "10 / 12 · Process, landfill & leachate",
    title: "City anticipates leachate revenue ending with the deep well",
    finding: "Cadillac's budget work-session minutes state that leachate revenue remained above budget but was expected to end when the landfill's deep injection well went online. The City planned to reinvest any interim revenue in the water and sewer system.",
    significance: "Documents the City's March 2019 expectation that landfill deliveries would cease. The minutes do not identify the final load date, gallons, manifests, invoices or WWTP receiving-log entries.",
    sources: [{
      name: "March 18 2019 Cadillac City Council Work Session Minutes.pdf",
      url: "/findings-docs/152-4335077ddaf4.pdf",
      preview: bundledFirstPagePreview("/findings-docs/152-4335077ddaf4.pdf"),
      pages: 4,
      page: 3,
      format: "PDF",
      role: "Primary source",
      result: "The leachate-revenue and deep-injection-well statement appears on PDF page 3.",
      clock: {
        eventStamp: "2019-03-18 · time not stated",
        basis: "Date printed on the official work-session minutes",
        note: "The statement is a budget-planning expectation and is not promoted to the exact final receiving date.",
      },
    }],
  },
  {
    year: "2025",
    date: "2025-01",
    isoDate: "2025-01",
    time: noTime,
    timeBasis: "Month printed on the MPART FAQ",
    phase: "Agency public-information update",
    kind: "regulatory",
    category: "04 / 12 · PFAS monitoring, landfill & leachate",
    title: "MPART confirms the landfill source and summer 2019 cessation",
    finding: "MPART's January 2025 FAQ identifies Wexford County Landfill as Cadillac's industrial PFOS source and states that the City ceased accepting landfill discharge in summer 2019. It also summarizes public-water and private-well response information for the Cadillac Industrial Park investigation.",
    significance: "Adds a later official agency account of source identification and cessation while preserving its stated season-level precision; the FAQ does not establish the exact final load date or quantity.",
    sources: [{
      name: "MPART Cadillac Industrial Park Area of Interest FAQ.pdf",
      url: "/findings-docs/156-2944aeb34f99.pdf",
      preview: bundledFirstPagePreview("/findings-docs/156-2944aeb34f99.pdf"),
      pages: 12,
      page: 9,
      format: "PDF",
      role: "Primary source",
      result: "Question 18 on PDF page 9 contains the source-identification and summer 2019 cessation statements.",
      clock: {
        eventStamp: "2025-01 · exact day/time not stated",
        basis: "Publication month printed on the FAQ",
        note: "The event retains the source's month-level publication date and season-level cessation statement.",
      },
    }],
  },
  {
    year: "2025",
    date: "2025-09-10",
    isoDate: "2025-09-10",
    time: noTime,
    timeBasis: "Latest sampling date stated in the MPART procedure",
    phase: "AOI drinking-water comparability sampling",
    kind: "receptor",
    category: "04 / 06 / 13 · PFAS monitoring, lab results & wells",
    title: "EGLE AOI multi-agency testing compares EGLE, Merit and Cyclopure results",
    finding: "MPART's September 9–10 side-by-side study used EGLE, Merit and Cyclopure methods at 20 Cadillac-area properties. The 1140 Plett Road packet preserves nine primary same-day method-and-condition comparisons, an EGLE duplicate and two earlier result sets across unflushed indoor, three-minute-flushed indoor and outdoor samples. Its summary reports PFOA from 19.3 to 35 ng/L and PFOS from 9.3 to 19 ng/L. The complete report marks PFOA drinking-water-criteria exceedances at anonymized addresses 5, 8, 11 and 20 and PFOS exceedances at address 11.",
    significance: "Strengthens the repeated receptor-testing record with multiple laboratories and sampling conditions while preserving the study's own limit: the report states that this sampling was not intended as a PFAS source investigation. The packet does not supply chain-of-custody forms or the complete 49-page EGLE Work Order 2509147, execute the proposed Plett Road resolution, identify the exact final leachate delivery or prove a source-to-Plett migration pathway.",
    sources: [
      archivedSource("EGLE AOI Multi-Agency Testing — EGLE, Merit and Cyclopure — 1140 Plett Road.pdf", "/pfas-docs/098-044977305e5f.pdf", 24, "Source packet with a side-by-side results table, available EGLE Work Order 2509147 pages, Merit reports, Cyclopure reports and the October 15, 2025 EGLE transmittal letter.", {
        eventStamp: "2025-09-10 · attached reports show collection times from 08:00 through 08:52",
        basis: "Collection date and times printed on the Merit and Cyclopure report pages",
        created: "2025-11-08 09:11:33 EST",
        modified: "2025-11-08 09:11:33 EST",
        note: "The packet preserves multiple result sets for 1140 Plett Road but contains only selected pages from the 49-page EGLE work order and no chain-of-custody form.",
      }),
      archivedSource("MPART Study to Determine Comparability of PFAS Drinking Water Samples in Cadillac, Michigan.pdf", "/pfas-docs/055-ae1a7fc25cfe.pdf", 29, "The procedure and limitation appear on PDF pages 3–8; the supplied address-table images match PDF pages 14, 17, 20, 21, 27 and 29.", {
        eventStamp: "2025-09-10 · time not stated",
        basis: "Latest of the September 9–10 sampling dates stated on PDF page 4",
        created: "2025-11-05 18:25:01 EST",
        modified: "2025-11-09 19:54:36 EST",
        note: "The event date follows the sampling activity. The report was published in November 2025 and explicitly says the study was not intended as a PFAS source investigation.",
      }),
      archivedSource("Cadillac PFAS Area Maps.pdf", "/findings-docs/122-e9b5255695c3.pdf", 7, "AECOM Figure 3 on PDF page 5 is the official base map reused in the supplied annotated 1140 Plett image.", {
        eventStamp: "2025-09-03 · time not stated",
        basis: "Drawn and approved date printed on AECOM Figure 3",
        note: "The official map symbols provide spatial response context. Added boundary shading and callouts in the supplied PNG are treated as annotations, not independent agency findings.",
      }),
    ],
  },
];

const meta: Record<Kind, { label: string; icon: typeof Factory }> = {
  operation: { label: "Operation", icon: Factory },
  regulatory: { label: "Regulatory", icon: Landmark },
  sampling: { label: "Source / pathway result", icon: FlaskConical },
  compliance: { label: "Compliance", icon: FileSearch },
  receptor: { label: "Receptor result", icon: Waves },
  gap: { label: "Evidence gap", icon: AlertTriangle },
};

type EvidenceChainNode = {
  id: string;
  kind: Kind;
  heading: string;
  authority: string;
  handoff: string;
  eventTitle: string;
  requestId: string;
  boundary: string;
  status: "held" | "handoff" | "open";
};

const eventAnchor = (title: string) => `event-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

const evidenceChain: readonly EvidenceChainNode[] = [
  {
    id: "source-direction",
    kind: "regulatory",
    heading: "Agency direction",
    authority: "EGLE directs PFAS source evaluation and reduction",
    handoff: "Directs the City’s screening and source-sampling work.",
    eventTitle: "EGLE directs PFAS source evaluation and reduction",
    requestId: "wwtp-treatment-discharge",
    boundary: "Direction is not itself a sample result or a source determination.",
    status: "held",
  },
  {
    id: "source-receiving",
    kind: "sampling",
    heading: "Source and receiving record",
    authority: "Wexford leachate shows a strong PFAS burden",
    handoff: "Links the source sample to the existing landfill-to-WWTP receiving record.",
    eventTitle: "Wexford leachate shows a strong PFAS burden",
    requestId: "receiving-history",
    boundary: "Source chemistry is not mixed main-WWTP influent and does not reconstruct loads.",
    status: "held",
  },
  {
    id: "agency-determination",
    kind: "regulatory",
    heading: "Agency determination",
    authority: "DEQ approves reports and acknowledges a confirmed source",
    handoff: "Carries the screened-source record into corrective-action and cessation reporting.",
    eventTitle: "DEQ approves reports and acknowledges a confirmed source",
    requestId: "wwtp-treatment-discharge",
    boundary: "The determination does not close the paired influent/effluent/sludge or operating-log requests.",
    status: "handoff",
  },
  {
    id: "cessation-transition",
    kind: "operation",
    heading: "Cessation and transition",
    authority: "Submitted report: landfill source status “PFOS eliminated” through deep-well injection",
    handoff: "Moves the record from source-status reporting to the later receptor-monitoring question.",
    eventTitle: "Submitted report: landfill source status “PFOS eliminated” through deep-well injection",
    requestId: "receiving-history",
    boundary: "This is a submitted source-status statement, not a laboratory finding that all WWTP PFOS was eliminated; the final load remains open.",
    status: "handoff",
  },
  {
    id: "receptor-series",
    kind: "receptor",
    heading: "Receptor series",
    authority: "PFAS detected at 1140 Plett Road",
    handoff: "Connects the receptor result to the separate AOI comparability and custody requests.",
    eventTitle: "PFAS detected at 1140 Plett Road",
    requestId: "plett-receptor-series",
    boundary: "Repeated receptor results do not establish a source-to-Plett pathway without coordinates, custody and hydrogeologic measurements.",
    status: "open",
  },
  {
    id: "pathway-handoff",
    kind: "gap",
    heading: "Hydrogeologic handoff",
    authority: "Sand aquifers, clay barriers and groundwater pathways",
    handoff: "Defines the historical framework for the still-needed local gradient, hydraulic tests and flow map.",
    eventTitle: "Sand aquifers, clay barriers and groundwater pathways",
    requestId: "subsurface-pathway",
    boundary: "Historical pathway context is not a current site-specific potentiometric map or proof of migration.",
    status: "open",
  },
];

function SourceButton({ source, open }: { source: Source; open: (source: Source) => void }) {
  const linked = Boolean(source.url);
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewUrl = sourcePreviewUrl(source) ?? (source.url ? bundledFirstPagePreview(source.url) : undefined);
  const previewAvailable = Boolean(previewUrl && !previewFailed);
  const displayName = formatSourceDisplayName(source.displayName ?? source.name, source.format, linked);
  const mediaKind = sourceMediaKind(source.format);

  const formatIcon = mediaKind === "html"
    ? <FileCode2 />
    : mediaKind === "image"
      ? <FileImage />
      : mediaKind === "spreadsheet"
        ? <FileSpreadsheet />
        : mediaKind === "archive"
          ? <FileArchive />
          : <FileText />;

  const triggerContents = (
    <>
      <span className={`source-thumbnail source-thumbnail--${mediaKind}`} aria-hidden="true">
        {previewAvailable
          ? <img src={previewUrl} alt="" loading="lazy" decoding="async" onError={() => setPreviewFailed(true)} />
          : <span className="source-format-fallback">{formatIcon}<b>{source.format}</b></span>}
      </span>
      <span className="source-button-copy">
        <strong title={source.name}>{displayName}</strong>
        <small>{source.role}{source.page ? ` · page ${source.page}` : ""}</small>
      </span>
      {linked && <FileSearch className="source-open-icon" />}
    </>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="source-button" aria-disabled={!linked} disabled={!linked} onClick={() => linked && open(source)}>{triggerContents}</button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12} className="source-tooltip">
        {previewAvailable ? <img src={previewUrl} alt={`${documentPreviewCaption(source)} of ${displayName}`} className="source-preview" onError={() => setPreviewFailed(true)} /> : <div className={`missing-preview missing-preview--${mediaKind}`}>{formatIcon}<span>{source.format} preview not available</span><small>The complete source can still be downloaded below.</small></div>}
        <div className="source-tooltip-copy">
          <p className="source-role">{source.role}</p>
          <p className="source-full-name" title={source.name}>{displayName}</p>
          <p className="source-result">{source.result}</p>
          <div className="source-clock">
            <div><span>Event stamp</span><strong>{source.clock.eventStamp}</strong></div>
            <div><span>Date basis</span><strong>{source.clock.basis}</strong></div>
            <div><span>{source.format} created</span><strong>{source.clock.created ?? "Unavailable"}</strong></div>
            {source.clock.modified && <div><span>{source.format} modified</span><strong>{source.clock.modified}</strong></div>}
            <p>{source.clock.note}</p>
          </div>
          <p className="source-hint">{linked ? "Click to read the source in a document pop-out, then download or share the document." : "Exact filename preserved; source acquisition required."}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function catalogSource(document: CatalogDocument): Source {
  const inferredExtension = document.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toUpperCase();
  const inferredFormat = inferredExtension && ["PDF", "HTML", "GEOJSON", "JPG", "JPEG", "PNG", "WEBP", "DOC", "DOCX", "XLS", "XLSX", "CSV", "TSV", "MSG", "ZIP", "TXT"].includes(inferredExtension)
    ? inferredExtension
    : "OTHER";
  const format = (document.format ?? inferredFormat) as SourceFormat;
  const eventStamp = document.year ? `${document.year} · exact event time not stated` : "Reference record · time not stated";

  return {
    name: document.name,
    url: document.url,
    preview: bundledFirstPagePreview(document.url),
    pages: document.pages ?? undefined,
    format,
    role: "Primary source",
    result: document.description ?? document.type ?? "Preserved source document.",
    clock: {
      eventStamp,
      basis: "Document library record",
      note: document.description ?? "The complete preserved file is available from the download control.",
    },
  };
}

function DocumentPopoutButton({
  document,
  label,
  open,
}: {
  document: CatalogDocument;
  label: string;
  open: (source: Source) => void;
}) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => open(catalogSource(document))}>
      {label}<FileSearch />
    </Button>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<Source | null>(null);
  const [globalSearch, dispatchGlobalSearch] = useReducer(librarySearchReducer, initialLibrarySearchState);
  const globalQuery = globalSearch.query;
  const [documentQuery, setDocumentQuery] = useState("");
  const [documentType, setDocumentType] = useState("All records");
  const [permitQuery, setPermitQuery] = useState("");
  const [permitType, setPermitType] = useState("All permit records");
  const [ippQuery, setIppQuery] = useState("");
  const [ippType, setIppType] = useState("All IPP records");
  const [pfasQuery, setPfasQuery] = useState("");
  const [pfasType, setPfasType] = useState("All PFAS records");
  const [biosolidsQuery, setBiosolidsQuery] = useState("");
  const [biosolidsType, setBiosolidsType] = useState("All biosolids records");
  const [labQuery, setLabQuery] = useState("");
  const [labType, setLabType] = useState("All laboratory records");
  const [complianceQuery, setComplianceQuery] = useState("");
  const [complianceType, setComplianceType] = useState("All compliance records");
  const [correspondenceQuery, setCorrespondenceQuery] = useState("");
  const [correspondenceType, setCorrespondenceType] = useState("All correspondence records");
  const [processSiteQuery, setProcessSiteQuery] = useState("");
  const [processSiteType, setProcessSiteType] = useState("All process and site records");
  const [formSubmissionQuery, setFormSubmissionQuery] = useState("");
  const [formSubmissionType, setFormSubmissionType] = useState("All portal submissions");
  const [wexfordQuery, setWexfordQuery] = useState("");
  const [wexfordType, setWexfordType] = useState("All Wexford records");
  const [supplementalQuery, setSupplementalQuery] = useState("");
  const [supplementalType, setSupplementalType] = useState("All added records");
  const [referenceQuery, setReferenceQuery] = useState("");
  const [referenceType, setReferenceType] = useState("All reference records");
  const groups = Array.from(events.reduce<Map<string, Event[]>>((acc, event) => {
    const group = acc.get(event.year) ?? [];
    group.push(event);
    acc.set(event.year, group);
    return acc;
  }, new Map()))
    .map(([year, items]) => ({ year, items: [...items].sort((a, b) => (a.isoDate ?? a.date).localeCompare(b.isoDate ?? b.date)) }))
    .sort((a, b) => Number(a.year) - Number(b.year));
  const sourceCount = events.reduce((count, event) => count + event.sources.length, 0);
  const globalSearchResults = searchLibrary(librarySearchIndex, globalQuery);
  const { visible: visibleGlobalResults, remaining: remainingGlobalResults } = librarySearchWindow(globalSearchResults, globalSearch.limit);
  const documentTypes = ["All records", ...Array.from(new Set(dmrDocuments.map((document) => document.type)))];
  const normalizedQuery = documentQuery.trim().toLowerCase();
  const filteredDocuments = dmrDocuments.filter((document) => {
    const matchesType = documentType === "All records" || document.type === documentType;
    const matchesQuery = !normalizedQuery || `${document.name} ${document.year} ${document.type}`.toLowerCase().includes(normalizedQuery);
    return matchesType && matchesQuery;
  });
  const permitTypes = ["All permit records", ...Array.from(new Set(npdesDocuments.map((document) => document.type)))];
  const normalizedPermitQuery = permitQuery.trim().toLowerCase();
  const filteredPermitDocuments = npdesDocuments.filter((document) => {
    const matchesType = permitType === "All permit records" || document.type === permitType;
    const matchesQuery = !normalizedPermitQuery || `${document.name} ${document.year} ${document.type} ${document.format}`.toLowerCase().includes(normalizedPermitQuery);
    return matchesType && matchesQuery;
  });
  const ippTypes = ["All IPP records", ...Array.from(new Set(ippDocuments.map((document) => document.type)))];
  const normalizedIppQuery = ippQuery.trim().toLowerCase();
  const filteredIppDocuments = ippDocuments.filter((document) => {
    const matchesType = ippType === "All IPP records" || document.type === ippType;
    const matchesQuery = !normalizedIppQuery || `${document.name} ${document.year} ${document.type} ${document.description}`.toLowerCase().includes(normalizedIppQuery);
    return matchesType && matchesQuery;
  });
  const pfasTypes = ["All PFAS records", ...Array.from(new Set(pfasDocuments.map((document) => document.type)))];
  const normalizedPfasQuery = pfasQuery.trim().toLowerCase();
  const filteredPfasDocuments = pfasDocuments.filter((document) => {
    const matchesType = pfasType === "All PFAS records" || document.type === pfasType;
    const matchesQuery = !normalizedPfasQuery || `${document.name} ${document.year} ${document.type} ${document.description}`.toLowerCase().includes(normalizedPfasQuery);
    return matchesType && matchesQuery;
  });
  const biosolidsTypes = ["All biosolids records", ...Array.from(new Set(biosolidsDocuments.map((document) => document.type)))];
  const normalizedBiosolidsQuery = biosolidsQuery.trim().toLowerCase();
  const filteredBiosolidsDocuments = biosolidsDocuments.filter((document) => {
    const matchesType = biosolidsType === "All biosolids records" || document.type === biosolidsType;
    const matchesQuery = !normalizedBiosolidsQuery || `${document.name} ${document.year} ${document.type} ${document.description}`.toLowerCase().includes(normalizedBiosolidsQuery);
    return matchesType && matchesQuery;
  });
  const labTypes = ["All laboratory records", ...Array.from(new Set(labDocuments.map((document) => document.type)))];
  const normalizedLabQuery = labQuery.trim().toLowerCase();
  const filteredLabDocuments = labDocuments.filter((document) => {
    const matchesType = labType === "All laboratory records" || document.type === labType;
    const matchesQuery = !normalizedLabQuery || `${document.name} ${document.year} ${document.type} ${document.description}`.toLowerCase().includes(normalizedLabQuery);
    return matchesType && matchesQuery;
  });
  const complianceTypes = ["All compliance records", ...Array.from(new Set(complianceDocuments.map((document) => document.type)))];
  const normalizedComplianceQuery = complianceQuery.trim().toLowerCase();
  const filteredComplianceDocuments = complianceDocuments.filter((document) => {
    const matchesType = complianceType === "All compliance records" || document.type === complianceType;
    const matchesQuery = !normalizedComplianceQuery || `${document.name} ${document.year} ${document.type}`.toLowerCase().includes(normalizedComplianceQuery);
    return matchesType && matchesQuery;
  });
  const correspondenceTypes = ["All correspondence records", ...Array.from(new Set(correspondenceDocuments.map((document) => document.type)))];
  const normalizedCorrespondenceQuery = correspondenceQuery.trim().toLowerCase();
  const filteredCorrespondenceDocuments = correspondenceDocuments.filter((document) => {
    const matchesType = correspondenceType === "All correspondence records" || document.type === correspondenceType;
    const matchesQuery = !normalizedCorrespondenceQuery || `${document.name} ${document.year} ${document.type} ${document.description}`.toLowerCase().includes(normalizedCorrespondenceQuery);
    return matchesType && matchesQuery;
  });
  const processSiteTypes = ["All process and site records", ...Array.from(new Set(processSiteRecords.map((document) => document.type)))];
  const normalizedProcessSiteQuery = processSiteQuery.trim().toLowerCase();
  const filteredProcessSiteDocuments = processSiteRecords.filter((document) => {
    const matchesType = processSiteType === "All process and site records" || document.type === processSiteType;
    const matchingSourceNames = document.matchingSources?.map((source) => source.name).join(" ") ?? "";
    const matchesQuery = !normalizedProcessSiteQuery || `${document.name} ${matchingSourceNames} ${document.year} ${document.type} ${document.description}`.toLowerCase().includes(normalizedProcessSiteQuery);
    return matchesType && matchesQuery;
  });
  const formSubmissionTypes = ["All portal submissions", ...Array.from(new Set(formSubmissionDocuments.map((document) => document.type)))];
  const normalizedFormSubmissionQuery = formSubmissionQuery.trim().toLowerCase();
  const filteredFormSubmissionDocuments = formSubmissionDocuments.filter((document) => {
    const matchesType = formSubmissionType === "All portal submissions" || document.type === formSubmissionType;
    const matchesQuery = !normalizedFormSubmissionQuery || `${document.name} ${document.year} ${document.type} ${document.description}`.toLowerCase().includes(normalizedFormSubmissionQuery);
    return matchesType && matchesQuery;
  });
  const wexfordTypes = ["All Wexford records", ...Array.from(new Set(wexfordDocuments.map((document) => document.type)))];
  const normalizedWexfordQuery = wexfordQuery.trim().toLowerCase();
  const filteredWexfordDocuments = wexfordDocuments.filter((document) => {
    const matchesType = wexfordType === "All Wexford records" || document.type === wexfordType;
    const matchesQuery = !normalizedWexfordQuery || `${document.name} ${document.year} ${document.type} ${document.description}`.toLowerCase().includes(normalizedWexfordQuery);
    return matchesType && matchesQuery;
  });
  const supplementalTypes = ["All added records", ...Array.from(new Set(supplementalDocuments.map((document) => document.type)))];
  const normalizedSupplementalQuery = supplementalQuery.trim().toLowerCase();
  const filteredSupplementalDocuments = supplementalDocuments.filter((document) => {
    const matchesType = supplementalType === "All added records" || document.type === supplementalType;
    const matchesQuery = !normalizedSupplementalQuery || `${document.name} ${document.year} ${document.category} ${document.type} ${document.description}`.toLowerCase().includes(normalizedSupplementalQuery);
    return matchesType && matchesQuery;
  });
  const referenceTypes = ["All reference records", ...Array.from(new Set(referenceDocuments.map((document) => document.type)))];
  const normalizedReferenceQuery = referenceQuery.trim().toLowerCase();
  const filteredReferenceDocuments = referenceDocuments.filter((document) => {
    const matchesType = referenceType === "All reference records" || document.type === referenceType;
    const matchesQuery = !normalizedReferenceQuery || `${document.name} ${document.format} ${document.type} ${"description" in document ? document.description : ""}`.toLowerCase().includes(normalizedReferenceQuery);
    return matchesType && matchesQuery;
  });
  const selectedPreviewUrl = selected ? sourcePreviewUrl(selected) ?? (selected.url ? bundledFirstPagePreview(selected.url) : undefined) : undefined;
  const selectedDownloadUrl = selected?.url
    ? bundledDocumentDownload(selected.url)
      ?? sourceDownloadUrl(selected.url, selected.format, (url) => withPdfStartPage(url, selected.page))
    : undefined;
  return (
    <TooltipProvider delayDuration={120}>
      <main className="site-shell" data-placement-manifest-url={bundledPublicAsset("/record-placement-manifest.json")}>
        <header className="trace-header">
          <div>
            <p className="eyebrow">MI0020257 · SOURCE-LINKED RECORD</p>
            <h1>Cadillac Contamination - Environmental Records Repository</h1>
            <p className="header-copy">Follow the hierarchy from year to event timestamp to the exact source document, with separate clocks for the event, the issued record and embedded file metadata.</p>
          </div>
          <div className="integrity-note">
            <img className="integrity-logo" src={bundledPublicAsset("/blax-water-logo.png")} alt="BLAX Water" decoding="async" />
            <div className="integrity-note-copy"><CheckCircle2 aria-hidden="true" /><div><strong>Original-source rule</strong><span>Hover a filename for its first-page preview and result. Click to preview page one and download the complete document.</span></div></div>
          </div>
        </header>

        <section className="path-strip" aria-label="Investigative pathway">
          <div><Factory /><span>Wexford landfill</span><small>Source material</small></div><ArrowDown />
          <div><Landmark /><span>Cadillac WWTP</span><small>Historical receiver</small></div><ArrowDown />
          <div><FlaskConical /><span>PFAS record</span><small>Sampling + controls</small></div><ArrowDown />
          <div><Waves /><span>Plett Road wells</span><small>Receptor results</small></div>
        </section>

        <section className="global-search-panel" id="record-search" aria-labelledby="record-search-title">
          <div className="global-search-heading">
            <div><p className="eyebrow">COMPLETE EVIDENCE LIBRARY</p><h2 id="record-search-title">Search all {librarySearchRecords.length.toLocaleString()} records</h2></div>
            <p>Search all catalog names, verified uploaded filenames, years, categories and finding summaries. This searches the catalog, not the full text inside each document.</p>
          </div>
          <label className="global-search-input">
            <Search aria-hidden="true" />
            <span className="sr-only">Search the complete evidence library</span>
            <input
              type="search"
              value={globalQuery}
              onChange={(event) => dispatchGlobalSearch({ type: "query", query: event.target.value })}
              placeholder="Search all records — try PFAS, spill, cyanide, 2024…"
              autoComplete="off"
            />
          </label>
          {normalizeLibrarySearch(globalQuery).length > 0 && (
            <div className="global-search-results" aria-live="polite">
              <p className="global-search-summary">
                <strong>{globalSearchResults.length.toLocaleString()}</strong> matching {globalSearchResults.length === 1 ? "record" : "records"}
                {globalSearchResults.length > 0 && <span> · showing {visibleGlobalResults.length.toLocaleString()} of {globalSearchResults.length.toLocaleString()}</span>}
              </p>
              {visibleGlobalResults.length > 0 ? (
                <div className="global-search-grid" id="global-search-records">
                  {visibleGlobalResults.map((document) => (
                    <article className="global-search-card" key={`${document.archiveId}-${document.id}`}>
                      <div className="archive-meta"><Badge variant="outline">{document.archive}</Badge><span>{document.type}</span>{document.year && <span>{document.year}</span>}{document.format && <span>{document.format}</span>}</div>
                      <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                      <p>{documentSummary(document)}</p>
                      <DocumentPopoutButton document={document} label="Read record" open={setSelected} />
                    </article>
                  ))}
                </div>
              ) : <p className="document-empty">No records match this search.</p>}
              {remainingGlobalResults > 0 && (
                <div className="global-search-more">
                  <Button type="button" variant="outline" aria-controls="global-search-records" onClick={() => dispatchGlobalSearch({ type: "more" })}>
                    Show {Math.min(SEARCH_BATCH_SIZE, remainingGlobalResults).toLocaleString()} more records
                  </Button>
                  <span>{remainingGlobalResults.toLocaleString()} more matching records available</span>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="timeframe-model" aria-labelledby="timeframe-title">
          <div className="timeframe-heading">
            <div><p className="eyebrow">HIERARCHICAL TIMEFRAME MODEL</p><h2 id="timeframe-title">Year → event → source clock</h2></div>
            <div className="timeframe-counts"><span><strong>{groups.length}</strong> year bands</span><span><strong>{events.length}</strong> events</span><span><strong>{sourceCount}</strong> source records</span></div>
          </div>
          <div className="hierarchy-steps" aria-label="Timestamp hierarchy">
            <div><b>01</b><span>Year band</span><small>Chronological container</small></div>
            <ArrowDown />
            <div><b>02</b><span>Event stamp</span><small>Date + stated time</small></div>
            <ArrowDown />
            <div><b>03</b><span>Source clock</span><small>Created + modified metadata</small></div>
          </div>
          <nav className="year-nav" aria-label="Jump to year band">
            {groups.map((group) => {
              const yearTarget = `#year-${group.year.replace(/[^0-9]+/g, "-")}`;

              return (
                <a
                  key={group.year}
                  href={yearTarget}
                  aria-label={`${group.year}: jump to ${group.items.length} ${group.items.length === 1 ? "event" : "events"}`}
                >
                  <strong>{group.year}</strong>
                  <span>{group.items.length} {group.items.length === 1 ? "event" : "events"}</span>
                </a>
              );
            })}
          </nav>
          <p className="clock-rule"><AlertTriangle />File metadata is evidentiary file history, not automatically the event time. Where a source states no time of day, the model says “time not stated.”</p>
        </section>

        <section className="trace-intro">
          <div><p className="eyebrow">CHRONOLOGICAL EVENT TRACE</p><h2>Year Over Year, Multiple Events, One source trail</h2></div>
          <p><strong>Missing tickets do not negate documented activity.</strong> The source-linked records below corroborate leachate offloading, purchasing and equipment installation without reconstructing every delivery. Regulatory records do not independently prove contaminant migration; groundwater attribution remains subject to hydrogeologic confirmation.</p>
        </section>

        <nav className="category-jump-nav" aria-label="Independent source catalog links">
          <div className="category-jump-heading"><p className="eyebrow">SOURCE CATALOG TABS</p><strong>Open each category on its own page</strong><span>Each button opens an independent catalog page with its complete record set.</span></div>
          <div className="category-jump-links">
            {categoryJumpLinks.map((link) => <a className="category-jump-link" href={link.href} key={link.href}>{link.label}</a>)}
          </div>
        </nav>

        <section className="trace" aria-label="Source-linked event timeline">
          {groups.map((group) => {
            const yearSlug = group.year.replace(/[^0-9]+/g, "-");

            return (
              <section className="year-group" id={`year-${yearSlug}`} key={group.year} aria-labelledby={`label-${yearSlug}`}>
                <header className="year-marker">
                  <span>YEAR BAND</span>
                  <div className="year-marker-main">
                    <div className="year-marker-copy">
                      <strong id={`label-${yearSlug}`}>{group.year}</strong>
                      <small>{group.items.length} {group.items.length === 1 ? "event" : "events"}</small>
                    </div>
                  </div>
                </header>
                {group.items.map((event) => {
                  const item = meta[event.kind];
                  const Icon = item.icon;
                  const index = events.indexOf(event);
                  return (
                    <article className="trace-row" data-kind={event.kind} id={eventAnchor(event.title)} key={`${event.date}-${event.title}`}>
                      <div className="trace-date">
                        <time dateTime={event.isoDate}>{event.date}</time>
                        <span className="event-time">{event.time}</span>
                        <span>{event.timeBasis}</span>
                        <span>{event.phase}</span>
                      </div>
                      <div className="trace-spine" aria-hidden="true"><div className="trace-node"><Icon /></div>{index < events.length - 1 && <div className="trace-line" />}</div>
                      <div className="event-card">
                        <div className="event-topline"><Badge variant="outline" className="kind-badge">{item.label}</Badge><span className="category-code">{event.category}</span></div>
                        <div className="timestamp-ribbon"><span>DATE</span><strong>{event.date}</strong><i>TIME</i><strong>{event.time}</strong></div>
                        <h3
                          title={event.title}
                          style={{
                            "--event-title-fit": `${((100 / Math.max(event.title.length, 1)) * 1.7).toFixed(3)}cqw`,
                          } as CSSProperties}
                        >
                          {event.title.toUpperCase()}
                        </h3>
                        <p className="event-finding">{event.finding}</p>
                        <div className="consequence"><ArrowDown /><p><strong>Trace significance</strong>{event.significance}</p></div>
                        <div className="source-list">{event.sources.map((source) => <SourceButton key={source.name} source={source} open={setSelected} />)}</div>
                      </div>
                    </article>
                  );
                })}
              </section>
            );
          })}
        </section>

        <section className="document-library" data-archive-id="dmr" aria-labelledby="document-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">DISCHARGE MONITORING ARCHIVE</p><h2 id="document-library-title">Search {dmrDocuments.length} DMR and QA records</h2></div>
            <p>The supplied Cadillac WWTP collection is preserved here as downloadable source files. Original filenames remain visible for provenance, while only confirmed content duplicates are suppressed.</p>
          </div>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search documents</span><input value={documentQuery} onChange={(event) => setDocumentQuery(event.target.value)} placeholder="Search filename, year or record type" /></label>
            <label className="document-filter"><span className="sr-only">Filter by record type</span><select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>{documentTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid">
            {filteredDocuments.map((document) => (
              <article className="archive-card" data-record-id={document.id} key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><span>{document.year}</span><span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span><span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <DocumentPopoutButton document={document} label="Read PDF" open={setSelected} />
                <p className="archive-description">{documentSummary(document)}</p>
              </article>
            ))}
          </div>
          {filteredDocuments.length === 0 && <p className="document-empty">No documents match this search.</p>}
        </section>

        <section className="document-library permit-library" data-archive-id="npdes" aria-labelledby="permit-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 02 · NPDES PERMITS &amp; PERMIT ISSUANCE</p><h2 id="permit-library-title">Search {npdesDocuments.length} verified permit records</h2></div>
            <p>Applications, draft and final permits, WQBEL reviews, public notices, certifications, correspondence and original email-message files are preserved here. Only records proven equivalent by content and rendering are suppressed.</p>
          </div>
          <div className="reference-summary" aria-label="NPDES permit archive audit summary">
            <div><FileText /><span><strong>{npdesAudit.stats.finalDistinctRecords}</strong> distinct records</span></div>
            <div><CheckCircle2 /><span><strong>{npdesAudit.stats.duplicateCopiesSuppressed}</strong> duplicate copies excluded</span></div>
            <div><FileSearch /><span><strong>{formatBytes(npdesAudit.stats.publishedBytes)}</strong> published</span></div>
          </div>
          <details className="audit-details archive-audit">
            <summary>Review Category 02 duplicate decisions</summary>
            <div className="audit-panel">
              <p>{npdesAudit.methods.join(" · ")}</p>
              <ul>{npdesAudit.decisions.map((item) => <li key={item.name}><strong title={item.name}>{formatSourceDisplayName(item.name)}</strong><span>{item.reason}</span></li>)}</ul>
            </div>
          </details>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search NPDES permit records</span><input value={permitQuery} onChange={(event) => setPermitQuery(event.target.value)} placeholder="Search filename, year or permit record type" /></label>
            <label className="document-filter"><span className="sr-only">Filter permit records by type</span><select value={permitType} onChange={(event) => setPermitType(event.target.value)}>{permitTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredPermitDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid">
            {filteredPermitDocuments.map((document) => (
              <article className="archive-card" data-record-id={document.id} key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span>{document.pages !== null && <span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span>}<span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <DocumentPopoutButton document={document} label={document.format === "PDF" ? "Read PDF" : "View MSG"} open={setSelected} />
                <p className="archive-description">{documentSummary(document)}</p>
              </article>
            ))}
          </div>
          {filteredPermitDocuments.length === 0 && <p className="document-empty">No permit records match this search.</p>}
        </section>

        <section className="document-library permit-library" data-archive-id="ipp" aria-labelledby="ipp-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 04 · INDUSTRIAL PRETREATMENT &amp; SIU RECORDS</p><h2 id="ipp-library-title">Search {ippDocuments.length} verified IPP records</h2></div>
            <p>The verified archive now spans annual IPP reports, SNC notices, industrial-user records, POTW monitoring and oversight tables, SIU/CIU inventories, MAHL/local-limit packages, corrective-action correspondence and program revisions. OCR was used only to locate text in scanned pages; reported fields were verified against rendered originals.</p>
          </div>
          <div className="reference-summary" aria-label="Industrial pretreatment archive audit summary">
            <div><FileText /><span><strong>{ippAudit.stats.finalDistinctRecords}</strong> distinct records</span></div>
            <div><CheckCircle2 /><span><strong>{ippAudit.stats.exactPublishedDuplicatesSuppressed}</strong> published duplicate excluded</span></div>
            <div><FileSearch /><span><strong>{formatBytes(ippAudit.stats.publishedBytes)}</strong> published</span></div>
          </div>
          <details className="audit-details archive-audit">
            <summary>Review Category 04 duplicate and OCR decisions</summary>
            <div className="audit-panel">
              <p>{ippAudit.methods.join(" · ")}</p>
              <ul>{ippAudit.decisions.map((item) => <li key={item.name}><strong title={item.name}>{formatSourceDisplayName(item.name)}</strong><span>{item.reason}</span></li>)}</ul>
            </div>
          </details>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search industrial pretreatment records</span><input value={ippQuery} onChange={(event) => setIppQuery(event.target.value)} placeholder="Search filename, year, record type or finding" /></label>
            <label className="document-filter"><span className="sr-only">Filter industrial pretreatment records by type</span><select value={ippType} onChange={(event) => setIppType(event.target.value)}>{ippTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredIppDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid">
            {filteredIppDocuments.map((document) => (
              <article className="archive-card" data-record-id={document.id} key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span><span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span><span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{documentSummary(document)}</p>
                <DocumentPopoutButton document={document} label="Read PDF" open={setSelected} />
              </article>
            ))}
          </div>
          {filteredIppDocuments.length === 0 && <p className="document-empty">No industrial pretreatment records match this search.</p>}
        </section>

        <section className="document-library permit-library" data-archive-id="pfas" aria-labelledby="pfas-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">PFAS MONITORING · VERIFIED AUGUST 28, 2026</p><h2 id="pfas-library-title">Search {pfasDocuments.length} verified PFAS records</h2></div>
            <p>This category preserves PFAS results workbooks and tables, effluent and biosolids laboratory reports, electronic data deliverables, QA/QC packages, dated maps, agency updates, response plans and clearly labeled contextual records. Related files remain separate when they carry distinct analytical or evidentiary content.</p>
          </div>
          <div className="reference-summary" aria-label="PFAS monitoring archive audit summary">
            <div><FileText /><span><strong>{pfasAudit.stats.newDistinctRecords}</strong> new records</span></div>
            <div><CheckCircle2 /><span><strong>{pfasAudit.stats.existingRecordsReused + pfasAudit.stats.existingRecordReplaced}</strong> archive records reused or repaired</span></div>
            <div><FileSearch /><span><strong>{pfasAudit.stats.duplicateCopiesSuppressed}</strong> duplicate copies suppressed</span></div>
          </div>
          <details className="audit-details archive-audit">
            <summary>Review PFAS duplicate, metadata and OCR decisions</summary>
            <div className="audit-panel">
              <p>{pfasAudit.methods.join(" · ")}</p>
              <ul>{pfasAudit.decisions.map((item) => <li key={item.name}><strong title={item.name}>{formatSourceDisplayName(item.name)}</strong><span>{item.reason}</span></li>)}</ul>
            </div>
          </details>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search PFAS monitoring records</span><input value={pfasQuery} onChange={(event) => setPfasQuery(event.target.value)} placeholder="Search filename, year, record type or finding" /></label>
            <label className="document-filter"><span className="sr-only">Filter PFAS monitoring records by type</span><select value={pfasType} onChange={(event) => setPfasType(event.target.value)}>{pfasTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredPfasDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid">
            {filteredPfasDocuments.map((document) => (
              <article className="archive-card" data-record-id={document.id} key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span>{document.pages !== null && <span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span>}<span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{documentSummary(document)}</p>
                <DocumentPopoutButton document={document} label={document.format === "PDF" ? "Read PDF" : document.format === "PNG" ? "View image" : document.format === "XLSX" ? "View workbook" : "View MSG"} open={setSelected} />
              </article>
            ))}
          </div>
          {filteredPfasDocuments.length === 0 && <p className="document-empty">No PFAS monitoring records match this search.</p>}
        </section>

        <section className="document-library permit-library" data-archive-id="biosolids" aria-labelledby="biosolids-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 05 · BIOSOLIDS &amp; LAND APPLICATION · VERIFIED AUGUST 27, 2026</p><h2 id="biosolids-library-title">Search {biosolidsDocuments.length} verified biosolids records</h2></div>
            <p>This category preserves laboratory packages, land-application sites, as-applied workbooks, certifications, residuals-management-plan records, operational calculations, audit correspondence and field photographs. It also indexes the photographed note reporting an approximately 22,000-gallon biosolids overflow, without inferring migration or impact beyond the source.</p>
          </div>
          <div className="reference-summary" aria-label="Biosolids and land-application archive audit summary">
            <div><FileText /><span><strong>{biosolidsAudit.stats.newDistinctRecords}</strong> new records</span></div>
            <div><CheckCircle2 /><span><strong>{biosolidsAudit.stats.existingRecordsReused}</strong> existing records reused</span></div>
            <div><FileSearch /><span><strong>{biosolidsAudit.stats.duplicateCopiesSuppressed}</strong> actual duplicates suppressed</span></div>
          </div>
          <details className="audit-details archive-audit">
            <summary>Review Category 05 duplicate, metadata, OCR and spill-record decisions</summary>
            <div className="audit-panel">
              <p>{biosolidsAudit.methods.join(" · ")}</p>
              <ul>{biosolidsAudit.decisions.map((item) => <li key={item.name}><strong title={item.name}>{formatSourceDisplayName(item.name)}</strong><span>{item.reason}</span></li>)}</ul>
            </div>
          </details>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search biosolids and land-application records</span><input value={biosolidsQuery} onChange={(event) => setBiosolidsQuery(event.target.value)} placeholder="Search filename, year, site, record type or spill note" /></label>
            <label className="document-filter"><span className="sr-only">Filter biosolids records by type</span><select value={biosolidsType} onChange={(event) => setBiosolidsType(event.target.value)}>{biosolidsTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredBiosolidsDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid">
            {filteredBiosolidsDocuments.map((document) => (
              <article className="archive-card" data-record-id={document.id} key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span>{document.pages !== null && <span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span>}<span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{documentSummary(document)}</p>
                <DocumentPopoutButton document={document} label={document.format === "PDF" ? "Read PDF" : ["JPG", "JPEG", "PNG"].includes(document.format) ? "View image" : "View source"} open={setSelected} />
              </article>
            ))}
          </div>
          {filteredBiosolidsDocuments.length === 0 && <p className="document-empty">No biosolids or land-application records match this search.</p>}
        </section>

        <section className="document-library permit-library" data-archive-id="lab" aria-labelledby="lab-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 06 · LAB RESULTS &amp; SAMPLING · VERIFIED AUGUST 27, 2026</p><h2 id="lab-library-title">Search {labDocuments.length} verified laboratory records</h2></div>
            <p>This category preserves analytical reports, whole-effluent-toxicity studies, chain-of-custody and field sheets, exceedance records, method reviews, mercury monitoring, and biosolids or pathogen results. Similar templates remain separate when the monitoring date, sample, analyte, method, revision or reported result differs.</p>
          </div>
          <div className="reference-summary" aria-label="Laboratory results and sampling archive audit summary">
            <div><FileText /><span><strong>{labAudit.stats.newDistinctRecords}</strong> new records</span></div>
            <div><CheckCircle2 /><span><strong>{labAudit.stats.existingRecordsReused}</strong> existing records reused</span></div>
            <div><FileSearch /><span><strong>{labAudit.stats.duplicateCopiesSuppressed}</strong> actual duplicates suppressed</span></div>
          </div>
          <details className="audit-details archive-audit">
            <summary>Review Category 06 duplicate, metadata, OCR and revision decisions</summary>
            <div className="audit-panel">
              <p>{labAudit.methods.join(" · ")}</p>
              <ul>{labAudit.decisions.map((item) => <li key={item.name}><strong title={item.name}>{formatSourceDisplayName(item.name)}</strong><span>{item.reason}</span></li>)}</ul>
            </div>
          </details>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search laboratory results and sampling records</span><input value={labQuery} onChange={(event) => setLabQuery(event.target.value)} placeholder="Search filename, year, analyte, laboratory, record type or finding" /></label>
            <label className="document-filter"><span className="sr-only">Filter laboratory and sampling records by type</span><select value={labType} onChange={(event) => setLabType(event.target.value)}>{labTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredLabDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid">
            {filteredLabDocuments.map((document) => (
              <article className="archive-card" data-record-id={document.id} key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span><span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span><span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{documentSummary(document)}</p>
                <DocumentPopoutButton document={document} label="Read PDF" open={setSelected} />
              </article>
            ))}
          </div>
          {filteredLabDocuments.length === 0 && <p className="document-empty">No laboratory or sampling records match this search.</p>}
        </section>

        <section className="document-library permit-library" data-archive-id="wexford" aria-labelledby="wexford-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 12 · WEXFORD LANDFILL &amp; RULE 2210(y) RECORDS</p><h2 id="wexford-library-title">Search {wexfordDocuments.length} verified records</h2></div>
            <p>This source set preserves the groundwater-discharge, landfill-gas, air-permit, compliance, county, leachate, stormwater and site-history record. Exact matches already indexed elsewhere are reused instead of republished, while substantive revisions remain available separately.</p>
          </div>
          <div className="reference-summary" aria-label="Wexford landfill archive audit summary">
            <div><FileText /><span><strong>{solidWastePlans.events.length}</strong> solid-waste-plan findings · September 7 intake: 5 originals</span></div>
            <div><CheckCircle2 /><span><strong>{wexfordAudit.stats.exactExistingRecordsReused}</strong> exact record(s) reused as cross reference(s)</span></div>
            <div><FileSearch /><span><strong>{formatBytes(wexfordAudit.stats.publishedBytes)}</strong> preserved</span></div>
          </div>
          <details className="audit-details archive-audit">
            <summary>Review Category 12 duplicate, metadata and scan decisions</summary>
            <div className="audit-panel">
              <p>{wexfordAudit.methods.join(" · ")}</p>
              <ul>{wexfordAudit.decisions.map((item) => <li key={item.name}><strong title={item.name}>{formatSourceDisplayName(item.name)}</strong><span>{item.reason}</span></li>)}</ul>
            </div>
          </details>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search Wexford landfill records</span><input value={wexfordQuery} onChange={(event) => setWexfordQuery(event.target.value)} placeholder="Search filename, year, record type or finding" /></label>
            <label className="document-filter"><span className="sr-only">Filter Wexford records by type</span><select value={wexfordType} onChange={(event) => setWexfordType(event.target.value)}>{wexfordTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredWexfordDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid">
            {filteredWexfordDocuments.map((document) => (
              <article className="archive-card" data-record-id={document.id} key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span>{document.pages !== null && <span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span>}<span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{documentSummary(document)}</p>
                <DocumentPopoutButton document={document} label={document.format === "PDF" ? "Read PDF" : "View source"} open={setSelected} />
              </article>
            ))}
          </div>
          {filteredWexfordDocuments.length === 0 && <p className="document-empty">No Wexford landfill records match this search.</p>}
        </section>

        <section className="document-library permit-library" data-archive-id="compliance" aria-labelledby="compliance-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 08 · COMPLIANCE &amp; ENFORCEMENT · VERIFIED AUGUST 27, 2026</p><h2 id="compliance-library-title">Search {complianceDocuments.length} verified compliance records</h2></div>
            <p>This category preserves agency evaluations, violation notices, significant noncompliance (SNC) material, spill and bypass notifications, exceedance reports, correspondence, source-order extracts and photographed attachments. Every supplied page was read with embedded text or OCR; only records already preserved elsewhere and analyst-authored derivative reports are excluded.</p>
          </div>
          <div className="reference-summary" aria-label="Compliance and enforcement archive audit summary">
            <div><FileText /><span><strong>{complianceAudit.stats.finalDistinctRecords}</strong> distinct records</span></div>
            <div><CheckCircle2 /><span><strong>{complianceAudit.stats.ocrPages}</strong> OCR pages verified</span></div>
            <div><FileSearch /><span><strong>{formatBytes(complianceAudit.stats.publishedBytes)}</strong> published</span></div>
          </div>
          <details className="audit-details archive-audit" data-audit="native-msg-strict">
            <summary>Strict native MSG audit · {msgAudit.summary.messages} messages · {msgAudit.summary.pages} attached pages</summary>
            <div className="audit-panel">
              <p>All seven previously open native Outlook messages are now strict-fully-verified. The audit rendered all {msgAudit.summary.renderedPages} attached-PDF pages, applied OCR to {msgAudit.summary.ocrCompletedPages} sparse pages, and found no unreadable page or remaining strict gap.</p>
              <ul>{msgAudit.records.map((item) => <li key={item.id}><strong title={item.name}>{item.name}</strong><span>{item.audit.pdfCoverage.pdfCount} attached PDF{item.audit.pdfCoverage.pdfCount === 1 ? "" : "s"} · {item.audit.pdfCoverage.pages} pages · {item.audit.pdfCoverage.ocrCompletedPages} OCR pages · {item.audit.zipInventory.entryCount} hashed ZIP entries</span></li>)}</ul>
            </div>
          </details>
          <details className="audit-details archive-audit">
            <summary>Review Category 08 duplicate, OCR and overlap decisions</summary>
            <div className="audit-panel">
              <p>{complianceAudit.methods.join(" · ")}</p>
              <ul>{complianceAudit.decisions.map((item) => <li key={item.name}><strong title={item.name}>{formatSourceDisplayName(item.name)}</strong><span>{item.reason}</span></li>)}</ul>
            </div>
          </details>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search compliance records</span><input value={complianceQuery} onChange={(event) => setComplianceQuery(event.target.value)} placeholder="Search filename, year or compliance record type" /></label>
            <label className="document-filter"><span className="sr-only">Filter compliance records by type</span><select value={complianceType} onChange={(event) => setComplianceType(event.target.value)}>{complianceTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredComplianceDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid">
            {filteredComplianceDocuments.map((document) => (
              <article className="archive-card" data-record-id={document.id} key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span>{document.pages !== null && <span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span>}<span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{documentSummary(document)}</p>
                <DocumentPopoutButton document={document} label={document.format === "PDF" ? "Read PDF" : ["JPG", "JPEG", "PNG"].includes(document.format) ? "View image" : "View source"} open={setSelected} />
              </article>
            ))}
          </div>
          {filteredComplianceDocuments.length === 0 && <p className="document-empty">No compliance records match this search.</p>}
        </section>

        <section className="document-library permit-library" data-archive-id="correspondence" aria-labelledby="correspondence-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 09 · CORRESPONDENCE &amp; LETTERS · VERIFIED AUGUST 28, 2026</p><h2 id="correspondence-library-title">Search {correspondenceDocuments.length} verified correspondence records</h2></div>
            <p>This category preserves regulatory email chains, transmittal letters, permit-development discussions, PFAS and biosolids correspondence, compliance notices, Wexford Landfill filings and the original spill scan. Every page was checked through its text layer or OCR; exact copies already indexed elsewhere are reused through site-wide search.</p>
          </div>
          <div className="reference-summary" aria-label="Correspondence and letters archive audit summary">
            <div><FileText /><span><strong>{correspondenceAudit.stats.finalDistinctRecords}</strong> distinct records</span></div>
            <div><CheckCircle2 /><span><strong>{correspondenceAudit.stats.publishedOcrPages}</strong> OCR pages verified</span></div>
            <div><FileSearch /><span><strong>{formatBytes(correspondenceAudit.stats.publishedBytes)}</strong> published</span></div>
          </div>
          <details className="audit-details archive-audit">
            <summary>Review Category 09 duplicate, OCR and cross-library decisions</summary>
            <div className="audit-panel">
              <p>{correspondenceAudit.methods.join(" · ")}</p>
              <ul>{correspondenceAudit.decisions.map((item) => <li key={item.name}><strong title={item.name}>{formatSourceDisplayName(item.name)}</strong><span>{item.reason}</span></li>)}</ul>
            </div>
          </details>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search correspondence records</span><input value={correspondenceQuery} onChange={(event) => setCorrespondenceQuery(event.target.value)} placeholder="Search filename, year, record type or finding" /></label>
            <label className="document-filter"><span className="sr-only">Filter correspondence records by type</span><select value={correspondenceType} onChange={(event) => setCorrespondenceType(event.target.value)}>{correspondenceTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredCorrespondenceDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid">
            {filteredCorrespondenceDocuments.map((document) => (
              <article className="archive-card" data-record-id={document.id} key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span>{document.pages !== null && <span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span>}<span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{documentSummary(document)}</p>
                <DocumentPopoutButton document={document} label={document.format === "PDF" ? "Read PDF" : ["JPG", "JPEG", "PNG"].includes(document.format) ? "View image" : "View source"} open={setSelected} />
              </article>
            ))}
          </div>
          {filteredCorrespondenceDocuments.length === 0 && <p className="document-empty">No correspondence records match this search.</p>}
        </section>

        <section className="document-library permit-library" data-archive-id="process-site" aria-labelledby="process-site-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 10 · PROCESS &amp; SITE DOCUMENTS · VERIFIED AUGUST 31, 2026</p><h2 id="process-site-library-title">Search {processSiteRecords.length} verified process and site records</h2></div>
            <p>This category preserves plant process-flow drawings, site and sewer-line plans, operational digester and flow data, facility history and mapping, a historical plant brochure, classification material and county records concerning landfill infrastructure. Every supplied page was checked through its text layer or OCR; exact copies already indexed elsewhere are reused through site-wide search.</p>
          </div>
          <div className="reference-summary" aria-label="Process and site documents archive audit summary">
            <div><FileText /><span><strong>{processSiteAudit.stats.finalDistinctRecords}</strong> distinct records</span></div>
            <div><CheckCircle2 /><span><strong>{processSiteAudit.stats.publishedOcrPages}</strong> OCR pages verified</span></div>
            <div><FileSearch /><span><strong>{formatBytes(processSiteAudit.stats.publishedBytes)}</strong> published</span></div>
          </div>
          <details className="audit-details archive-audit">
            <summary>Review Category 10 duplicate, OCR and cross-library decisions</summary>
            <div className="audit-panel">
              <p>{processSiteAudit.methods.join(" · ")}</p>
              <ul>{processSiteAudit.decisions.map((item) => <li key={item.name}><strong title={item.name}>{formatSourceDisplayName(item.name)}</strong><span>{item.reason}</span></li>)}</ul>
            </div>
          </details>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search process and site records</span><input value={processSiteQuery} onChange={(event) => setProcessSiteQuery(event.target.value)} placeholder="Search filename, year, record type or finding" /></label>
            <label className="document-filter"><span className="sr-only">Filter process and site records by type</span><select value={processSiteType} onChange={(event) => setProcessSiteType(event.target.value)}>{processSiteTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredProcessSiteDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid">
            {filteredProcessSiteDocuments.map((document) => (
              <article className="archive-card" data-record-id={document.id} key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span><span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span><span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{documentSummary(document)}</p>
                {document.matchingSources?.length ? (
                  <div className="archive-matching-sources">
                    <strong>{document.matchingSources.length === 1 ? "Matching supplied source" : "Matching supplied sources"}</strong>
                    {document.matchingSources.map((source) => (
                      <div className="archive-matching-source" key={source.sha256}>
                        <div>
                          <span title={source.name}>{formatSourceDisplayName(source.name, "PDF", true)}</span>
                          <small>{source.pages} {source.pages === 1 ? "page" : "pages"} · {formatBytes(source.size)} · independently hashed</small>
                          <p>{source.relationship}</p>
                        </div>
                        <DocumentPopoutButton document={{ ...source, format: "PDF", description: source.relationship }} label="Read supplied file" open={setSelected} />
                      </div>
                    ))}
                  </div>
                ) : null}
                <DocumentPopoutButton document={document} label="Read PDF" open={setSelected} />
              </article>
            ))}
          </div>
          {filteredProcessSiteDocuments.length === 0 && <p className="document-empty">No process or site records match this search.</p>}
        </section>

        <section className="document-library permit-library" data-archive-id="form-submissions" aria-labelledby="form-submission-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 11 · ONLINE FORM SUBMISSIONS · VERIFIED AUGUST 28, 2026</p><h2 id="form-submission-library-title">Search {formSubmissionDocuments.length} verified portal submissions</h2></div>
            <p>MiWaters and MiEnviro copies of record are organized by submission date, form title, submission ID and version. Each record has been reviewed and placed in a content-based subtype within this Category 11 catalog: PFAS effluent and biosolids monitoring, IPP and biosolids annual reports, compliance responses, certifications, approvals, stormwater forms and a discharge report. Every supplied page was read through embedded text or OCR, and corrected versions remain separate from true duplicate exports.</p>
          </div>
          <div className="reference-summary" aria-label="Online form submissions archive audit summary">
            <div><FileText /><span><strong>{formSubmissionAudit.stats.finalDistinctRecords}</strong> distinct records</span></div>
            <div><CheckCircle2 /><span><strong>Reviewed and cataloged</strong> {formSubmissionAudit.stats.finalDistinctRecords} records</span></div>
            <div><FileSearch /><span><strong>{formatBytes(formSubmissionAudit.stats.publishedBytes)}</strong> published</span></div>
          </div>
          <details className="audit-details archive-audit">
            <summary>Review Category 11 duplicate, revision and OCR decisions</summary>
            <div className="audit-panel">
              <p>{formSubmissionAudit.methods.join(" · ")}</p>
              <ul>{formSubmissionAudit.decisions.map((item) => <li key={item.name}><strong title={item.name}>{formatSourceDisplayName(item.name)}</strong><span>{item.reason}</span></li>)}</ul>
            </div>
          </details>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search online form submissions</span><input value={formSubmissionQuery} onChange={(event) => setFormSubmissionQuery(event.target.value)} placeholder="Search submission ID, form title, year, version or finding" /></label>
            <label className="document-filter"><span className="sr-only">Filter online form submissions by type</span><select value={formSubmissionType} onChange={(event) => setFormSubmissionType(event.target.value)}>{formSubmissionTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredFormSubmissionDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid">
            {filteredFormSubmissionDocuments.map((document) => (
              <article className="archive-card" data-record-id={document.id} key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span><span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span><span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{documentSummary(document)}</p>
                <DocumentPopoutButton document={document} label="Read PDF" open={setSelected} />
              </article>
            ))}
          </div>
          {filteredFormSubmissionDocuments.length === 0 && <p className="document-empty">No online form submissions match this search.</p>}
        </section>

        <section className="document-library permit-library" data-archive-id="supplemental" aria-labelledby="supplemental-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CROSS-CATEGORY ADDITIONS · SOURCE-LINKED RECORDS</p><h2 id="supplemental-library-title">Search {supplementalDocuments.length} added records</h2></div>
            <p>These additions span federal compliance, landfill operations, civic actions, audited finances, historical groundwater context and response planning. Primary records, historical context and secondary research are explicitly distinguished; related records remain separate when their official edition, content or evidentiary role differs.</p>
          </div>
          <div className="reference-summary" aria-label="Cross-category additions audit summary">
            <div><FileText /><span><strong>{supplementalDocuments.length}</strong> distinct additions</span></div>
            <div><CheckCircle2 /><span><strong>{supplementalAudit.stats.exactExistingRecordsReused + supplementalAudit.stats.duplicateCopiesSuppressed}</strong> copies not republished</span></div>
            <div><FileSearch /><span><strong>{formatBytes(supplementalAudit.stats.publishedBytes)}</strong> preserved</span></div>
          </div>
          <details className="audit-details archive-audit">
            <summary>Review batch duplicate, metadata and OCR decisions</summary>
            <div className="audit-panel">
              <p>{supplementalAudit.methods.join(" · ")}</p>
              <ul>{supplementalAudit.decisions.map((item) => <li key={item.name}><strong title={item.name}>{formatSourceDisplayName(item.name)}</strong><span>{item.reason}</span></li>)}</ul>
            </div>
          </details>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search added records</span><input value={supplementalQuery} onChange={(event) => setSupplementalQuery(event.target.value)} placeholder="Search filename, category, year, type or finding" /></label>
            <label className="document-filter"><span className="sr-only">Filter added records by type</span><select value={supplementalType} onChange={(event) => setSupplementalType(event.target.value)}>{supplementalTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredSupplementalDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid">
            {filteredSupplementalDocuments.map((document) => (
              <article className="archive-card" data-record-id={document.id} key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.category}</Badge><Badge variant="outline">{document.type}</Badge><span>{document.year}</span><span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span><span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{documentSummary(document)}</p>
                <DocumentPopoutButton document={document} label={document.format === "PDF" ? "Read PDF" : ["JPG", "JPEG", "PNG"].includes(document.format) ? "View image" : "View source"} open={setSelected} />
              </article>
            ))}
          </div>
          {filteredSupplementalDocuments.length === 0 && <p className="document-empty">No added records match this search.</p>}
        </section>

        <section className="document-library reference-library" data-archive-id="reference" aria-labelledby="reference-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 00 · REFERENCE DATA</p><h2 id="reference-library-title">Search {referenceDocuments.length} reference records</h2></div>
            <p>CSV exports, workbooks, manifests, research indexes and historical guidance are preserved as direct downloads. Guidance documents are labeled separately from measurements and transaction records.</p>
          </div>
          <div className="reference-summary" aria-label="Reference data audit summary">
            <div><Database /><span><strong>{referenceDocuments.length}</strong> distinct files</span></div>
            <div><CheckCircle2 /><span><strong>{referenceAudit.excludedFileCount}</strong> duplicate copies excluded</span></div>
            <div><FileSearch /><span><strong>{formatBytes(referenceAudit.includedBytes)}</strong> published</span></div>
          </div>
          <details className="audit-details">
            <summary>Review duplicate decisions and comparison methods</summary>
            <div className="audit-panel">
              <p>{referenceAudit.methods.join(" · ")}</p>
              <ul>{referenceAudit.exclusions.map((item) => <li key={item.name}><strong title={item.name}>{formatSourceDisplayName(item.name)}</strong><span>{item.reason}</span></li>)}</ul>
            </div>
          </details>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search reference datasets</span><input value={referenceQuery} onChange={(event) => setReferenceQuery(event.target.value)} placeholder="Search filename, export or dataset type" /></label>
            <label className="document-filter"><span className="sr-only">Filter by dataset type</span><select value={referenceType} onChange={(event) => setReferenceType(event.target.value)}>{referenceTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredReferenceDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid reference-grid">
            {filteredReferenceDocuments.map((document) => (
              <article className="archive-card reference-card" data-record-id={document.id} key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{formatBytes(document.size)}</span></div>
                  <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                  <p className="archive-description">{documentSummary(document)}</p>
                  <div className="dataset-shape">
                    {"pages" in document && document.pages && <span>{document.pages} PDF pages</span>}
                  {document.rows !== null && <span>{document.rows.toLocaleString()} rows</span>}
                  {document.columns > 0 && <span>{document.columns} columns</span>}
                  {document.sheets !== null && <span>{document.sheets} {document.sheets === 1 ? "sheet" : "sheets"}</span>}
                  <span title={document.sha256}>SHA-256 {document.sha256.slice(0, 12)}…</span>
                </div>
                <DocumentPopoutButton document={document} label="View source" open={setSelected} />
              </article>
            ))}
          </div>
          {filteredReferenceDocuments.length === 0 && <p className="document-empty">No reference records match this search.</p>}
        </section>

        <section className="evidence-queue" id="evidence-request-queue" aria-labelledby="evidence-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">EVIDENCE REQUEST QUEUE</p><h2 id="evidence-title">Verified evidence and remaining requests</h2></div>
            <p>Requirements remain open until a source review confirms that the exact record satisfies them. Missing paperwork does not establish that deliveries or other events did not occur; this list tracks documentation still needed.</p>
          </div>
          <div className="queue-review" aria-label="Latest evidence queue review">
            <p><strong>Updated <time dateTime={evidenceQueueUpdates.reviewDate}>{evidenceQueueUpdates.reviewDateLabel}</time></strong> · {remainingEvidenceRequirements} requests still needed across {evidenceRequests.length} blocks · {satisfiedEvidenceRequirements} previously satisfied · {completedEvidenceBlocks} fully completed blocks</p>
            <p>{evidenceQueueUpdates.note}</p>
            <p className="queue-scope">{evidenceQueueUpdates.scope}</p>
          </div>
          <section className="evidence-chain" aria-labelledby="evidence-chain-title">
            <div className="evidence-chain-heading">
              <div><p className="eyebrow">WORK-IN-PROCESS HANDOFF MAP</p><h3 id="evidence-chain-title">Authority → record → next verification</h3></div>
              <p>This is a documentary chain of command: each block shows which record directs or supports the next review step. It is not an organizational chart or a causal conclusion.</p>
            </div>
            <ol className="evidence-chain-list">
              {evidenceChain.map((node, index) => {
                const Icon = meta[node.kind].icon;
                return <li className={`evidence-chain-node chain-${node.status}`} key={node.id}>
                  <div className="evidence-chain-marker"><span>{String(index + 1).padStart(2, "0")}</span><Icon aria-hidden="true" /></div>
                  <div className="evidence-chain-copy">
                    <div className="evidence-chain-topline"><strong>{node.heading}</strong><Badge variant="outline">{node.status === "held" ? "Held" : node.status === "handoff" ? "Handoff" : "Still open"}</Badge></div>
                    <p className="evidence-chain-authority">{node.authority}</p>
                    <p>{node.handoff}</p>
                    <p className="evidence-chain-boundary"><strong>Boundary:</strong> {node.boundary}</p>
                    <div className="evidence-chain-links"><a href={`#${eventAnchor(node.eventTitle)}`}>Open timeline event</a><a href={`#request-${node.requestId}`}>Open WIP block</a></div>
                  </div>
                  {index < evidenceChain.length - 1 && <ArrowDown className="evidence-chain-arrow" aria-hidden="true" />}
                </li>;
              })}
            </ol>
          </section>
          {evidenceRequests.length > 0 ? (
            <div className="request-grid">
              {evidenceRequests.map((request, index) => {
                const update = queueUpdatesByRequest.get(request.id);
                return (
                <article className="request-card" key={request.id} id={`request-${request.id}`}>
                  <div className="request-index"><span>{String(index + 1).padStart(2, "0")}</span><Badge variant="outline">{request.priority}</Badge></div>
                  <p className="request-category">{request.category}</p>
                  <h3>{request.block}</h3>
                  {update && <div className="request-update">
                    <p className="request-update-label">Verified context now held</p>
                    <p>{update.summary}</p>
                    <details className="request-held">
                      <summary>Review {update.held.length} evidence {update.held.length === 1 ? "note" : "notes"} and originals</summary>
                      <ul>{update.held.map((item) => <li key={item.id}>
                        <p>{item.finding}</p>
                        <p className="request-limitation"><strong>Still unresolved:</strong> {item.limitation}</p>
                        <p className="request-tiebacks">Related requests: {item.requirementIds.map((id, index) => {
                          const requirement = request.requirements.find((candidate) => candidate.id === id);
                          return requirement && <span key={id}>{index > 0 ? ", " : ""}<a href={`#requirement-${id}`} aria-label={requirement.label}>{request.requirements.indexOf(requirement) + 1}</a></span>;
                        })}</p>
                        <div className="request-source-links">{item.sources.map((source) => source.document && <DocumentPopoutButton key={`${item.id}-${source.recordId}`} document={source.document} label={source.label} open={setSelected} />)}</div>
                      </li>)}</ul>
                    </details>
                  </div>}
                  <dl>
                    {request.satisfied.length > 0 && <div className="request-satisfied"><dt>Already satisfied</dt><dd><ul className="request-items">{request.satisfied.map((requirement) => <li key={requirement.id} id={`requirement-${requirement.id}`}>
                      <p><strong>{request.requirements.findIndex((item) => item.id === requirement.id) + 1}.</strong> {requirement.label}</p>
                      <DocumentPopoutButton document={requirement.document} label="Review completion evidence" open={setSelected} />
                    </li>)}</ul></dd></div>}
                    <div><dt>Still needed</dt><dd><ul className="request-items">{request.remaining.map((requirement) => <li key={requirement.id} id={`requirement-${requirement.id}`}><strong>{request.requirements.indexOf(requirement) + 1}.</strong> {requirement.label}</li>)}</ul></dd></div>
                    {update && <div className="request-followup"><dt>Next follow-up</dt><dd>{update.followUp}</dd></div>}
                    <div><dt>Completes</dt><dd>{request.completes}</dd></div>
                    <div><dt>Preferred evidence</dt><dd>{request.provide}</dd></div>
                  </dl>
                </article>
              );})}
            </div>
          ) : <p className="request-empty">No outstanding evidence requests remain in the current queue.</p>}
        </section>

        <footer><FileSearch /><p>Documentary event trace. Source attribution and migration opinions require qualified expert review.</p></footer>

        <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="document-dialog" showCloseButton>
            {selected && <>
              <DialogHeader className="document-dialog-header">
                <div><DialogTitle title={selected.name}>{formatSourceDisplayName(selected.displayName ?? selected.name, selected.format, Boolean(selected.url))}</DialogTitle><DialogDescription className="document-meta">{selected.role} · {selected.format}{selected.pages ? ` · ${selected.pages} ${selected.pages === 1 ? "page" : "pages"}` : ""} · Event: {selected.clock.eventStamp} · File created: {selected.clock.created ?? "unavailable"}</DialogDescription></div>
                <div className="document-dialog-actions">
                  <span className="document-preview-status">{selectedPreviewUrl ? (selected.format === "PDF" ? documentPreviewCaption(selected) : "Source content preview") : "File details"}</span>
                  {selectedDownloadUrl && <DocumentDownloadButton key={`${selectedDownloadUrl}-${selected.name}`} name={selected.name} downloadUrl={selectedDownloadUrl} />}
                  {selectedDownloadUrl && <DocumentShareButton key={`${selectedDownloadUrl}-${selected.name}`} name={selected.name} downloadUrl={selectedDownloadUrl} />}
                </div>
              </DialogHeader>
              <div className="document-frame">
                {selectedPreviewUrl ? (
                  <figure className="document-preview-page">
                    <DocumentPreviewImage key={selectedPreviewUrl} src={selectedPreviewUrl} name={selected.name} caption={documentPreviewCaption(selected)} />
                    <figcaption>{documentPreviewCaption(selected)}{selected.pages ? ` · ${selected.pages} total pages in the download` : ""}</figcaption>
                  </figure>
                ) : (
                  <div className="unsupported-document">
                    <FileText />
                    <strong>{selected.format} file details</strong>
                    <p>{selected.result}</p>
                    <p>Use the download arrow above to open the complete preserved file in its compatible application.</p>
                  </div>
                )}
              </div>
            </>}
          </DialogContent>
        </Dialog>
      </main>
    </TooltipProvider>
  );
}
