import uploadQueue from "./upload-review-queue.json";

type ExistingSourceItem = (typeof uploadQueue.items)[number];

export type ExistingSourceAlias = Pick<ExistingSourceItem, "name" | "sha256" | "pages" | "bytes" | "detail">;

export const normalizeSourceAsset = (value?: string | null) => {
  if (!value) return "";
  const withoutFragment = value.split("#", 1)[0].split("?", 1)[0];
  const publicIndex = withoutFragment.indexOf("/public/");
  if (publicIndex >= 0) return withoutFragment.slice(publicIndex + "/public".length);
  try {
    return new URL(withoutFragment, "https://catalog.local").pathname;
  } catch {
    return withoutFragment.startsWith("/") ? withoutFragment : `/${withoutFragment}`;
  }
};

export const completedExistingSources = uploadQueue.items.filter(
  (item) => item.status === "Completed · existing source" && item.stages.reviewed && item.stages.verified && item.stages.cataloged && item.stages.published,
);

const aliasesByAsset = new Map<string, ExistingSourceAlias[]>();
for (const item of completedExistingSources) {
  const asset = normalizeSourceAsset(item.canonicalAsset);
  const aliases = aliasesByAsset.get(asset) ?? [];
  aliases.push({ name: item.name, sha256: item.sha256, pages: item.pages, bytes: item.bytes, detail: item.detail });
  aliasesByAsset.set(asset, aliases);
}

export const existingSourceAliases = (asset?: string | null): readonly ExistingSourceAlias[] =>
  aliasesByAsset.get(normalizeSourceAsset(asset)) ?? [];

export const timelineSourceTargets: Readonly<Record<string, { label: string; href: string }>> = {
  "/docs/2014-preinspection.pdf": { label: "Hauled landfill leachate documented at the WWTP", href: "#event-hauled-landfill-leachate-documented-at-the-wwtp" },
  "/docs/2015-2016-leachate-request.pdf": { label: "Landfill requests one-time groundwater discharge authorization", href: "#event-landfill-requests-one-time-groundwater-discharge-authorization" },
  "/docs/2018-02-20-pfas-ipp-letter.pdf": { label: "EGLE directs PFAS source evaluation and reduction", href: "#event-egle-directs-pfas-source-evaluation-and-reduction" },
  "/docs/2018-05-24-extension-approval.pdf": { label: "Alternative monitoring schedule approved", href: "#event-alternative-monitoring-schedule-approved" },
  "/docs/2018-06-27-monitoring-plan.pdf": { label: "Screening and source-sampling method documented", href: "#event-screening-and-source-sampling-method-documented" },
  "/docs/2018-10-03-j17646-leachate.pdf": { label: "Wexford leachate shows a strong PFAS burden", href: "#event-wexford-leachate-shows-a-strong-pfas-burden" },
  "/docs/2018-11-05-j17993-effluent.pdf": { label: "PFAS measured in Cadillac WWTP effluent", href: "#event-pfas-measured-in-cadillac-wwtp-effluent" },
  "/docs/2018-11-30-monitoring-plan-update.pdf": { label: "Updated monitoring record lists Wexford County Landfill", href: "#event-updated-monitoring-record-lists-wexford-county-landfill" },
  "/docs/2019-03-04-report-approval.pdf": { label: "DEQ approves reports and acknowledges a confirmed source", href: "#event-deq-approves-reports-and-acknowledges-a-confirmed-source" },
  "/docs/2019-12-pfas-status.pdf": { label: "EGLE summarizes statewide IPP PFAS progress", href: "#event-egle-summarizes-statewide-ipp-pfas-progress" },
};

