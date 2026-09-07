export type DocumentShareData = { title: string; url: string };
export type DocumentSharePlatform = {
  share?: (data: DocumentShareData) => Promise<void>;
  canShare?: (data: DocumentShareData) => boolean;
  writeText?: (text: string) => Promise<void>;
};
export type DocumentShareResult = "shared" | "copied" | "cancelled" | "manual";

// Use the same resolved original as Download, never a thumbnail or editor URL.
export function documentShareUrl(downloadUrl: string, origin: string): string | undefined {
  try {
    const url = new URL(downloadUrl, origin);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return undefined;
    if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.hostname.endsWith(".localhost")) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

export async function shareDocumentLink(data: DocumentShareData, platform: DocumentSharePlatform): Promise<DocumentShareResult> {
  if (platform.share) {
    try {
      if (!platform.canShare || platform.canShare(data)) {
        await platform.share(data);
        return "shared";
      }
    } catch (error) {
      // Cancellation must never silently copy or start another share attempt.
      if (error && typeof error === "object" && "name" in error && error.name === "AbortError") return "cancelled";
    }
  }
  if (platform.writeText) {
    try {
      await platform.writeText(data.url);
      return "copied";
    } catch {
      // Keep a manual, selectable link available when clipboard permission fails.
    }
  }
  return "manual";
}
