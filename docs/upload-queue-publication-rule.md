# Upload review queue publication rule

Every completed intake must update the Upload review queue in the same release. Preserve supplied order, original filenames, hashes and separate received, extracted/OCR, reviewed, verified, cataloged and published stages. Do not infer review completion from extraction or a matching filename.

The rendered queue reconciles exact SHA-256 matches with the canonical catalog and explicit reviewed, verified and published intake audit records through `app/upload-review-queue.ts`. Register each new applicable audit there, or update the base queue with verified completion evidence. Publication evidence must include the successful deployment version and timestamp; an upload or pending deployment is not publication.

Before delivery, run `node tests/upload-queue-reconciliation.test.mjs`, confirm completed records show Completed / published, and retain unresolved records and aliases. Never label an idle review as actively processing.
