# Evidence-library search integrity

The Complete Evidence Library counts catalog records, not uploads or timeline edits.
Identical originals must remain one record; incoming filenames belong in the verified
alias map rather than a duplicate catalog entry.

For each subsequent intake:

1. Compute the original file's SHA-256 and byte length. Resolve its canonical
   catalog ID; do not attach aliases from filenames or similar descriptions alone.
2. For a verified duplicate with another basename, preserve that basename in
   `app/verified-filename-aliases.json` under the same ID and full SHA-256.
   Keep local paths, contact details, and credentials out of the public map.
3. Retain the intake identity/provenance audit and add a regression fixture for
   the supplied filename in `tests/fixtures/filename-alias-regressions.json`.
4. Run `node --test tests/library-search.test.mjs`. This executes the same search
   module, search-section JSX, input-change handler and Show-more handler used
   by the page. It checks every canonical/displayed filename and verified alias,
   each requested fixture, punctuation variants, and access to the final match.
5. Run the verified release build and full test suite. The build now refuses to
   continue if the search regression suite fails. After deployment, compare
   the public bundle to that exact build and verify anonymous source downloads.

Search is catalog-metadata search, not full PDF/OCR text search. The interface
states this boundary. Queries normalize case, spacing, underscores, punctuation
and dash variants consistently. Exact filename matches rank first. All other
matching rows keep archive order, and Show more exposes successive batches of
100 without imposing a maximum number of matches.

The September 5, 2026 correction adds 32 verified noncanonical filenames across
22 originals. It is not a claim that every historical filename alias is known.
