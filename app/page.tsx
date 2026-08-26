"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  ExternalLink,
  Factory,
  FileSearch,
  FileText,
  FlaskConical,
  Landmark,
  Waves,
} from "lucide-react";
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
};
type Event = {
  date: string;
  phase: string;
  kind: Kind;
  category: string;
  title: string;
  finding: string;
  significance: string;
  sources: Source[];
};

const pdf = (name: string, slug: string, pages: number, result: string): Source => ({
  name,
  url: `/docs/${slug}.pdf`,
  preview: `/previews/${slug}.jpg`,
  pages,
  format: "PDF",
  role: "Primary source",
  result,
});

const events: Event[] = [
  {
    date: "2014-10-10",
    phase: "Operational baseline",
    kind: "operation",
    category: "10 · Process & site",
    title: "Hauled landfill leachate documented at the WWTP",
    finding: "The inspection record states that the equalization tank accepted hauled waste described as landfill leachate from the County Landfill and notes no screen or flow meter in that receiving area.",
    significance: "Establishes the physical receiving point later examined by the PFAS source investigation.",
    sources: [pdf("2014-10-10_Cadillac_Pre-Inspection_Report_56545.pdf", "2014-preinspection", 7, "Equalization tank identified as the receiving point for County Landfill leachate.")],
  },
  {
    date: "2015–2016",
    phase: "Leachate management",
    kind: "operation",
    category: "12 · Landfill & leachate",
    title: "Landfill leachate request enters the record",
    finding: "Wexford County Landfill leachate management and disposal arrangements were documented during the continuing WWTP receiving period.",
    significance: "Connects landfill-generated liquid waste to Cadillac receiving and treatment records.",
    sources: [pdf("2015-2016_Wexford County Landfill_Leachate Request.pdf", "2015-2016-leachate-request", 3, "Recovered three-page landfill leachate request record.")],
  },
  {
    date: "2016-01-12",
    phase: "Reported release",
    kind: "gap",
    category: "09 · Correspondence",
    title: "Spill notification referenced; original file not loaded",
    finding: "The compiled evidence set cites a leachate offloading spill at the WWTP yard. The exact filename is known, but the original is absent from the current 101-document source folder.",
    significance: "Preserved as an acquisition target; no reconstructed document is substituted.",
    sources: [{ name: "Spill notification 1-12-16.pdf", format: "PDF", role: "Referenced—file missing", result: "Exact cited filename retained; the original file is still required." }],
  },
  {
    date: "2017-04-03",
    phase: "Permit record",
    kind: "regulatory",
    category: "02 · NPDES permits",
    title: "NPDES application fixes the regulated-system baseline",
    finding: "The application records the treatment configuration, regulated discharge framework and facility representations preceding the PFAS initiative.",
    significance: "Provides the permit baseline for later monitoring and compliance events.",
    sources: [pdf("2017-04-03_Cadillac_WWTP_NPDES_Application.pdf", "2017-npdes-application", 22, "Twenty-two-page Cadillac WWTP NPDES application.")],
  },
  {
    date: "2018-02-20",
    phase: "PFAS initiative",
    kind: "regulatory",
    category: "03 · IPP pretreatment",
    title: "EGLE directs PFAS source evaluation and reduction",
    finding: "The PFAS-IPP letter placed Cadillac into the statewide industrial pretreatment source-evaluation process and established reporting duties.",
    significance: "Begins the formal chain from screening to sampling, source confirmation and status reporting.",
    sources: [pdf("MI0020257 PFAS-IPP Letter 2-20-2018.pdf", "2018-02-20-pfas-ipp-letter", 5, "PFAS source-evaluation and reduction requirements for MI0020257.")],
  },
  {
    date: "2018-05-24",
    phase: "Schedule approval",
    kind: "regulatory",
    category: "03 · IPP pretreatment",
    title: "Alternative monitoring schedule approved",
    finding: "DEQ approved the alternative plan, setting the Interim Report deadline at July 31, 2018 and Summary Report deadline at November 30, 2018.",
    significance: "Fixes the official timetable used to assess the source investigation.",
    sources: [pdf("Cadillac WWTP_PFAS Extension Approval FINAL.pdf", "2018-05-24-extension-approval", 1, "Approval granted with revised interim and summary deadlines.")],
  },
  {
    date: "2018-06-27",
    phase: "Monitoring design",
    kind: "regulatory",
    category: "04 · PFAS monitoring",
    title: "Screening and source-sampling method documented",
    finding: "The plan describes surveys, probable-source notification, priority sampling, laboratory delivery and follow-up POTW effluent sampling.",
    significance: "Defines how a probable source would be tested and connected to POTW results.",
    sources: [pdf("2018 IPP Screening - Monitoring Plan.180627modif.pdf", "2018-06-27-monitoring-plan", 3, "Three-page PFAS screening, notification and sampling workflow.")],
  },
  {
    date: "2018-10-03",
    phase: "Source characterization",
    kind: "sampling",
    category: "06 · Lab results",
    title: "Wexford leachate shows a strong PFAS burden",
    finding: "TestAmerica job J17646-1 reports the landfill leachate PFAS panel, including approximately 590 ng/L PFOA and 120 ng/L PFOS.",
    significance: "Provides the upstream profile for comparison with WWTP effluent and receptor-water results.",
    sources: [pdf("J17646-1 UDS Level 2 Report Final Report (Leachate).pdf", "2018-10-03-j17646-leachate", 23, "Full TestAmerica analytical package for leachate collected October 3, 2018.")],
  },
  {
    date: "2018-11-05",
    phase: "Pathway characterization",
    kind: "sampling",
    category: "06 · Lab results",
    title: "PFAS measured in Cadillac WWTP effluent",
    finding: "J17993-1 documents the WWTP effluent panel. The later DEQ approval letter records PFOS at 6.5 ng/L; the laboratory package reports PFOA near 20 ng/L.",
    significance: "Documents an effluent signature during the landfill-leachate receiving period.",
    sources: [pdf("J17993-1 UDS Level 2 Report Final Report.pdf", "2018-11-05-j17993-effluent", 21, "Full TestAmerica package for Cadillac WWTP effluent collected November 5, 2018.")],
  },
  {
    date: "2018-11-30",
    phase: "Source-screen update",
    kind: "regulatory",
    category: "04 · PFAS monitoring",
    title: "Updated monitoring record lists Wexford County Landfill",
    finding: "The updated IPP screening record includes Wexford County Landfill in the facility list used during the PFAS investigation.",
    significance: "Ties the sampled leachate source into the formal monitoring record.",
    sources: [pdf("2018 IPP Screening - Monitoring Plan.Update181130.pdf", "2018-11-30-monitoring-plan-update", 2, "Updated two-page source-screening record.")],
  },
  {
    date: "2019-03-04",
    phase: "Agency determination",
    kind: "regulatory",
    category: "08 · Compliance",
    title: "DEQ approves reports and acknowledges a confirmed source",
    finding: "DEQ states Cadillac accepted wastewater from one facility discharging PFOS above 12 ng/L, approves the reports and calls for work with the confirmed source to reduce PFOS in discharge and biosolids.",
    significance: "Moves the record from screening to confirmed-source reduction work.",
    sources: [pdf("Cadillac WWTP PFAS Interim and Summary Rpt Approval Letter.pdf", "2019-03-04-report-approval", 3, "DEQ approval letter acknowledging a confirmed source and continuing controls.")],
  },
  {
    date: "2019-06-04",
    phase: "Follow-up sampling",
    kind: "sampling",
    category: "06 · Lab results",
    title: "Leachate-era PFAS remains measurable in effluent",
    finding: "J19915-1 reports PFOA at 16 ng/L and PFOS at approximately 7.8 ng/L, with duplicate, field blank and equipment blank records.",
    significance: "Extends the effluent signature to immediately before reported delivery cessation.",
    sources: [pdf("J19915-1 UDS Level 2 Report Final Report.pdf", "2019-06-04-j19915-effluent", 22, "Full TestAmerica package for Cadillac WWTP effluent collected June 4, 2019.")],
  },
  {
    date: "2019-06-28",
    phase: "Source confirmation",
    kind: "regulatory",
    category: "11 · Form submission",
    title: "Cadillac identifies Wexford County Landfill as the source",
    finding: "The MiWaters form states: “We have determined Wexford county landfill is our source.” It records a move to deep-well injection and an end to WWTP deliveries.",
    significance: "Directly identifies the landfill as originator and Cadillac WWTP as historical receiver.",
    sources: [pdf("HNQ-VZP8-TWNRX V1.pdf", "2019-06-28-source-status", 3, "MiWaters status form naming Wexford County Landfill as the confirmed source.")],
  },
  {
    date: "2019-12",
    phase: "Post-cessation status",
    kind: "regulatory",
    category: "04 · PFAS monitoring",
    title: "PFAS status reporting continues after cessation",
    finding: "The December 2019 record continues permit-linked PFAS source-reduction reporting after landfill deliveries were reported to have stopped.",
    significance: "Separates the historical receiving period from the monitoring period.",
    sources: [pdf("Cadillac WWTP MI0020257 IPP PFAS Dec 2019 Status.pdf", "2019-12-pfas-status", 5, "December 2019 IPP PFAS status submission for MI0020257.")],
  },
  {
    date: "2020-10-22",
    phase: "Compliance control",
    kind: "compliance",
    category: "08 · Compliance",
    title: "VN-011108 identifies pretreatment deficiencies",
    finding: "EGLE records deficiencies involving legal authority, applicable limits, sampling locations, self-monitoring reporting and discharge-notification requirements.",
    significance: "Bears on program administration; it does not independently prove groundwater migration.",
    sources: [pdf("2020-10-22 VN-011108 Cadillac WWTP (1).pdf", "2020-10-22-vn-011108", 5, "EGLE IPP Reconnaissance Evaluation and Violation Notice VN-011108.")],
  },
  {
    date: "2024-01-22",
    phase: "Corrective-action review",
    kind: "compliance",
    category: "08 · Compliance",
    title: "EGLE requires further revision after VN-012230",
    finding: "The follow-up requires revised MAHL/local limits, Sewer Use Ordinance, procedures manual, Enforcement Response Plan and template documents.",
    significance: "Extends the institutional-control chronology without substituting for pathway evidence.",
    sources: [pdf("2024-01-22 Follow-up to VN-012230 IPP Procedures Manual Mod - City of Cadillac.pdf", "2024-01-22-vn-012230-followup", 466, "EGLE follow-up package requiring further pretreatment-control revisions.")],
  },
  {
    date: "2025-03",
    phase: "Receptor discovery",
    kind: "receptor",
    category: "13 · Groundwater & wells",
    title: "PFAS detected at 1140 Plett Road",
    finding: "The owner-commissioned Cyclopure result documents a multi-compound pattern in warehouse well water, including PFOA, PFOS, PFHxS and PFBS.",
    significance: "Creates the receptor-side result for comparison with source and pathway records.",
    sources: [pdf("TEST #1 - 3-4-2025 CYCLOPURE - SELF TESTING.pdf", "2025-03-cyclopure-property", 3, "Original Cyclopure property-water result from March 2025.")],
  },
  {
    date: "2025-09-10",
    phase: "Independent reproduction",
    kind: "receptor",
    category: "04 · PFAS monitoring",
    title: "September sampling reproduces the property pattern",
    finding: "The Cyclopure result and available EGLE Work Order 2509147 laboratory page document repeat testing associated with 1140 Plett Road.",
    significance: "Adds another sampling interval and a state-laboratory record to the receptor evidence.",
    sources: [
      pdf("09102025_Analyte Original Cyclopure Test Kit Results (collected .pdf", "2025-09-cyclopure-property", 1, "Original one-page Cyclopure result for September 10, 2025."),
      { name: "EGLE-TEST-2509147-LAB-WORK-ORDER.png", url: "/docs/2025-egle-work-order-2509147-page.png", preview: "/previews/2025-egle-work-order-2509147-page.png", pages: 1, format: "PNG", role: "Source page", result: "Available EGLE result page; the full 49-page Work Order remains an acquisition target." },
    ],
  },
  {
    date: "2026-04",
    phase: "Multi-panel confirmation",
    kind: "receptor",
    category: "06 · Lab results",
    title: "EPA 533 testing confirms the receptor PFAS pattern",
    finding: "The package reports PFOA 34.6 ng/L, PFOS 10.6 ng/L, PFHxS 33.4 ng/L and PFBS 24.3 ng/L, plus the broader property-water testing suite.",
    significance: "Extends receptor reproducibility; the migration route still requires site-specific hydrogeologic confirmation.",
    sources: [pdf("All MyTapScore Tests 2026.pdf", "2026-04-mytapscore-property", 26, "Twenty-six-page analytical package for 1140 Plett Road.")],
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
          <p className="source-hint">{linked ? "Click to open the complete source in this window." : "Exact filename preserved; source acquisition required."}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<Source | null>(null);
  return (
    <TooltipProvider delayDuration={120}>
      <main className="site-shell">
        <header className="trace-header">
          <div>
            <p className="eyebrow">MI0020257 · SOURCE-LINKED RECORD</p>
            <h1>Cadillac PFAS Event Trace</h1>
            <p className="header-copy">Follow the documentary sequence from landfill leachate handling to PFAS source identification, WWTP results, compliance controls and Plett Road receptor testing.</p>
          </div>
          <div className="integrity-note"><CheckCircle2 /><div><strong>Original-source rule</strong><span>Hover a filename for its preview and result. Click to open the complete document without leaving the trace.</span></div></div>
        </header>

        <section className="path-strip" aria-label="Investigative pathway">
          <div><Factory /><span>Wexford landfill</span><small>Source material</small></div><ArrowDown />
          <div><Landmark /><span>Cadillac WWTP</span><small>Historical receiver</small></div><ArrowDown />
          <div><FlaskConical /><span>PFAS record</span><small>Sampling + controls</small></div><ArrowDown />
          <div><Waves /><span>Plett Road wells</span><small>Receptor results</small></div>
        </section>

        <section className="trace-intro">
          <div><p className="eyebrow">CHRONOLOGICAL EVENT TRACE</p><h2>One event, one finding, one source trail</h2></div>
          <p>Regulatory documents provide context; they do not independently prove contaminant migration. Groundwater attribution remains subject to hydrogeologic confirmation.</p>
        </section>

        <section className="trace" aria-label="Source-linked event timeline">
          {events.map((event, index) => {
            const item = meta[event.kind];
            const Icon = item.icon;
            return (
              <article className="trace-row" data-kind={event.kind} key={`${event.date}-${event.title}`}>
                <div className="trace-date"><time>{event.date}</time><span>{event.phase}</span></div>
                <div className="trace-spine" aria-hidden="true"><div className="trace-node"><Icon /></div>{index < events.length - 1 && <div className="trace-line" />}</div>
                <div className="event-card">
                  <div className="event-topline"><Badge variant="outline" className="kind-badge">{item.label}</Badge><span className="category-code">{event.category}</span></div>
                  <h3>{event.title}</h3>
                  <p className="event-finding">{event.finding}</p>
                  <div className="consequence"><ArrowDown /><p><strong>Trace significance</strong>{event.significance}</p></div>
                  <div className="source-list">{event.sources.map((source) => <SourceButton key={source.name} source={source} open={setSelected} />)}</div>
                </div>
              </article>
            );
          })}
        </section>

        <footer><FileSearch /><p>Documentary event trace. Source attribution and migration opinions require qualified expert review.</p></footer>

        <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="document-dialog" showCloseButton>
            {selected && <>
              <DialogHeader className="document-dialog-header">
                <div><DialogTitle>{selected.name}</DialogTitle><DialogDescription>{selected.role} · {selected.format}{selected.pages ? ` · ${selected.pages} ${selected.pages === 1 ? "page" : "pages"}` : ""}</DialogDescription></div>
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
