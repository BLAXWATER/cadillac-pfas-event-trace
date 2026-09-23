// Reconcile only exact-file matches with explicit verified publication evidence.
export function reconcileUploadQueue(queue, catalog, audits) {
  const items = queue.items.map((item) => {
    const record = catalog.find((record) => record.sha256 === item.sha256);
    const audit = audits.find((audit) => audit.publishedAt && audit.publishedVersion &&
      audit.records?.some((entry) => entry.sha256 === item.sha256 &&
        entry.canonicalRecordId === record?.id && entry.statuses?.reviewed === true &&
        entry.statuses?.verified === true && entry.statuses?.published === true));
    if (!record || !audit) return item;
    return { ...item, lane: 'resolved', status: 'Completed · published',
      detail: `Exact SHA-256 match to the cataloged record: ${record.name} Review, verification and publication are recorded in intake audit version ${audit.publishedVersion}. The supplied filename is retained here as provenance.`,
      stages: { ...item.stages, received: true, extractedOrOcr: true,
        reviewed: true, verified: true, cataloged: true, published: true } };
  });
  let pending = 0;
  return { ...queue, items: items.map((item) => {
    if (item.stages.published) return { ...item, lane: 'resolved' };
    if (item.lane === 'linked') return item;
    pending += 1;
    return { ...item, lane: pending === 1 ? 'current' : pending === 2 ? 'next' : 'waiting',
      status: pending === 1 ? 'Review pending' : pending === 2 ? 'Next in line' : item.status };
  }) };
}
