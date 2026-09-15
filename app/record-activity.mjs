export const ACTIVITY_WINDOW_MS = 5 * 24 * 60 * 60 * 1000;

// The immutable Git revision and PDF page fragment do not change a source's identity.
export function activitySourceKey(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url, "https://catalog.invalid");
    let path = decodeURIComponent(parsed.pathname);
    if (["github.com", "raw.githubusercontent.com"].includes(parsed.hostname)) {
      const match = path.match(/^\/(?:BLAXWATER|cazey43)\/cadillac-pfas-event-trace\/(?:blob\/)?[^/]+\/public(\/.*)$/i);
      return match ? match[1] : parsed.origin + path;
    }
    return parsed.hostname === "catalog.invalid" || parsed.hostname === "cadillac-pfas-event-trace.icons-7120.chatgpt.site"
      ? path : parsed.origin + path;
  } catch { return ""; }
}

export function recordActivity(entry, now) {
  if (!entry || !Number.isFinite(now)) return null;
  const added = Date.parse(entry.addedAt ?? "");
  const updated = Date.parse(entry.updatedAt ?? "");
  const changed = Number.isFinite(updated) && (!Number.isFinite(added) || updated > added);
  const at = changed ? updated : added;
  if (!Number.isFinite(at) || at > now || now >= at + ACTIVITY_WINDOW_MS) return null;
  return { label: changed ? "UPDATED" : "NEW", at, expiresAt: at + ACTIVITY_WINDOW_MS };
}

export function newestSourceActivity(urls, records, now) {
  return urls.map((url) => recordActivity(records[activitySourceKey(url)], now))
    .filter(Boolean).sort((a, b) => b.at - a.at || (a.label === "UPDATED" ? -1 : 1))[0] ?? null;
}
