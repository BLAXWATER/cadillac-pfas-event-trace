"use client";

import { useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import ledger from "./record-activity.json";
import { ACTIVITY_WINDOW_MS, newestSourceActivity } from "./record-activity.mjs";

// One shared clock for every card; expiration works even without another deployment.
let snapshot: number | null = null;
// Render active badges in the initial HTML. The ledger is refreshed before every
// verified build, then the browser clock takes over immediately after hydration.
const ledgerSnapshot = Math.max(0, ...Object.values(ledger.records).flatMap((entry) =>
  ["addedAt", "updatedAt"].map((field) => Date.parse((entry as Record<string, string>)[field] ?? ""))
    .filter(Number.isFinite),
));
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;
function refresh() {
  snapshot = Date.now();
  for (const listener of listeners) listener();
  clearTimeout(timer);
  const boundaries = Object.values(ledger.records).flatMap((entry) =>
    ["addedAt", "updatedAt"].flatMap((field) => {
      const at = Date.parse((entry as Record<string, string>)[field] ?? "");
      return [at, at + ACTIVITY_WINDOW_MS];
    })).filter((at) => Number.isFinite(at) && at > snapshot!);
  // The minute cap also resynchronizes after a clock change or suspended browser.
  timer = setTimeout(refresh, Math.min(60000, ...boundaries.map((at) => at - snapshot!)));
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    refresh();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    }
  };
}
const getSnapshot = () => snapshot;
const getServerSnapshot = () => ledgerSnapshot || null;

export function RecordActivityBadge({ url, urls }: { url?: string; urls?: (string | undefined)[] }) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const activity = newestSourceActivity(urls ?? [url], ledger.records, now);
  if (!activity) return null;
  const action = activity.label === "NEW" ? "Source added to the site" : "Source or catalog record updated";
  const description = `${action}: ${new Date(activity.at).toISOString()}. Badge expires ${new Date(activity.expiresAt).toISOString()}.`;
  return <Badge variant="destructive" className="record-activity-badge" data-record-activity={activity.label}
    data-expires-at={new Date(activity.expiresAt).toISOString()} title={description} aria-label={`${activity.label}. ${description}`}>{activity.label}</Badge>;
}
