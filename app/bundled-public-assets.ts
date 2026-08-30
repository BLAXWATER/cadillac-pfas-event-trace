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
