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
  ...import.meta.glob("../public/correspondence-docs/corr-035-446cf8df580f.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/npdes-docs/075-54c7e9d67d44.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/npdes-docs/076-a611a75485cf.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/001-7c991baaf1e9.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/002-e45ebd99572b.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/003-8ba13c7dcdf6.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/004-aaa74db2f56d.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/005-07d4a892d342.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/006-44cde488aaf4.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/007-cc1225120bd0.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/009-34358f131b59.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/012-34bbe60fdbc2.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/013-46619080fc73.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/014-a6e913ab7006.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/095-019ae9c3bfd6.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/096-9173d234d4c8.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/098-0130db19c6ca.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/099-8c0affe1ef31.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/100-7bc1b5bbf6f2.pdf", {
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
