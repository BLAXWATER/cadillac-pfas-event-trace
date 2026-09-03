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
  ...import.meta.glob("../public/record-placement-manifest.json", {
    eager: true,
    import: "default",
    query: "?url",
  }),
} as Record<string, string>;

const bundledDocumentDownloads = {
  ...import.meta.glob("../public/findings-docs/007-238cf9655b70.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/pfas-docs/082-18e25560cde6.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/pfas-docs/055-ae1a7fc25cfe.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/122-e9b5255695c3.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/147-501cb6326dac.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/148-c1f66e091159.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/149-e4e6ac86e7bc.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/150-09f087fefb8f.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/151-5a0d25ca941a.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/152-4335077ddaf4.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/153-b3da3c98dd4f.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/154-42cf775b5b3a.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/155-4686cde76b57.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/156-2944aeb34f99.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/157-5f0ef7342a71.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/158-54e5a805019e.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/159-156bb003c77d.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/160-148ff309f092.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/002-2ee7fa5b072b.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/161-945324bfdf2a.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/162-a51176d31cfd.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/163-c3da045eb140.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/164-519d4faa6c33.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/165-676065b15331.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/166-fd889bd49fef.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/167-322217e52758.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/168-cdc906173203.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/lab-docs/042-17dfcc25e8a0.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/lab-docs/021-d8389dd7c1c7.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/lab-docs/086-bb9d5bc3d13f.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/119-ceebd83a93ce.txt", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/120-83295aef8621.html", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/121-22691dcca74e.html", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/122-c8b0b8e50f92.csv", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/109-ae6fb2bf0688.geojson", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/110-c1db81fc64d9.html", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/111-f7ff41fbf818.txt", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/112-3e70c4808d58.geojson", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/113-616420a3ae1a.txt", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/114-ac3d967f79c6.geojson", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/115-60f86403524d.geojson", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/116-b3871d88915e.zip", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/117-a3c583d51c9b.geojson", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/118-2e333d1adab3.zip", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/123-9f1ffc274f7f.csv", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/124-560341e4477c.csv", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/125-ffca040a7195.csv", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/146-6b4e98f4c779.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/107-d777daf8d23d.csv", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/108-2031480ac743.csv", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/docs/2019-06-28-source-status.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/100-850f00b27330.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/form-submission-docs/form-submission-036-1873afe1dd72.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/ipp-docs/037-1f7e70d66b30.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/biosolids-docs/052-760656b79f1f.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
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
  ...import.meta.glob("../public/ipp-docs/001-4e9a0cdf0189.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/ipp-docs/002-3da57e8018fb.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/ipp-docs/003-4d20ff2cea09.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/ipp-docs/004-e09cc490d763.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/ipp-docs/005-b1f62dff2c41.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/ipp-docs/056-95a00ade695b.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/npdes-docs/038-8191c7e18aac.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/npdes-docs/044-a0347eae1366.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/npdes-docs/080-6a540cadcdc6.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/pfas-docs/098-044977305e5f.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/pfas-docs/099-f22dafcb83f6.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/dmr-docs/013-9a9721237464.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/dmr-docs/014-38abcc29105c.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/dmr-docs/015-e20050cc15eb.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/dmr-docs/016-36f3abe16dd1.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/dmr-docs/017-ff2a91f0f3b9.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/dmr-docs/018-6a73e78ae28d.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/compliance-docs/017-2713c81a8e63.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/compliance-docs/018-234577b7fcb4.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/compliance-docs/019-038472a6ae4c.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/compliance-docs/021-2bd817167074.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/compliance-docs/007-5e26c04f42e1.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/compliance-docs/060-dd5fb72d29bd.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/compliance-docs/062-4c293cc26b89.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/compliance-docs/063-bfbcd24d8a0a.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/008-29d8248efbf8.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/101-8716c8f5f6f1.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/102-9011dd4b0fe6.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/103-5114323584bd.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/docs/2014-preinspection.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/docs/2019-03-04-report-approval.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/docs/2019-12-pfas-status.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/compliance-docs/064-8ccde0a7d5d7.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/correspondence-docs/corr-043-dafd413abaeb.msg", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/126-5811dc8c913b.xlsx", {
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
  if (!path) return undefined;
  return bundledDocumentDownloads[`../public${path}`];
}
