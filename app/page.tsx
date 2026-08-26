"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  Factory,
  FileSearch,
  FileText,
  FlaskConical,
  Landmark,
  Search,
  Waves,
} from "lucide-react";
import dmrDocuments from "./dmr-documents.json";
import referenceAudit from "./reference-audit.json";
import referenceDocuments from "./reference-documents.json";
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
  url?: string;
  preview?: string;
  pages?: number;
  format: "PDF" | "PNG";
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

const pdf = (
  name: string,
  slug: string,
  pages: number,
  result: string,
  clock: Source["clock"],
): Source => ({
  name,
  url: `/docs/${slug}.pdf`,
  preview: `/previews/${slug}.jpg`,
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
    sources: [pdf("2014-10-10_Cadillac_Pre-Inspection_Report_56545.pdf", "2014-preinspection", 7, "Equalization tank identified as the receiving point for County Landfill leachate.", {
      eventStamp: "2014-10-10 · time not stated",
      basis: "Inspection-record date",
      created: "2015-11-26 20:48:28 CST",
      note: "The embedded creation timestamp is later than the inspection; it is retained as file history, not event time.",
    })],
  },
  {
    year: "2015–2016",
    date: "2015–2016",
    time: noTime,
    timeBasis: "Documented interval; exact day unavailable",
    phase: "Leachate management",
    kind: "operation",
    category: "12 · Landfill & leachate",
    title: "Landfill leachate request enters the record",
    finding: "Wexford County Landfill leachate management and disposal arrangements were documented during the continuing WWTP receiving period.",
    significance: "Connects landfill-generated liquid waste to Cadillac receiving and treatment records.",
    sources: [pdf("2015-2016_Wexford County Landfill_Leachate Request.pdf", "2015-2016-leachate-request", 3, "Recovered three-page landfill leachate request record.", {
      eventStamp: "2015–2016 · exact day/time not stated",
      basis: "Interval stated by source record",
      created: "2025-03-06 08:29:43 CST",
      modified: "2025-03-06 08:29:51 CST",
      note: "These are later digitization timestamps and do not date the underlying leachate request.",
    })],
  },
  {
    year: "2016",
    date: "2016-01-12",
    isoDate: "2016-01-12",
    time: noTime,
    timeBasis: "Date carried in the cited filename",
    phase: "Reported release",
    kind: "gap",
    category: "09 · Correspondence",
    title: "Spill notification referenced; original file not loaded",
    finding: "The compiled evidence set cites a leachate offloading spill at the WWTP yard. The exact filename is known, but the original is absent from the current 101-document source folder.",
    significance: "Preserved as an acquisition target; no reconstructed document is substituted.",
    sources: [{ name: "Spill notification 1-12-16.pdf", format: "PDF", role: "Referenced—file missing", result: "Exact cited filename retained; the original file is still required.", clock: {
      eventStamp: "2016-01-12 · time not stated",
      basis: "Date carried in cited filename",
      note: "The original file is absent, so embedded creation and modification timestamps cannot be verified.",
    } }],
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
    })],
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
      pdf("09102025_Analyte Original Cyclopure Test Kit Results (collected .pdf", "2025-09-cyclopure-property", 1, "Original one-page Cyclopure result for September 10, 2025.", {
        eventStamp: "2025-09-10 · time not stated",
        basis: "Collection date carried in source result",
        created: "2026-04-29 09:37:39 CDT",
        modified: "2026-04-29 09:37:39 CDT",
        note: "The embedded timestamp reflects later scanning and is not the sampling time.",
      }),
      { name: "EGLE-TEST-2509147-LAB-WORK-ORDER.png", url: "/docs/2025-egle-work-order-2509147-page.png", preview: "/previews/2025-egle-work-order-2509147-page.png", pages: 1, format: "PNG", role: "Source page", result: "Available EGLE result page; the full 49-page Work Order remains an acquisition target.", clock: {
        eventStamp: "2025-09-10 · time not stated",
        basis: "Associated sampling-result date",
        note: "Original embedded source timestamp is unavailable for this extracted page; workspace export time is excluded from evidence.",
      } },
    ],
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
    priority: "Required original",
    block: "2016 reported release",
    category: "09 · Correspondence & letters",
    missing: "Spill notification 1-12-16.pdf",
    completes: "Confirms the reported occurrence time, release location, quantity, notifications, response and cleanup record.",
    provide: "The exact original PDF; related incident report, photographs, cleanup log or email chain if maintained separately.",
  },
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
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant={linked ? "outline" : "secondary"} size="sm" className="source-button" aria-disabled={!linked} onClick={() => linked && open(source)}>
          {linked ? <FileText /> : <AlertTriangle />}
          <span>{source.name}</span>
          {linked && <ExternalLink className="source-open-icon" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12} className="source-tooltip">
        {source.preview ? <img src={source.preview} alt={`First-page preview of ${source.name}`} className="source-preview" /> : <div className="missing-preview"><AlertTriangle />Original file not loaded</div>}
        <div className="source-tooltip-copy">
          <p className="source-role">{source.role}</p>
          <p className="source-full-name">{source.name}</p>
          <p className="source-result">{source.result}</p>
          <div className="source-clock">
            <div><span>Event stamp</span><strong>{source.clock.eventStamp}</strong></div>
            <div><span>Date basis</span><strong>{source.clock.basis}</strong></div>
            <div><span>PDF created</span><strong>{source.clock.created ?? "Unavailable"}</strong></div>
            {source.clock.modified && <div><span>PDF modified</span><strong>{source.clock.modified}</strong></div>}
            <p>{source.clock.note}</p>
          </div>
          <p className="source-hint">{linked ? "Click to open the complete source in this window." : "Exact filename preserved; source acquisition required."}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<Source | null>(null);
  const [documentQuery, setDocumentQuery] = useState("");
  const [documentType, setDocumentType] = useState("All records");
  const [referenceQuery, setReferenceQuery] = useState("");
  const [referenceType, setReferenceType] = useState("All datasets");
  const groups = Array.from(events.reduce<Map<string, Event[]>>((acc, event) => {
    const group = acc.get(event.year) ?? [];
    group.push(event);
    acc.set(event.year, group);
    return acc;
  }, new Map())).map(([year, items]) => ({ year, items }));
  const sourceCount = events.reduce((count, event) => count + event.sources.length, 0);
  const documentTypes = ["All records", ...Array.from(new Set(dmrDocuments.map((document) => document.type)))];
  const normalizedQuery = documentQuery.trim().toLowerCase();
  const filteredDocuments = dmrDocuments.filter((document) => {
    const matchesType = documentType === "All records" || document.type === documentType;
    const matchesQuery = !normalizedQuery || `${document.name} ${document.year} ${document.type}`.toLowerCase().includes(normalizedQuery);
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
            <h1>Cadillac PFAS Event Trace</h1>
            <p className="header-copy">Follow the hierarchy from year to event timestamp to the exact source document, with separate clocks for the event, the issued record and embedded file metadata.</p>
          </div>
          <div className="integrity-note"><CheckCircle2 /><div><strong>Original-source rule</strong><span>Hover a filename for its preview and result. Click to open the complete document without leaving the trace.</span></div></div>
        </header>

        <section className="path-strip" aria-label="Investigative pathway">
          <div><Factory /><span>Wexford landfill</span><small>Source material</small></div><ArrowDown />
          <div><Landmark /><span>Cadillac WWTP</span><small>Historical receiver</small></div><ArrowDown />
          <div><FlaskConical /><span>PFAS record</span><small>Sampling + controls</small></div><ArrowDown />
          <div><Waves /><span>Plett Road wells</span><small>Receptor results</small></div>
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
            {groups.map((group) => <a key={group.year} href={`#year-${group.year.replace(/[^0-9]+/g, "-")}`}><strong>{group.year}</strong><span>{group.items.length} {group.items.length === 1 ? "event" : "events"}</span></a>)}
          </nav>
          <p className="clock-rule"><AlertTriangle />File metadata is evidentiary file history, not automatically the event time. Where a source states no time of day, the model says “time not stated.”</p>
        </section>

        <section className="trace-intro">
          <div><p className="eyebrow">CHRONOLOGICAL EVENT TRACE</p><h2>One year, one event stamp, one source trail</h2></div>
          <p>Regulatory documents provide context; they do not independently prove contaminant migration. Groundwater attribution remains subject to hydrogeologic confirmation.</p>
        </section>

        <section className="trace" aria-label="Source-linked event timeline">
          {groups.map((group) => (
            <section className="year-group" id={`year-${group.year.replace(/[^0-9]+/g, "-")}`} key={group.year} aria-labelledby={`label-${group.year.replace(/[^0-9]+/g, "-")}`}>
              <header className="year-marker"><span>YEAR BAND</span><strong id={`label-${group.year.replace(/[^0-9]+/g, "-")}`}>{group.year}</strong><small>{group.items.length} {group.items.length === 1 ? "event" : "events"}</small></header>
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
                      <h3>{event.title}</h3>
                      <p className="event-finding">{event.finding}</p>
                      <div className="consequence"><ArrowDown /><p><strong>Trace significance</strong>{event.significance}</p></div>
                      <div className="source-list">{event.sources.map((source) => <SourceButton key={source.name} source={source} open={setSelected} />)}</div>
                    </div>
                  </article>
                );
              })}
            </section>
          ))}
        </section>

        <section className="document-library" aria-labelledby="document-library-title">
          <div className="evidence-heading">
            <div><p className="eyebrow">DISCHARGE MONITORING ARCHIVE</p><h2 id="document-library-title">Search 264 DMR and QA records</h2></div>
            <p>The complete supplied Cadillac WWTP collection is preserved here as downloadable source files. Original filenames are retained for provenance; the content audit found no true duplicates in this set.</p>
          </div>
          <div className="document-controls">
            <label className="document-search"><Search aria-hidden="true" /><span className="sr-only">Search documents</span><input value={documentQuery} onChange={(event) => setDocumentQuery(event.target.value)} placeholder="Search filename, year or record type" /></label>
            <label className="document-filter"><span className="sr-only">Filter by record type</span><select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>{documentTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <span className="document-result-count"><strong>{filteredDocuments.length}</strong> matching records</span>
          </div>
          <div className="document-grid">
            {filteredDocuments.map((document) => (
              <article className="archive-card" key={document.id}>
                <div className="archive-meta"><Badge variant="outline">{document.type}</Badge><span>{document.year}</span></div>
                <h3>{document.name}</h3>
                <Button asChild variant="outline" size="sm"><a href={document.url} target="_blank" rel="noreferrer">Open PDF<ExternalLink /></a></Button>
              </article>
            ))}
          </div>
          {filteredDocuments.length === 0 && <p className="document-empty">No documents match this search.</p>}
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
              <ul>{referenceAudit.exclusions.map((item) => <li key={item.name}><strong>{item.name}</strong><span>{item.reason}</span></li>)}</ul>
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
                <h3>{document.name}</h3>
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
            <div><p className="eyebrow">EVIDENCE REQUEST QUEUE</p><h2 id="evidence-title">What is still needed to complete each block</h2></div>
            <p>Upload these records in this chat using the filenames shown. Each new source can be inserted under its year, event timestamp and pathway block without changing the underlying event record.</p>
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
                <div><DialogTitle>{selected.name}</DialogTitle><DialogDescription className="document-meta">{selected.role} · {selected.format}{selected.pages ? ` · ${selected.pages} ${selected.pages === 1 ? "page" : "pages"}` : ""} · Event: {selected.clock.eventStamp} · File created: {selected.clock.created ?? "unavailable"}</DialogDescription></div>
                <Button asChild variant="outline" size="sm"><a href={selected.url} target="_blank" rel="noreferrer">Open separately<ExternalLink /></a></Button>
              </DialogHeader>
              <div className="document-frame">{selected.format === "PDF" ? <iframe title={`Full document: ${selected.name}`} src={`${selected.url}#view=FitH&toolbar=1`} /> : <img src={selected.url} alt={`Full source page: ${selected.name}`} />}</div>
            </>}
          </DialogContent>
        </Dialog>
      </main>
    </TooltipProvider>
  );
}
