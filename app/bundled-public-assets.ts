import firstPagePreviewManifest from "./first-page-preview-manifest.json";

const bundledAssets = {
  ...import.meta.glob("../public/optimized-source-previews/*.webp", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/optimized-previews/*.webp", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/optimized-compliance-previews/*.webp", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/optimized-doc-previews/*.webp", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/document-pages/**/*.webp", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/first-page-previews/**/*.webp", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/blax-water-logo-optimized.webp", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/favicon.svg", {
    eager: true,
    import: "default",
    query: "?url",
  }),
} as Record<string, string>;

const bundledDocumentDownloads = {
  ...import.meta.glob("../public/findings-docs/010-1aba682de0b8.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/form-submission-docs/form-submission-033-bffd8eec3c32.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/form-submission-docs/form-submission-074-120dbeb59d52.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/ipp-docs/007-9aecbfcf4abc.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/ipp-docs/011-9f84067f8dd2.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/ipp-docs/012-4ef102885030.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/ipp-docs/013-3d6cd5e0a57b.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/ipp-docs/125-9e67bc822d9c.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/ipp-docs/140-3db93feeaf81.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/ipp-docs/151-774fbfdfab32.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/compliance-docs/012-16dae2e386d4.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
} as Record<string, string>;

export function bundledPublicAsset(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const optimizedPath = normalizedPath
    .replace(/^\/source-previews\/(.+)\.(?:jpe?g|png)$/i, "/optimized-source-previews/$1.webp")
    .replace(/^\/previews\/(.+)\.(?:jpe?g|png)$/i, "/optimized-previews/$1.webp")
    .replace(/^\/compliance-previews\/(.+)\.(?:jpe?g|png)$/i, "/optimized-compliance-previews/$1.webp")
    .replace(/^\/docs\/(.+)\.(?:jpe?g|png)$/i, "/optimized-doc-previews/$1.webp")
    .replace(/^\/blax-water-logo\.png$/i, "/blax-water-logo-optimized.webp");
  const bundledAsset = bundledAssets[`../public${optimizedPath}`];

  if (bundledAsset) return bundledAsset;
  return normalizedPath;
}

function publicDocumentPath(sourceUrl: string): string | undefined {
  const withoutFragment = sourceUrl.split("#", 1)[0];

  try {
    const parsed = new URL(withoutFragment, "https://site.invalid");
    const publicMarker = "/public/";
    const publicAt = parsed.pathname.indexOf(publicMarker);
    const pathname = publicAt >= 0
      ? parsed.pathname.slice(publicAt + publicMarker.length - 1)
      : parsed.pathname;

    return decodeURIComponent(pathname);
  } catch {
    return undefined;
  }
}

export function bundledFirstPagePreview(sourceUrl: string): string | undefined {
  const path = publicDocumentPath(sourceUrl);
  if (!path || !/\.pdf$/i.test(path)) return undefined;
  const firstPagePath = (firstPagePreviewManifest as Record<string, string>)[path];
  if (!firstPagePath) return undefined;
  return bundledAssets[`../public${firstPagePath}`];
}

export function bundledDocumentDownload(sourceUrl: string): string | undefined {
  const path = publicDocumentPath(sourceUrl);
  if (!path || !/\.pdf$/i.test(path)) return undefined;
  return bundledDocumentDownloads[`../public${path}`];
}
