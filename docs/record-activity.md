# Five-day document activity badges

Every catalog card, timeline source, linked event block, search result and document preview uses the shared record activity badge. Light-green **NEW** means a source was added to the site; light-green **UPDATED** means the existing source, its catalog information or delivery mapping changed. These are site activity dates, never dates printed inside historical documents or filesystem copy timestamps. They are not verification or compliance statuses.

`scripts/update-record-activity.mjs` builds `app/record-activity.json` from actual per-record repository changes, original-file changes and individual delivery fixes. Vite runs it automatically before development/builds. Keep the generated ledger with the source release. Unchanged builds, unrelated styling, record ordering and identical repeat uploads do not renew badges. Cross-catalog copies share the same source identity. Missing history is not replaced by today's date; archive-only builds retain the committed ledger.

The most recent genuine update takes precedence over NEW. Each badge expires at its activity timestamp plus exactly 120 hours, including across daylight-saving and month boundaries. A shared browser clock removes expired badges from an already-open page without rebuilding, publishing, deleting records or running a scheduled task. Focus and visibility changes resynchronize suspended tabs. Unknown or future dates do not display badges.

Initial dates are reconstructed from the site's committed change history, not retrospectively invented upload timestamps. New local record changes are stamped during preparation; immutable commit timestamps become the history basis on later builds. Publishing unrelated UI changes does not mark the entire collection UPDATED. A timeline's aggregate badge describes the newest active linked source, not a newly occurring historical event.

Tests: `node --test tests/record-activity.test.mjs`. Verify a known new record, an updated record, an older record and expiration at the exact five-day boundary after UI changes.
