import queue from './upload-review-queue.json';
import catalog from './supplemental-documents.json';
import batch1 from './epa-docs-six-batch-intake-audit-2026-09-23.json';
import batch2 from './epa-docs-six-batch-intake-audit-b2-2026-09-23.json';
import batch3 from './epa-docs-six-batch-intake-audit-b3-2026-09-23.json';
import batch4 from './epa-docs-six-batch-intake-audit-b4-2026-09-23.json';
import batch5 from './epa-docs-six-batch-intake-audit-b5-2026-09-23.json';
import batch6 from './epa-docs-six-batch-intake-audit-b6-2026-09-23.json';
import { reconcileUploadQueue } from './reconcile-upload-queue.mjs';

export default reconcileUploadQueue(queue, catalog, [batch1, batch2, batch3, batch4, batch5, batch6]) as typeof queue;
