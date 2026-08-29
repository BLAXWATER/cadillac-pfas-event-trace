const bundledAssets = {
  ...import.meta.glob("../public/source-previews/*.jpg", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/previews/*.jpg", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/compliance-previews/*.png", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/docs/*.png", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/blax-water-logo.png", {
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
  return bundledAssets[`../public${normalizedPath}`] ?? normalizedPath;
}

