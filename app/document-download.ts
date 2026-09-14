export type DocumentDownloadPlatform = {
  fetch: (url: string, options: RequestInit) => Promise<Response>;
  save: (blob: Blob, filename: string) => void;
};

export function documentDownloadFilename(name: string, sourceUrl?: string): string {
  const supportedExtension = /\.(pdf|csv|tsv|txt|geojson|json|png|jpe?g|webp|tiff?|xlsx?|docx?|msg|zip|html?)$/i;
  // Page citations belong in the viewer, not after the saved file extension.
  const primaryName = name.replace(/(\.(?:pdf|csv|tsv|txt|geojson|json|png|jpe?g|webp|tiff?|xlsx?|docx?|msg|zip|html?))\s+·\s+.*$/i, "$1");
  const filename = primaryName.replace(/[\u0000-\u001f\u007f/\\<>:"|?*]/g, "_").trim().replace(/[. ]+$/, "") || "document";
  if (supportedExtension.test(filename) || !sourceUrl) return filename;
  try {
    const extension = decodeURIComponent(new URL(sourceUrl, "https://source.invalid").pathname).match(supportedExtension)?.[0];
    return extension ? `${filename}${extension.toLowerCase()}` : filename;
  } catch {
    return filename;
  }
}

// Download the same original URL as Share, then save a local Blob. The download
// attribute alone is ignored on cross-origin URLs such as raw GitHub CSVs.
export async function downloadDocumentFile(
  url: string, name: string, platform: DocumentDownloadPlatform, signal?: AbortSignal,
): Promise<void> {
  const response = await platform.fetch(url, { credentials: "omit", redirect: "error", signal });
  if (!response.ok) throw new Error(`The original could not be downloaded (HTTP ${response.status}).`);
  const blob = await response.blob();
  if (!blob.size) throw new Error("The original returned an empty file.");
  platform.save(blob, documentDownloadFilename(name, url));
}
