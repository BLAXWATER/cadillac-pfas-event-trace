export type DocumentDownloadPlatform = {
  fetch: (url: string, options: RequestInit) => Promise<Response>;
  save: (blob: Blob, filename: string) => void;
};

export function documentDownloadFilename(name: string): string {
  return name.replace(/[\u0000-\u001f\u007f/\\]/g, "_").trim() || "document";
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
  platform.save(blob, documentDownloadFilename(name));
}
