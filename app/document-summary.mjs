// Never manufacture analytical findings from filenames or metadata.
export function documentSummary(record) {
  if (typeof record.description === 'string' && record.description.trim()) return record.description.trim();
  const type = record.type || 'Source record';
  const year = record.year ? `; catalog year: ${record.year}` : '';
  return `${type}${year}. A findings summary has not yet been recorded. Open the original document for its contents; this catalog description does not establish a finding.`;
}
