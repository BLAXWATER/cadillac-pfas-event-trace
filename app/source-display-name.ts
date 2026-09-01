const finalFileExtension = /\.(pdf|png|jpe?g|docx?|xlsx?|csv|tsv|html?|msg|zip|tiff?|webp|txt|md|geojson|json)$/i;

function cleanText(value: string): string {
  return value
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,)])/g, "$1")
    .replace(/([(])\s+/g, "$1")
    .trim();
}

function cleanSuffix(value: string): string {
  return cleanText(value)
    .replace(/\bPDF\s+p\.?\s+(\d+)\b/i, "page $1")
    .replace(/\bp\.?\s+(\d+)\b/i, "page $1")
    .replace(/\s*·\s*/g, " · ");
}

function removeFirstPeriodWhenRepeated(value: string): string {
  const periodCount = (value.match(/[.·]/g) ?? []).length;

  if (periodCount <= 1 || !value.includes(".")) return value;

  return value.replace(".", " ").replace(/\s+/g, " ").trim();
}

export function formatSourceDisplayName(
  name: string,
  format?: string,
  linked = false,
): string {
  const separatorIndex = name.indexOf("·");
  const primaryName = separatorIndex >= 0 ? name.slice(0, separatorIndex).trim() : name.trim();
  const suffix = separatorIndex >= 0 ? cleanSuffix(name.slice(separatorIndex + 1)) : "";
  const extensionMatch = primaryName.match(finalFileExtension);
  const extension = extensionMatch?.[1]?.toLowerCase();
  const titleWithoutExtension = extension
    ? primaryName.slice(0, primaryName.length - extensionMatch[0].length)
    : primaryName;
  const cleanedTitle = cleanText(titleWithoutExtension);
  const displayedExtension = extension ?? (linked && format ? format.toLowerCase() : "");
  const primaryDisplay = `${cleanedTitle}${displayedExtension ? `.${displayedExtension}` : ""}`;

  return removeFirstPeriodWhenRepeated(suffix ? `${primaryDisplay} · ${suffix}` : primaryDisplay);
}
