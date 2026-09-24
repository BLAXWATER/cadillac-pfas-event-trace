# September 23 forensic document-accounting audit

Generated: 2026-09-24T00:59:45.788Z

## Verdict

**Not fully compliant.** The current portal is internally consistent, but the historical source intake cannot yet be represented as completely reviewed, reconciled and published under the September 23 framework.

## Verified controls

- 1,678 catalog records; 1,678 unique IDs and 1,678 unique SHA-256 values.
- 13 visible archive blocks; placement integrity has no remaining failures after regenerating the stale public placement manifest.
- 1,678 catalog records have source-derived page-view previews.
- 1,513 anonymous public deliveries returned with matching sizes.
- Share-control behavior, the five-day NEW/UPDATED rule, the 142-item upload queue, and all 102 completed-existing-source routes passed their focused tests.

## Eight-batch baseline

- Recovered: 8 batches, 123 entries and 123 distinct hashes.
- January 16 correspondence recovered: yes.
- Distinct November 30 photo record 29779825 recovered: yes.
- Byte-exact matches in the current catalog: 4/123. The other 119 require normalized-content and rendered-page reconciliation; they are not automatically missing, but they are not yet proven accounted for.
- Operations renewed coverage: 0/71 pages marked reviewed; 71 remain pending.

## September 23 intake manifests

- 21 dated manifests cover 249 record rows.
- 17 manifests have at least one framework gap: incomplete provenance, incomplete page-order coverage, missing per-stage states, unresolved limitations, or non-exact suppression.
- The complete machine-readable per-manifest findings are in [september-23-forensic-audit.json](./september-23-forensic-audit.json).

## Required remediation

1. Complete the remaining 71 Operations pages with page-image verification and OCR where required.
2. Reconcile all 119 non-exact eight-batch entries by hash, normalized content and rendered-page comparison, preserving distinct same-named records.
3. Repair incomplete September 23 manifests so every row carries source path, full SHA-256, byte size, page/sheet count, six-batch membership, review coverage and six separate stage states.
4. Publish non-duplicate completed records immediately; keep published=false only for byte-exact duplicates. The two Cedar Creek rendered-equivalent variants need a publication decision under this rule.
5. Re-run previews, anonymous downloads, sharing, placement and badge tests after each six-batch publication unit.
