"use client";

/* eslint-disable @next/next/no-img-element -- document previews are local static evidence assets */

import { useState, type CSSProperties } from "react";
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
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
import complianceDocuments from "./compliance-documents.json";
import correspondenceAudit from "./correspondence-audit.json";
import correspondenceDocuments from "./correspondence-documents.json";
import biosolidsAudit from "./biosolids-audit.json";
import biosolidsDocuments from "./biosolids-documents.json";
import dmrDocuments from "./dmr-documents.json";
import dmrAudit from "./dmr-audit.json";
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
import wexfordAudit from "./wexford-audit.json";
import wexfordDocuments from "./wexford-documents.json";
import { bundledPublicAsset } from "./bundled-public-assets";
import { withPdfStartPage } from "./pdf-source-url";
import { formatSourceDisplayName } from "./source-display-name";
import {
  sourceDocumentUrl,
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
  renderedPages?: string[];
  pages?: number;
  page?: number;
  format: SourceFormat;
  role: "Primary source" | "Source page" | "Referenced—file missing";
  result: string;
  clock: {
    eventStamp: string;
    basis: string;
    created?: string;
    modified?: string;
    note: string;
  };
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
  finding: string;
  significance: string;
  sources: Source[];
};

type LibraryDocument = {
  id: string;
  name: string;
  url: string;
  type: string;
  year?: string;
  category?: string;
  format?: string;
  pages?: number | null;
  description?: string;
};

type LibrarySearchRecord = LibraryDocument & {
  archive: string;
  archiveId: string;
};

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

const librarySearchRecords: LibrarySearchRecord[] = libraryArchives.flatMap((archive) =>
  archive.documents.map((document) => ({
    ...document,
    archive: archive.label,
    archiveId: archive.id,
  })),
);

const repositoryAssetUrl = (path: string) =>
  `https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/6865900390beb6d9123ab515955a46f3b3cc585f/public/${path.replace(/^\//, "")}`;

const pdf = (
  name: string,
  slug: string,
  pages: number,
  result: string,
  clock: Source["clock"],
  url?: string,
): Source => ({
  name,
  url: url ?? repositoryAssetUrl(`/docs/${slug}.pdf`),
  preview: bundledPublicAsset(`/previews/${slug}.jpg`),
  pages,
  format: "PDF",
  role: "Primary source",
  result,
  clock,
});

const sourcePreviewFromUrl = (url: string) => {
  const fileName = url.split("/").pop();
  return fileName
    ? bundledPublicAsset(`/source-previews/${fileName.replace(/\.pdf$/i, ".jpg")}`)
    : undefined;
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
  preview: sourcePreviewFromUrl(url),
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
  preview: sourcePreviewFromUrl(url),
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
    significance: "Establishes the landfill as a regulated Cadillac industrial user and documents significant noncompliance (SNC) years before the PFAS investigation.",
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
    sources: [pdf("2014-10-10 Cadillac Pre-Inspection Report 56545.pdf", "2014-preinspection", 8, "Equalization tank identified as the receiving point for County Landfill leachate.", {
      eventStamp: "2014-10-10 · time not stated",
      basis: "Inspection-record date",
      created: "2015-11-26 20:48:28 CST",
      note: "The complete scan includes the signed completion page. The embedded creation timestamp is later than the inspection; it is retained as file history, not event time.",
    })],
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
    title: "Leachate spill reported during tanker offloading",
    finding: "The City reported that a leachate hose pulled from the receiving point during offloading. The discharge had ended before staff arrived; leachate ran along the asphalt and ponded at a lower elevation. Snow berms, sandbags and packed snow protected the storm drains, and contaminated snow and soil were removed to the WWTP drying beds. The tanker capacity was 10,000 gallons, but the letter states only that less than that amount spilled and gives no measured volume.",
    significance: "Provides the original occurrence time, response, cleanup and prevention record for the previously unresolved 2016 release event.",
    sources: [{
      name: "2016-01-12 spill-notification letter · chronological compilation PDF p. 36",
      url: "https://github.com/cazey43/cadillac-pfas-event-trace/blob/efa59ca098bc5d59adef6edd8705cd336b9fd601/public/compliance-docs/001-32f575fe6fc6.pdf",
      preview: bundledPublicAsset("/compliance-previews/2016-01-12-spill-letter.png"),
      pages: 50,
      page: 36,
      format: "PDF",
      role: "Source page",
      result: "Signed City letter to Jamie Wade describing the leachate release, containment, cleanup and corrective action; received by the Cadillac District Office on January 19, 2016.",
      clock: {
        eventStamp: "2016-01-12 09:22 · zone not stated",
        basis: "Notification-call time stated in the signed letter",
        note: "The hosted source is a 2026 chronological compilation of 48 compliance-file source pages. The spill letter itself is PDF page 36 and retains its January 19, 2016 agency receipt stamp.",
      },
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
    title: "DEQ publishes the proposed groundwater authorization",
    finding: "The public notice identifies proposed permit GW1010342 and the Rule 2210(y) authorization process for the Wexford County Landfill discharge to ground or groundwater.",
    significance: "Documents the formal public-notice stage between application review and final issuance.",
    sources: [pdf("GW Public Notice Document.html", "2016-07-15-gw-public-notice", 1, "One-page public notice; the supplied file exactly matches Category 02 record 076.", {
      eventStamp: "2016-07-15 · time not stated",
      basis: "Date printed in the public notice",
      created: "2016-07-12 15:48:26 EDT",
      note: "The .html-named source is a valid PDF payload. Its creation metadata reflects preparation three days before publication.",
    }, "/npdes-docs/076-a611a75485cf.pdf")],
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
    time: noTime,
    timeBasis: "Meeting date printed in the adopted minutes",
    phase: "Public governance",
    kind: "gap",
    category: "12 · Landfill & leachate",
    title: "Cedar Creek reports missing landfill updates",
    finding: "During public comment, the Cedar Creek Township treasurer told the Wexford County Board that the township was not receiving updates or documents from Infrastructure, referred to RAP-area discussion and asked that Cedar Creek be included in the American Waste discussion concerning the County's yearly fee. The minutes state that the matter would be looked into.",
    significance: "Preserves a contemporaneous public communication concern without converting the statement into a finding that a legally required notice was missed or that a response was completed.",
    sources: [{
      ...archivedSource("Wexford County Board Minutes — Cedar Creek Updates and American Waste Discussion.pdf", "/findings-docs/134-3dc615cfcf9c.pdf", 9, "Nine-page adopted minutes; the relevant public-comment entry appears on PDF page 8.", {
        eventStamp: "2017-04-05 · time not stated",
        basis: "Meeting date printed in the adopted minutes",
        note: "The source records the public statement and the Board's notation that the matter would be looked into. It does not establish a legal-notice violation or preserve a later response.",
      }),
      page: 8,
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
    sources: [archivedSource("HNF-P7H3-DCN87 V1 - IPP PFAS Interim Report.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/49922c706588f236e1edbad5fa8996e4c249e330/public/form-submission-docs/form-submission-073-c84ac8484363.pdf", 3, "Born-digital MiWaters interim submission listing screened facilities, probable-source status and pending sampling.", {
      eventStamp: "2018-07-30 14:49:05 EDT",
      basis: "MiWaters submission-history entry",
      created: "2018-07-30 14:49:08 EDT",
      modified: "2018-07-30 14:49:08 EDT",
      note: "The portal history records submission three seconds before the digitally certified PDF was generated.",
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
    finding: "TestAmerica job J17646-1 reports the landfill leachate PFAS panel, including approximately 590 ng/L PFOA and 120 ng/L PFOS.",
    significance: "Provides the upstream profile for comparison with WWTP effluent and receptor-water results.",
    sources: [pdf("J17646-1 UDS Level 2 Report Final Report (Leachate).pdf", "2018-10-03-j17646-leachate", 23, "Full TestAmerica analytical package for leachate collected October 3, 2018.", {
      eventStamp: "2018-10-03 09:30–09:35 · zone not stated",
      basis: "Laboratory sample collection records",
      created: "2018-10-29 06:51:04 CDT",
      modified: "2018-10-29 06:51:04 CDT",
      note: "The event uses collection time; embedded metadata dates the later final report file.",
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
    date: "2019-06-04",
    isoDate: "2019-06-04T13:15:00",
    time: "13:15–13:17 · zone not stated",
    timeBasis: "Primary and duplicate sample collection",
    phase: "Follow-up sampling",
    kind: "sampling",
    category: "06 · Lab results",
    title: "Leachate-era PFAS remains measurable in effluent",
    finding: "J19915-1 reports PFOA at 16 ng/L and PFOS at approximately 7.8 ng/L, with duplicate, field blank and equipment blank records.",
    significance: "Extends the effluent signature to immediately before reported delivery cessation.",
    sources: [pdf("J19915-1 UDS Level 2 Report Final Report.pdf", "2019-06-04-j19915-effluent", 22, "Full TestAmerica package for Cadillac WWTP effluent collected June 4, 2019.", {
      eventStamp: "2019-06-04 13:15–13:17 · zone not stated",
      basis: "Laboratory sample collection records",
      created: "2019-06-25 14:57:38 CDT",
      modified: "2019-06-25 14:57:38 CDT",
      note: "The event uses collection time; the report states June 21, 2019 13:39 and the PDF package was generated later.",
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
    title: "Cadillac identifies Wexford County Landfill as the source",
    finding: "The MiWaters form states: “We have determined Wexford county landfill is our source.” It records a move to deep-well injection and an end to WWTP deliveries.",
    significance: "Directly identifies the landfill as originator and Cadillac WWTP as historical receiver.",
    sources: [pdf("HNQ-VZP8-TWNRX V1.pdf", "2019-06-28-source-status", 3, "MiWaters status form naming Wexford County Landfill as the confirmed source.", {
      eventStamp: "2019-06-28 15:46:11 EDT",
      basis: "MiWaters submission-history entry",
      created: "2019-06-28 14:46:12 CDT",
      modified: "2019-06-28 14:46:12 CDT",
      note: "The page and embedded metadata express the same approximate instant using different UTC offsets.",
    })],
  },
  {
    year: "2019",
    date: "2019-12",
    isoDate: "2019-12",
    time: noTime,
    timeBasis: "Month-level status record",
    phase: "Post-cessation status",
    kind: "regulatory",
    category: "04 · PFAS monitoring",
    title: "PFAS status reporting continues after cessation",
    finding: "The December 2019 record continues permit-linked PFAS source-reduction reporting after landfill deliveries were reported to have stopped.",
    significance: "Separates the historical receiving period from the monitoring period.",
    sources: [pdf("Cadillac WWTP MI0020257 IPP PFAS Dec 2019 Status.pdf", "2019-12-pfas-status", 5, "December 2019 IPP PFAS status submission for MI0020257.", {
      eventStamp: "2019-12 · exact day/time not stated",
      basis: "Month-level status record",
      created: "2019-12-03 13:44:30 CST",
      modified: "2019-12-04 14:58:08 CST",
      note: "Embedded scan timestamps narrow file history but are not promoted to an event date without a dated source statement.",
    })],
  },
  {
    year: "2020",
    date: "2020-10-22",
    isoDate: "2020-10-22",
    time: noTime,
    timeBasis: "Violation-notice date",
    phase: "Compliance control",
    kind: "compliance",
    category: "08 · Compliance",
    title: "VN-011108 identifies pretreatment deficiencies",
    finding: "EGLE records deficiencies involving legal authority, applicable limits, sampling locations, self-monitoring reporting and discharge-notification requirements.",
    significance: "Bears on program administration; it does not independently prove groundwater migration.",
    sources: [pdf("2020-10-22 VN-011108 Cadillac WWTP (1).pdf", "2020-10-22-vn-011108", 5, "EGLE IPP Reconnaissance Evaluation and Violation Notice VN-011108.", {
      eventStamp: "2020-10-22 · time not stated",
      basis: "Violation-notice date",
      created: "2020-10-22 14:40:46 CDT",
      modified: "2020-10-22 14:41:21 CDT",
      note: "Embedded metadata records PDF production; the notice text gives no issuance time.",
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
    date: "2025-03-04",
    isoDate: "2025-03-04",
    time: noTime,
    timeBasis: "Collection date carried in source filename/result",
    phase: "Receptor discovery",
    kind: "receptor",
    category: "13 · Groundwater & wells",
    title: "PFAS detected at 1140 Plett Road",
    finding: "The owner-commissioned Cyclopure result documents a multi-compound pattern in warehouse well water, including PFOA, PFOS, PFHxS and PFBS.",
    significance: "Creates the receptor-side result for comparison with source and pathway records.",
    sources: [pdf("TEST #1 - 3-4-2025 CYCLOPURE - SELF TESTING.pdf", "2025-03-cyclopure-property", 3, "Original Cyclopure property-water result from March 4, 2025.", {
      eventStamp: "2025-03-04 · time not stated",
      basis: "Collection date carried in source filename/result",
      created: "2025-11-08 08:32:41 CST",
      modified: "2025-11-08 08:32:41 CST",
      note: "The embedded timestamp reflects a later scan and is not the sampling time.",
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
    year: "2014",
    date: "2014-06-14",
    isoDate: "2014-06-14",
    time: noTime,
    timeBasis: "EPA data-run date",
    phase: "Federal noncompliance reporting",
    kind: "compliance",
    category: "13 · Compliance & enforcement",
    title: "EPA ICIS report records overdue Cadillac DMR",
    finding: "The January–March 2014 QNCR detail row records a Cadillac WWTP DMR overdue to EPA/State for outfall 001, violation date December 31, 2013, status date February 20, 2014 and code 2D reporting violation.",
    significance: "Adds the primary federal status row and distinguishes a reporting violation from a pollutant-limit exceedance. The row states that no enforcement action or final order is linked.",
    sources: [archivedSource("EPA ICIS Michigan Second-Quarter 2014 QNCR.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/0355e48fffbcaaa07b108c2346423e3aeee32296/public/findings-docs/002-2ee7fa5b072b.pdf", 50, "Cadillac-specific detail appears on PDF page 2.", {
      eventStamp: "2014-06-14 · time not stated",
      basis: "EPA ICIS data-run and refresh date",
      note: "The underlying violation and status dates are December 31, 2013 and February 20, 2014, respectively.",
    })],
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
    significance: "Provides a later agency synthesis of facility systems and changes while distinguishing permit history from direct sampling evidence.",
    sources: [archivedSource("N3862 Renewable Operating Permit Staff Report.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/0355e48fffbcaaa07b108c2346423e3aeee32296/public/findings-docs/005-0f46024ab583.pdf", 8, "August 15 staff report with September 15 addendum for MI-ROP-N3862-2022.", {
      eventStamp: "2022-08-15 · time not stated",
      basis: "Staff-report date printed on the title page",
      note: "The September 15 addendum states no pertinent public comments were received and makes no changes to the draft ROP.",
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
    title: "Cadillac advances a CWSRF WWTP planning package",
    finding: "The Council communication recommends a $36,800 F&V project plan for potential FY2027 CWSRF funding. The proposal identifies candidate work at the headworks, blowers, UV system, solids handling, biogas facilities and aging site structures and requires alternatives analysis before selecting a project.",
    significance: "Documents planned infrastructure evaluation and possible future improvements. It is a planning proposal, not proof that construction, funding or a final project scope was approved.",
    sources: [archivedSource("Cadillac WWTP CWSRF Project Plan and Funding Proposal.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/0355e48fffbcaaa07b108c2346423e3aeee32296/public/findings-docs/007-238cf9655b70.pdf", 9, "Council communication, January 8 engineering proposal, project-plan outline and 2013 professional-services agreement.", {
      eventStamp: "2026-02-02 · time not stated",
      basis: "Council communication date",
      note: "The proposal anticipated an April draft and May 1, 2026 submission deadline; completion is not inferred from this source.",
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
    year: "2009",
    date: "2009-09-08",
    isoDate: "2009-09-08",
    time: noTime,
    timeBasis: "Special-meeting date",
    phase: "Leachate service agreement",
    kind: "operation",
    category: "12 · Landfill & leachate",
    title: "Council approves Wexford landfill leachate treatment agreement",
    finding: "The special-meeting minutes record unanimous approval of an agreement for Cadillac to accept and treat Wexford County Landfill leachate. The agreement was effective July 1, 2009 through June 30, 2011 and used a reduced sliding-scale rate based on pretreatment.",
    significance: "Provides direct official evidence that the City formally approved the landfill-to-WWTP treatment relationship years before the PFAS source investigation.",
    sources: [archivedSource("September 8 2009 Special Meeting Minutes.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/e792937dad5338952723a5b79b1a2f51f9ddae5e/public/findings-docs/008-5b67e1ed1d5c.pdf", 6, "Motion 2009.216 approves miscellaneous file 842 on PDF page 2.", {
      eventStamp: "2009-09-08 · time not stated",
      basis: "Date of the official special-meeting minutes",
      note: "Separate well-field planning in the same minutes is not characterized as PFAS evidence.",
    })],
  },
  {
    year: "2019",
    date: "2019-06-30",
    isoDate: "2019-06-30",
    time: noTime,
    timeBasis: "Fiscal-year end",
    phase: "Audited financial reporting",
    kind: "operation",
    category: "10 / 12 · Process, landfill & leachate",
    title: "Audited report corroborates landfill-leachate treatment revenue",
    finding: "Cadillac's FY2019 comprehensive annual financial report states that revenue from treatment of Wexford County Landfill leachate exceeded budget by $44,691.",
    significance: "Financially corroborates that leachate treatment was occurring in the fiscal year. The report does not provide gallons received, PFAS concentrations or treatment effectiveness.",
    sources: [archivedSource("City of Cadillac FY2019 CAFR.pdf", "https://github.com/cazey43/cadillac-pfas-event-trace/blob/e792937dad5338952723a5b79b1a2f51f9ddae5e/public/findings-docs/013-f756ecea1687.pdf", 187, "Management's discussion and analysis on PDF page 25 reports the landfill-leachate treatment revenue variance.", {
      eventStamp: "Fiscal year ended 2019-06-30 · time not stated",
      basis: "Audited-report fiscal period",
      note: "The dollar amount is a budget variance, not total leachate revenue or treatment volume.",
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
];

const meta: Record<Kind, { label: string; icon: typeof Factory }> = {
  operation: { label: "Operation", icon: Factory },
  regulatory: { label: "Regulatory", icon: Landmark },
  sampling: { label: "Source / pathway result", icon: FlaskConical },
  compliance: { label: "Compliance", icon: FileSearch },
  receptor: { label: "Receptor result", icon: Waves },
  gap: { label: "Evidence gap", icon: AlertTriangle },
};

const evidenceRequests = [
  {
    priority: "Complete package",
    block: "2025 receptor sampling",
    category: "04 / 06 / 13 · Monitoring, lab, wells",
    missing: "Full 49-page EGLE Work Order 2509147",
    completes: "Restores sample IDs, collection/receipt times, methods, qualifiers, chain of custody and laboratory QA/QC.",
    provide: "The complete PDF rather than an extracted result-page image.",
  },
  {
    priority: "Time-series input",
    block: "Landfill → WWTP receiving history",
    category: "10 / 12 · Process, landfill & leachate",
    missing: "Leachate manifests, hauler tickets, invoices and WWTP receiving logs for the receiving period through July 2019",
    completes: "Creates a dated delivery series with load volume, frequency, hauler, receiving point and delivery cessation.",
    provide: "CSV/XLSX preferred; PDFs or scans are acceptable if each page preserves its date, time and volume.",
  },
  {
    priority: "Pathway input",
    block: "WWTP treatment and discharge",
    category: "01 / 04 / 05 / 06 · DMR, PFAS, biosolids, lab",
    missing: "Time-stamped influent, effluent and sludge/biosolids PFAS results aligned with daily plant flow and DMR records",
    completes: "Tests loading, treatment lag, attenuation, biosolids partitioning and discharge timing instead of relying on isolated samples.",
    provide: "Native lab reports plus tables containing sample date/time, sample point, analyte, result, unit, detection limit and qualifier.",
  },
  {
    priority: "Hydrogeologic input",
    block: "Subsurface migration pathway",
    category: "13 / 14 / 19 · Wells, maps, technical literature",
    missing: "Well construction logs, boring logs, screened intervals, surveyed elevations, water levels, hydraulic tests and groundwater-flow maps",
    completes: "Defines aquifer units, gradient, travel direction, possible capture zones and whether the proposed pathway is physically plausible.",
    provide: "Original reports plus GIS/CAD/CSV data where available; include coordinate system, units and measurement dates.",
  },
  {
    priority: "Receptor series",
    block: "Plett Road well results",
    category: "06 / 13 · Lab results, groundwater & wells",
    missing: "Original digital reports and chain-of-custody forms for every Plett Road sample, including exact collection time",
    completes: "Creates a comparable receptor series with consistent analytes, limits, qualifiers and sample identity.",
    provide: "Unflattened original PDFs/CSVs where possible; include sampler, well ID, collection time, receipt time and preservation details.",
  },
  {
    priority: "Attribution test",
    block: "Source-to-receptor confirmation",
    category: "04 / 06 / 13 / 14 · Monitoring, lab, wells, maps",
    missing: "Synchronized upgradient, cross-gradient and downgradient PFAS sampling between the candidate sources and Plett Road",
    completes: "Tests whether concentrations and PFAS fingerprints form a spatially coherent plume and helps evaluate alternative sources.",
    provide: "Sampling plan, GPS locations, well construction data, field parameters, COC, blanks/duplicates and full analytical packages.",
  },
];

function SourceButton({ source, open }: { source: Source; open: (source: Source) => void }) {
  const linked = Boolean(source.url);
  const sourceUrl = source.url
    ? sourceDocumentUrl(source.url, source.format, (url) => withPdfStartPage(url, source.page))
    : undefined;
  const external = Boolean(sourceUrl?.startsWith("https://github.com/"));
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewUrl = sourcePreviewUrl(source);
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
      {linked && <ExternalLink className="source-open-icon" />}
    </>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {external
          ? <a className="source-button" href={sourceUrl} target="_blank" rel="noreferrer">{triggerContents}</a>
          : <button type="button" className="source-button" aria-disabled={!linked} disabled={!linked} onClick={() => linked && open(source)}>{triggerContents}</button>}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12} className="source-tooltip">
        {previewAvailable ? <img src={previewUrl} alt={`Source-page preview of ${displayName}`} className="source-preview" onError={() => setPreviewFailed(true)} /> : <div className={`missing-preview missing-preview--${mediaKind}`}>{formatIcon}<span>{source.format} preview not available</span><small>The complete source can still be opened below.</small></div>}
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
          <p className="source-hint">{linked ? external ? "Click to open the complete archived source in a new tab." : "Click to open the complete source in this window." : "Exact filename preserved; source acquisition required."}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<Source | null>(null);
  const [globalQuery, setGlobalQuery] = useState("");
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
  const [referenceType, setReferenceType] = useState("All datasets");
  const groups = Array.from(events.reduce<Map<string, Event[]>>((acc, event) => {
    const group = acc.get(event.year) ?? [];
    group.push(event);
    acc.set(event.year, group);
    return acc;
  }, new Map()))
    .map(([year, items]) => ({ year, items: [...items].sort((a, b) => (a.isoDate ?? a.date).localeCompare(b.isoDate ?? b.date)) }))
    .sort((a, b) => Number(a.year) - Number(b.year));
  const sourceCount = events.reduce((count, event) => count + event.sources.length, 0);
  const globalSearchTerms = globalQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const globalSearchResults = globalSearchTerms.length === 0
    ? []
    : librarySearchRecords.filter((document) => {
        const searchable = `${document.name} ${document.year ?? ""} ${document.category ?? ""} ${document.type} ${document.format ?? ""} ${document.description ?? ""} ${document.archive}`.toLowerCase();
        return globalSearchTerms.every((term) => searchable.includes(term));
      });
  const visibleGlobalResults = globalSearchResults.slice(0, 100);
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
  const processSiteTypes = ["All process and site records", ...Array.from(new Set(processSiteDocuments.map((document) => document.type)))];
  const normalizedProcessSiteQuery = processSiteQuery.trim().toLowerCase();
  const filteredProcessSiteDocuments = processSiteDocuments.filter((document) => {
    const matchesType = processSiteType === "All process and site records" || document.type === processSiteType;
    const matchesQuery = !normalizedProcessSiteQuery || `${document.name} ${document.year} ${document.type} ${document.description}`.toLowerCase().includes(normalizedProcessSiteQuery);
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
  const referenceTypes = ["All datasets", ...Array.from(new Set(referenceDocuments.map((document) => document.type)))];
  const normalizedReferenceQuery = referenceQuery.trim().toLowerCase();
  const filteredReferenceDocuments = referenceDocuments.filter((document) => {
    const matchesType = referenceType === "All datasets" || document.type === referenceType;
    const matchesQuery = !normalizedReferenceQuery || `${document.name} ${document.format} ${document.type}`.toLowerCase().includes(normalizedReferenceQuery);
    return matchesType && matchesQuery;
  });
  return (
    <TooltipProvider delayDuration={120}>
      <main className="site-shell">
        <header className="trace-header">
          <div>
            <p className="eyebrow">MI0020257 · SOURCE-LINKED RECORD</p>
            <h1>Cadillac PFAS Event Tracer</h1>
            <p className="header-copy">Follow the hierarchy from year to event timestamp to the exact source document, with separate clocks for the event, the issued record and embedded file metadata.</p>
          </div>
          <div className="integrity-note">
            <img className="integrity-logo" src={bundledPublicAsset("/blax-water-logo.png")} alt="BLAX Water" decoding="async" />
            <div className="integrity-note-copy"><CheckCircle2 aria-hidden="true" /><div><strong>Original-source rule</strong><span>Hover a filename for its source-page preview and result. Click to open the complete document.</span></div></div>
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
            <p>Search every archive at once by filename, year, category, record type, format or finding.</p>
          </div>
          <label className="global-search-input">
            <Search aria-hidden="true" />
            <span className="sr-only">Search the complete evidence library</span>
            <input
              type="search"
              value={globalQuery}
              onChange={(event) => setGlobalQuery(event.target.value)}
              placeholder="Search all records — try PFAS, spill, cyanide, 2024…"
              autoComplete="off"
            />
          </label>
          {globalSearchTerms.length > 0 && (
            <div className="global-search-results" aria-live="polite">
              <p className="global-search-summary">
                <strong>{globalSearchResults.length.toLocaleString()}</strong> matching {globalSearchResults.length === 1 ? "record" : "records"}
                {globalSearchResults.length > visibleGlobalResults.length && <span> · showing the first {visibleGlobalResults.length}</span>}
              </p>
              {visibleGlobalResults.length > 0 ? (
                <div className="global-search-grid">
                  {visibleGlobalResults.map((document) => (
                    <article className="global-search-card" key={`${document.archiveId}-${document.id}`}>
                      <div className="archive-meta"><Badge variant="outline">{document.archive}</Badge><span>{document.type}</span>{document.year && <span>{document.year}</span>}{document.format && <span>{document.format}</span>}</div>
                      <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                      {document.description && <p>{document.description}</p>}
                      <Button asChild variant="outline" size="sm"><a href={withPdfStartPage(document.url)} target="_blank" rel="noreferrer">Open record<ExternalLink /></a></Button>
                    </article>
                  ))}
                </div>
              ) : <p className="document-empty">No records match this search.</p>}
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
          <p>Regulatory documents provide context; they do not independently prove contaminant migration. Groundwater attribution remains subject to hydrogeologic confirmation.</p>
        </section>

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
                    <article className="trace-row" data-kind={event.kind} key={`${event.date}-${event.title}`}>
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
                          {event.title}
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

        <section className="document-library" aria-labelledby="document-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">DISCHARGE MONITORING ARCHIVE</p><h2 id="document-library-title">Search {dmrDocuments.length} DMR and QA records</h2></div>
            <p>The supplied Cadillac WWTP collection is preserved here as downloadable source files. Original filenames remain visible for provenance, while only confirmed content duplicates are suppressed.</p>
          </div>
          <details className="audit-details archive-audit">
            <summary>Review DMR duplicate audit history</summary>
            <div className="audit-panel">
              <p>{dmrAudit.methods.join(" · ")}</p>
              <ul>{dmrAudit.batches.map((batch) => <li key={batch.label}><strong>{batch.label}: {batch.added} added, {batch.duplicates} duplicates</strong><span>{batch.note}</span></li>)}</ul>
            </div>
          </details>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search documents</span><input value={documentQuery} onChange={(event) => setDocumentQuery(event.target.value)} placeholder="Search filename, year or record type" /></label>
            <label className="document-filter"><span className="sr-only">Filter by record type</span><select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>{documentTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid">
            {filteredDocuments.map((document) => (
              <article className="archive-card" key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><span>{document.year}</span><span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span><span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <Button asChild variant="outline" size="sm"><a href={withPdfStartPage(document.url)} target="_blank" rel="noreferrer">Open PDF<ExternalLink /></a></Button>
              </article>
            ))}
          </div>
          {filteredDocuments.length === 0 && <p className="document-empty">No documents match this search.</p>}
        </section>

        <section className="document-library permit-library" aria-labelledby="permit-library-title">
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
              <article className="archive-card" key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span>{document.pages !== null && <span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span>}<span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                {document.format === "PDF"
                  ? <Button asChild variant="outline" size="sm"><a href={withPdfStartPage(document.url)} target="_blank" rel="noreferrer">Open PDF<ExternalLink /></a></Button>
                  : <Button asChild variant="outline" size="sm"><a href={document.url} download={document.name}>Download MSG<Download /></a></Button>}
              </article>
            ))}
          </div>
          {filteredPermitDocuments.length === 0 && <p className="document-empty">No permit records match this search.</p>}
        </section>

        <section className="document-library permit-library" aria-labelledby="ipp-library-title">
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
              <article className="archive-card" key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span><span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span><span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{document.description}</p>
                <Button asChild variant="outline" size="sm"><a href={withPdfStartPage(document.url)} target="_blank" rel="noreferrer">Open PDF<ExternalLink /></a></Button>
              </article>
            ))}
          </div>
          {filteredIppDocuments.length === 0 && <p className="document-empty">No industrial pretreatment records match this search.</p>}
        </section>

        <section className="document-library permit-library" aria-labelledby="pfas-library-title">
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
              <article className="archive-card" key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span>{document.pages !== null && <span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span>}<span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{document.description}</p>
                <Button asChild variant="outline" size="sm"><a href={withPdfStartPage(document.url)} target="_blank" rel="noreferrer">{document.format === "PDF" ? "Open PDF" : document.format === "PNG" ? "Open image" : document.format === "XLSX" ? "Open workbook" : "Download MSG"}{document.format === "MSG" ? <Download /> : <ExternalLink />}</a></Button>
              </article>
            ))}
          </div>
          {filteredPfasDocuments.length === 0 && <p className="document-empty">No PFAS monitoring records match this search.</p>}
        </section>

        <section className="document-library permit-library" aria-labelledby="biosolids-library-title">
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
              <article className="archive-card" key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span>{document.pages !== null && <span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span>}<span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{document.description}</p>
                <Button asChild variant="outline" size="sm"><a href={withPdfStartPage(document.url)} target="_blank" rel="noreferrer">{document.format === "PDF" ? "Open PDF" : "Open image"}<ExternalLink /></a></Button>
              </article>
            ))}
          </div>
          {filteredBiosolidsDocuments.length === 0 && <p className="document-empty">No biosolids or land-application records match this search.</p>}
        </section>

        <section className="document-library permit-library" aria-labelledby="lab-library-title">
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
              <article className="archive-card" key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span><span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span><span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{document.description}</p>
                <Button asChild variant="outline" size="sm"><a href={withPdfStartPage(document.url)} target="_blank" rel="noreferrer">Open PDF<ExternalLink /></a></Button>
              </article>
            ))}
          </div>
          {filteredLabDocuments.length === 0 && <p className="document-empty">No laboratory or sampling records match this search.</p>}
        </section>

        <section className="document-library permit-library" aria-labelledby="wexford-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 12 · WEXFORD LANDFILL &amp; RULE 2210(y) RECORDS</p><h2 id="wexford-library-title">Search {wexfordDocuments.length} verified records</h2></div>
            <p>This source set preserves the groundwater-discharge, landfill-gas, air-permit, compliance, county, leachate, stormwater and site-history record. Exact matches already indexed elsewhere are reused instead of republished, while substantive revisions remain available separately.</p>
          </div>
          <div className="reference-summary" aria-label="Wexford landfill archive audit summary">
            <div><FileText /><span><strong>{wexfordAudit.stats.recordsAddedThisPass}</strong> added in this pass</span></div>
            <div><CheckCircle2 /><span><strong>{wexfordAudit.stats.exactExistingRecordsReused}</strong> exact records reused</span></div>
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
              <article className="archive-card" key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span>{document.pages !== null && <span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span>}<span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{document.description}</p>
                <Button asChild variant="outline" size="sm"><a href={withPdfStartPage(document.url)} target="_blank" rel="noreferrer">{document.format === "PDF" ? "Open PDF" : "Open source"}<ExternalLink /></a></Button>
              </article>
            ))}
          </div>
          {filteredWexfordDocuments.length === 0 && <p className="document-empty">No Wexford landfill records match this search.</p>}
        </section>

        <section className="document-library permit-library" aria-labelledby="compliance-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 08 · COMPLIANCE &amp; ENFORCEMENT · VERIFIED AUGUST 27, 2026</p><h2 id="compliance-library-title">Search {complianceDocuments.length} verified compliance records</h2></div>
            <p>This category preserves agency evaluations, violation notices, significant noncompliance (SNC) material, spill and bypass notifications, exceedance reports, correspondence, source-order extracts and photographed attachments. Every supplied page was read with embedded text or OCR; only records already preserved elsewhere and analyst-authored derivative reports are excluded.</p>
          </div>
          <div className="reference-summary" aria-label="Compliance and enforcement archive audit summary">
            <div><FileText /><span><strong>{complianceAudit.stats.finalDistinctRecords}</strong> distinct records</span></div>
            <div><CheckCircle2 /><span><strong>{complianceAudit.stats.ocrPages}</strong> OCR pages verified</span></div>
            <div><FileSearch /><span><strong>{formatBytes(complianceAudit.stats.publishedBytes)}</strong> published</span></div>
          </div>
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
              <article className="archive-card" key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span>{document.pages !== null && <span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span>}<span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{document.description}</p>
                <Button asChild variant="outline" size="sm"><a href={withPdfStartPage(document.url)} target="_blank" rel="noreferrer">{document.format === "PDF" ? "Open PDF" : ["JPG", "JPEG", "PNG"].includes(document.format) ? "Open image" : "Open source"}<ExternalLink /></a></Button>
              </article>
            ))}
          </div>
          {filteredComplianceDocuments.length === 0 && <p className="document-empty">No compliance records match this search.</p>}
        </section>

        <section className="document-library permit-library" aria-labelledby="correspondence-library-title">
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
              <article className="archive-card" key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span><span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span><span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{document.description}</p>
                <Button asChild variant="outline" size="sm"><a href={withPdfStartPage(document.url)} target="_blank" rel="noreferrer">{document.format === "PDF" ? "Open PDF" : "Open image"}<ExternalLink /></a></Button>
              </article>
            ))}
          </div>
          {filteredCorrespondenceDocuments.length === 0 && <p className="document-empty">No correspondence records match this search.</p>}
        </section>

        <section className="document-library permit-library" aria-labelledby="process-site-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 10 · PROCESS &amp; SITE DOCUMENTS · VERIFIED AUGUST 28, 2026</p><h2 id="process-site-library-title">Search {processSiteDocuments.length} verified process and site records</h2></div>
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
              <article className="archive-card" key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span><span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span><span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{document.description}</p>
                <Button asChild variant="outline" size="sm"><a href={withPdfStartPage(document.url)} target="_blank" rel="noreferrer">Open PDF<ExternalLink /></a></Button>
              </article>
            ))}
          </div>
          {filteredProcessSiteDocuments.length === 0 && <p className="document-empty">No process or site records match this search.</p>}
        </section>

        <section className="document-library permit-library" aria-labelledby="form-submission-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 11 · ONLINE FORM SUBMISSIONS · VERIFIED AUGUST 28, 2026</p><h2 id="form-submission-library-title">Search {formSubmissionDocuments.length} verified portal submissions</h2></div>
            <p>MiWaters and MiEnviro copies of record are organized by submission date, form title, submission ID and version. The archive includes PFAS effluent and biosolids monitoring, IPP and biosolids annual reports, compliance responses, certifications, approvals, stormwater forms and a discharge report. Every supplied page was read through embedded text or OCR, and corrected versions remain separate from true duplicate exports.</p>
          </div>
          <div className="reference-summary" aria-label="Online form submissions archive audit summary">
            <div><FileText /><span><strong>{formSubmissionAudit.stats.finalDistinctRecords}</strong> distinct records</span></div>
            <div><Database /><span><strong>Early-stage uploads</strong> pending catalog review</span></div>
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
              <article className="archive-card" key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{document.year}</span><span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span><span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{document.description}</p>
                <Button asChild variant="outline" size="sm"><a href={withPdfStartPage(document.url)} target="_blank" rel="noreferrer">Open PDF<ExternalLink /></a></Button>
              </article>
            ))}
          </div>
          {filteredFormSubmissionDocuments.length === 0 && <p className="document-empty">No online form submissions match this search.</p>}
        </section>

        <section className="document-library permit-library" aria-labelledby="supplemental-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CROSS-CATEGORY ADDITIONS · VERIFIED AUGUST 29, 2026</p><h2 id="supplemental-library-title">Search {supplementalDocuments.length} added records</h2></div>
            <p>These additions span federal compliance, landfill operations, civic actions, audited finances, historical groundwater context and response planning. Primary records, historical context and secondary research are explicitly distinguished; related records remain separate when their official edition, content or evidentiary role differs.</p>
          </div>
          <div className="reference-summary" aria-label="Cross-category additions audit summary">
            <div><FileText /><span><strong>{supplementalAudit.stats.newDistinctRecords}</strong> distinct additions</span></div>
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
              <article className="archive-card" key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.category}</Badge><Badge variant="outline">{document.type}</Badge><span>{document.year}</span><span>{document.pages} {document.pages === 1 ? "page" : "pages"}</span><span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <p className="archive-description">{document.description}</p>
                <Button asChild variant="outline" size="sm"><a href={withPdfStartPage(document.url)} target="_blank" rel="noreferrer">{document.format === "PDF" ? "Open PDF" : ["JPG", "JPEG", "PNG"].includes(document.format) ? "Open image" : "Open source"}<ExternalLink /></a></Button>
              </article>
            ))}
          </div>
          {filteredSupplementalDocuments.length === 0 && <p className="document-empty">No added records match this search.</p>}
        </section>

        <section className="document-library reference-library" aria-labelledby="reference-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">CATEGORY 00 · REFERENCE DATA</p><h2 id="reference-library-title">Search 106 verified datasets</h2></div>
            <p>CSV exports, workbooks, manifests and research indexes are preserved as direct downloads. Each file was compared by content and structure before publishing.</p>
          </div>
          <div className="reference-summary" aria-label="Reference data audit summary">
            <div><Database /><span><strong>{referenceAudit.publishedFileCount}</strong> distinct files</span></div>
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
            <span className="document-result-count"><strong>{filteredReferenceDocuments.length}</strong> matching datasets</span>
          </div>
          <div className="document-grid reference-grid">
            {filteredReferenceDocuments.map((document) => (
              <article className="archive-card reference-card" key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><Badge variant="outline">{document.format}</Badge><span>{formatBytes(document.size)}</span></div>
                <h3 title={document.name}>{formatSourceDisplayName(document.name, document.format, true)}</h3>
                <div className="dataset-shape">
                  {document.rows !== null && <span>{document.rows.toLocaleString()} rows</span>}
                  {document.columns > 0 && <span>{document.columns} columns</span>}
                  {document.sheets !== null && <span>{document.sheets} {document.sheets === 1 ? "sheet" : "sheets"}</span>}
                  <span title={document.sha256}>SHA-256 {document.sha256.slice(0, 12)}…</span>
                </div>
                <Button asChild variant="outline" size="sm"><a href={document.url} download={document.name}>Download<Download /></a></Button>
              </article>
            ))}
          </div>
          {filteredReferenceDocuments.length === 0 && <p className="document-empty">No reference datasets match this search.</p>}
        </section>

        <section className="evidence-queue" aria-labelledby="evidence-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">EVIDENCE REQUEST QUEUE</p><h2 id="evidence-title">Potentially missing or hidden documents</h2></div>
            <p>Upload these records in this chat using the filenames shown. Each source can be inserted under its year, event timestamp and pathway block without changing the underlying event record.</p>
          </div>
          <div className="request-grid">
            {evidenceRequests.map((request, index) => (
              <article className="request-card" key={request.block}>
                <div className="request-index"><span>{String(index + 1).padStart(2, "0")}</span><Badge variant="outline">{request.priority}</Badge></div>
                <p className="request-category">{request.category}</p>
                <h3>{request.block}</h3>
                <dl>
                  <div><dt>Missing file / data</dt><dd>{request.missing}</dd></div>
                  <div><dt>Completes</dt><dd>{request.completes}</dd></div>
                  <div><dt>What to provide</dt><dd>{request.provide}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <footer><FileSearch /><p>Documentary event trace. Source attribution and migration opinions require qualified expert review.</p></footer>

        <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="document-dialog" showCloseButton>
            {selected && <>
              <DialogHeader className="document-dialog-header">
                <div><DialogTitle title={selected.name}>{formatSourceDisplayName(selected.displayName ?? selected.name, selected.format, Boolean(selected.url))}</DialogTitle><DialogDescription className="document-meta">{selected.role} · {selected.format}{selected.pages ? ` · ${selected.pages} ${selected.pages === 1 ? "page" : "pages"}` : ""} · Event: {selected.clock.eventStamp} · File created: {selected.clock.created ?? "unavailable"}</DialogDescription></div>
                <Button asChild variant="outline" size="sm"><a href={sourceDocumentUrl(selected.url, selected.format, (url) => withPdfStartPage(url, selected.page))} target="_blank" rel="noreferrer">Open separately<ExternalLink /></a></Button>
              </DialogHeader>
              <div className={`document-frame${selected.renderedPages ? " rendered-document-frame" : ""}`}>
                {selected.renderedPages ? (
                  <div className="document-pages" aria-label={`Rendered pages of ${selected.name}`}>
                    {selected.renderedPages.map((page, index) => (
                      <figure key={page} className="document-page">
                        <img src={page} alt={`${selected.name}, page ${index + 1} of ${selected.renderedPages?.length}`} loading={index === 0 ? "eager" : "lazy"} decoding="async" />
                        <figcaption>Page {index + 1} of {selected.renderedPages.length}</figcaption>
                      </figure>
                    ))}
                  </div>
                ) : sourceMediaKind(selected.format) === "pdf" ? (
                  <iframe title={`Full document: ${selected.name}`} src={sourceDocumentUrl(selected.url, selected.format, (url) => withPdfStartPage(url, selected.page, true))} />
                ) : sourceMediaKind(selected.format) === "html" ? (
                  <iframe title={`Full HTML document: ${selected.name}`} src={sourceDocumentUrl(selected.url, selected.format, (url) => withPdfStartPage(url, selected.page))} />
                ) : sourceMediaKind(selected.format) === "image" ? (
                  <img src={sourceDocumentUrl(selected.url, selected.format, (url) => withPdfStartPage(url, selected.page))} alt={`Full source image: ${selected.name}`} />
                ) : (
                  <div className="unsupported-document">
                    <FileText />
                    <strong>{selected.format} files open in a separate viewer.</strong>
                    <p>Use the Open separately button to view or download the complete source.</p>
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
