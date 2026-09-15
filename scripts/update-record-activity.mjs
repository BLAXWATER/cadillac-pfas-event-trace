import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { ACTIVITY_WINDOW_MS, activitySourceKey } from "../app/record-activity.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = new URL("../app/record-activity.json", import.meta.url);
const stable = (value) => JSON.stringify(value, (_, v) => v && !Array.isArray(v) && typeof v === "object"
  ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);
const fingerprint = (record) => createHash("sha256").update(stable(record)).digest("hex");

export function updateRecordActivity(now = Date.now()) {
  const git = (...args) => execFileSync(process.env.SITES_GIT || "git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  // Never replace a known ledger with invented 'today' dates in an archive-only build.
  try { git("rev-parse", "--git-dir"); } catch {
    if (existsSync(output)) return;
    throw new Error("Record activity requires repository history or the previously generated ledger.");
  }
  const files = readdirSync(new URL("../app/", import.meta.url)).filter((f) => f.endsWith("-documents.json")).map((f) => "app/" + f);
  const read = (file, ref) => {
    try { return JSON.parse(ref ? git("show", `${ref}:${file}`) : readFileSync(new URL("../" + file, import.meta.url), "utf8")); }
    catch (error) {
      if (ref && /does not exist|exists on disk, but not in|invalid object name/.test(String(error.stderr))) return [];
      throw error;
    }
  };
  const previous = existsSync(output) ? JSON.parse(readFileSync(output, "utf8")).records : {};
  const current = files.flatMap((f) => read(f)).filter((r) => r.url && r.id);
  const byId = new Map(current.map((r) => [r.id, r]));
  const records = {};
  const mark = (record, at, isNew) => {
    const currentRecord = byId.get(record.id);
    if (!currentRecord) return;
    const key = activitySourceKey(currentRecord.url);
    const entry = records[key] ??= {};
    const field = isNew ? "addedAt" : "updatedAt";
    if (!entry[field] || Date.parse(entry[field]) < Date.parse(at)) entry[field] = at;
  };
  const since = new Date(now - ACTIVITY_WINDOW_MS - 86400000).toISOString();
  // Read actual changed records, not file mtimes, document dates or a site's redeploy date.
  const history = git("log", "--first-parent", "--reverse", `--since=${since}`, "--format=%H|%cI", "--", ...files).trim();
  for (const line of history ? history.split("\n") : []) {
    const [commit, at] = line.split("|");
    let priorCatalog;
    const changed = git("diff-tree", "--no-commit-id", "--name-only", "-r", commit, "--", ...files).trim().split("\n").filter(Boolean);
    for (const file of changed) {
      const before = new Map(read(file, `${commit}^`).map((r) => [r.id, r]));
      for (const record of read(file, commit)) {
        let old = before.get(record.id);
        if (!old) {
          // Moving a known record between catalogs is not a brand-new upload.
          priorCatalog ??= files.flatMap((f) => read(f, `${commit}^`));
          old = priorCatalog.find((r) => r.id === record.id || activitySourceKey(r.url) === activitySourceKey(record.url)
            || (r.sha256 && r.sha256 === record.sha256));
        }
        if (!old || stable(record) !== stable(old)) mark(record, at, !old);
      }
    }
  }
  // Track changes to original bytes and per-document delivery fixes too.
  const assetHistory = git("log", "--first-parent", "--reverse", `--since=${since}`, "--format=COMMIT|%H|%cI", "--name-only", "--", "public", "app/source-url.ts");
  let commit, at;
  for (const line of assetHistory.split("\n")) {
    if (line.startsWith("COMMIT|")) { [, commit, at] = line.split("|"); continue; }
    if (line.startsWith("public/")) {
      for (const r of current) if (activitySourceKey(r.url) === line.slice(6)) {
        const entry = records[activitySourceKey(r.url)];
        if (!entry?.addedAt || Date.parse(entry.addedAt) < Date.parse(at)) mark(r, at, false);
      }
    } else if (line === "app/source-url.ts") {
      const diff = git("diff", `${commit}^`, commit, "--", line);
      for (const match of diff.matchAll(/^\+\s*"(\/[^"\n]+)":\s*"[a-f0-9]{40}"/gm)) {
        for (const r of current) if (activitySourceKey(r.url) === match[1]) mark(r, at, false);
      }
    }
  }
  for (const file of files) {
    const head = new Map(read(file, "HEAD").map((r) => [r.id, r]));
    for (const record of read(file)) {
      const old = head.get(record.id), key = activitySourceKey(record.url);
      if (!old || stable(record) !== stable(old)) {
        const prior = previous[key];
        const at = prior?.fingerprint === fingerprint(record) ? (prior.updatedAt ?? prior.addedAt) : new Date(now).toISOString();
        mark(record, at, !old);
      }
    }
  }
  for (const [key, entry] of Object.entries(records)) {
    if (Math.max(Date.parse(entry.addedAt ?? "") || 0, Date.parse(entry.updatedAt ?? "") || 0) <= now - ACTIVITY_WINDOW_MS) { delete records[key]; continue; }
    const record = current.find((r) => activitySourceKey(r.url) === key);
    entry.fingerprint = fingerprint(record);
  }
  const content = JSON.stringify({ basis: "Site record/source change history; not historical document dates. Five rolling 24-hour days.", records: Object.fromEntries(Object.entries(records).sort()) }, null, 2) + "\n";
  if (!existsSync(output) || readFileSync(output, "utf8") !== content) writeFileSync(output, content);
  console.log(`Record activity: ${Object.keys(records).length} recent source records.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) updateRecordActivity();
