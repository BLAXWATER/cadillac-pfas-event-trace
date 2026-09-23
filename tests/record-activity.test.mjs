import assert from "node:assert/strict";
import test from "node:test";
import { ACTIVITY_WINDOW_MS, recordActivity, activitySourceKey, newestSourceActivity } from "../app/record-activity.mjs";

const at = Date.parse("2026-09-15T05:00:00Z");
const addedAt = new Date(at).toISOString();
test("NEW lasts exactly five rolling days, including across month boundaries", () => {
  assert.equal(recordActivity({addedAt}, at).label, "NEW");
  assert.equal(recordActivity({addedAt}, at + ACTIVITY_WINDOW_MS - 1).label, "NEW");
  assert.equal(recordActivity({addedAt}, at + ACTIVITY_WINDOW_MS), null);
  assert.equal(recordActivity({addedAt: "2026-08-30T01:00:00Z"}, Date.parse("2026-09-04T01:00:00Z")), null);
});
test("the five-day window is 120 hours, not five calendar labels or build days", () => {
  assert.equal(ACTIVITY_WINDOW_MS, 120 * 60 * 60 * 1000);
  const lateNight = Date.parse("2026-09-01T23:59:59-04:00");
  const entry = {addedAt: new Date(lateNight).toISOString()};
  assert.equal(recordActivity(entry, lateNight + ACTIVITY_WINDOW_MS - 1).label, "NEW");
  assert.equal(recordActivity(entry, lateNight + ACTIVITY_WINDOW_MS), null);
});
test("a genuine update starts its own five-day window and takes precedence", () => {
  const updatedAt = new Date(at + 3600000).toISOString();
  assert.equal(recordActivity({addedAt, updatedAt}, at + 3600000).label, "UPDATED");
  assert.equal(recordActivity({addedAt, updatedAt: addedAt}, at).label, "NEW");
  assert.equal(recordActivity({updatedAt}, at + 3600000 + ACTIVITY_WINDOW_MS), null);
});
test("unknown, invalid, future and historical document dates do not create badges", () => {
  for (const entry of [undefined, {}, {addedAt:"invalid"}, {addedAt:"2030-01-01"}, {year:"2018", modified:"2026-09-15"}]) assert.equal(recordActivity(entry, at), null);
  assert.equal(recordActivity({addedAt}, null), null);
});
test("catalog, raw, relative and page-cited references share one activity identity", () => {
  const path = "/findings-docs/045-25d3c10b9ea8.pdf";
  for (const url of [path, path+"#page=157", "https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/4535081d2398301cd01bb92501f2fc2e1a83e3ed/public"+path, "https://raw.githubusercontent.com/cazey43/cadillac-pfas-event-trace/4535081d2398301cd01bb92501f2fc2e1a83e3ed/public"+path]) assert.equal(activitySourceKey(url), path);
});
test("event blocks select the latest active source; all expire without data edits", () => {
  const records = {"/one.pdf":{addedAt}, "/two.pdf":{updatedAt:new Date(at+1000).toISOString()}};
  assert.equal(newestSourceActivity(["/one.pdf","/two.pdf"], records, at+1000).label,"UPDATED");
  assert.equal(newestSourceActivity(["/one.pdf","/two.pdf"], records, at+1000+ACTIVITY_WINDOW_MS),null);
});
