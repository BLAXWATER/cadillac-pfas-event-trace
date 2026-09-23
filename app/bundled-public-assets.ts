import firstPagePreviewManifest from "./first-page-preview-manifest.json";
import nonPdfPreviewManifest from "./nonpdf-preview-manifest.json";

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

// Bundle records that do not already have a byte-identical source at the
// immutable public repository revision used by source-url.ts. Exact public
// copies stay available through their pinned archive URLs without consuming
// the Sites deployment package a second time.
const bundledDocumentDownloads = {
  ...import.meta.glob("../public/findings-docs/216-4ff61c6d3cb5.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/215-83ebcbda08bd.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/214-a915d8117200.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/213-ff4d48eb64da.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/212-69ab779993c2.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/211-edf83f5fdf7c.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/210-6aec96618242.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/208-6342e4abc27e.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/207-caaf3ea8f891.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/dmr-docs/273-d116d6d3b972.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/compliance-docs/067-1c869397a807.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/206-df0a9fe43a4c.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/205-99dc30a27739.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/wexford-docs/116-1406440ae1fc.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/199-c1524e21ac46.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/200-07119f8b3cdf.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/201-962cc6781463.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/202-82254e0c3a95.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/197-16057f68d1d5.pdf", { eager: true, import: "default", query: "?url" }),
  // The public repository no longer carries these two legacy paths. Bundle
  // their canonical local originals instead of falling back to dead URLs.
  ...import.meta.glob("../public/compliance-docs/066-637b27ce2526.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/correspondence-docs/corr-045-cfaee79bdc7e.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/wexford-docs/112-dacaccbf5061.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/wexford-docs/113-84ca68576d11.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/wexford-docs/114-302cac40449a.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/wexford-docs/115-1a26b8e7ef8d.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/1988-cadillac-ri-234880.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/lab-docs/091-c2427c56e094.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/lab-docs/041-b6acc1cf09fd.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/195-ab25bfa3b3c4.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/196-fa41c0f607d9.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/194-e0ad50e1248b.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/wexford-docs/111-d8141f278b56.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/wexford-docs/106-99937cdc748b.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/wexford-docs/107-099e4487d07d.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/wexford-docs/108-797f5a3db89e.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/wexford-docs/109-5cc3c1841ff9.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/wexford-docs/110-fb263b3ea6c1.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/193-c1fd49ce87b7.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/192-fa26ae6e44ab.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/191-82bfe8b8928e.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/190-c5ff637bb359.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/189-dcf0b6c8a088.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/188-979ad88f1240.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/187-d206785ff744.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/186-7f29198ab87d.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/185-710379d9664c.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/184-fbee0873f184.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/183-f3142342184f.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/182-4d3eb8cccf14.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/181-ca634234c53f.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/180-eb9d0123f72e.pdf", { eager: true, import: "default", query: "?url" }),
  ...import.meta.glob("../public/findings-docs/179-9c328775dc31.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/178-d632a7779e92.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/177-b1426df447ba.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/176-9a98818ae0fe.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/175-1abad5ad01bd.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/process-site-docs/process-site-018-26f79914deae.pdf", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../public/process-site-docs/process-site-019-1376a072059f.pdf", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../public/process-site-docs/process-site-020-28d1cb87cb36.pdf", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../public/process-site-docs/process-site-021-6c2e73d85da0.pdf", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../public/process-site-docs/process-site-022-fe153aeaa6d9.pdf", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../public/process-site-docs/process-site-023-0fcc5cbb1c14.pdf", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../public/reference-data/135-5f86ea369b77.pdf", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../public/reference-data/136-d6661d1949a4.pdf", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../public/wexford-docs/105-b03fe8433176.pdf", {
    eager: true,
    query: "?url",
    import: "default",
  }),
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
  ...import.meta.glob("../public/pfas-docs/100-cea8f3321719.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/pfas-docs/101-8fd975e9aa54.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/147-501cb6326dac.pdf", {
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
  ...import.meta.glob("../public/findings-docs/169-1dfb7b3336af.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/170-641352fc860b.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/findings-docs/171-165d76b4138d.pdf", {
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
  // Preserve HTML originals through the pinned raw archive: hosted HTML can
  // receive platform redirects and injected markup that change its bytes.
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
  ...import.meta.glob("../public/ipp-docs/151-774fbfdfab32.pdf", {
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
  ...import.meta.glob("../public/wexford-docs/100-7bc1b5bbf6f2.pdf", {
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
  ...import.meta.glob("../public/npdes-docs/080-6a540cadcdc6.pdf", {
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
  ...import.meta.glob("../public/compliance-docs/018-d38fe00fd269.pdf", {
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
  ...import.meta.glob("../public/compliance-docs/065-b2448afb1ecd.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/correspondence-docs/corr-043-dafd413abaeb.msg", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/correspondence-docs/corr-044-b0440ae9e001.pdf", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/126-5811dc8c913b.xlsx", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/127-13297ac0d9fd.xlsx", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/128-37442da8cfd0.xlsx", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/129-e6592f849203.doc", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/130-94714c1d52c9.doc", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/131-0805573f14c9.doc", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/132-969c9e8282e7.docx", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/133-730dad67c05a.doc", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../public/reference-data/134-89af44caa00a.doc", {
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
  if (!path) return undefined;
  // Historical intake manifests may use the full immutable source URL.
  const sourceKey = sourceUrl.split("#", 1)[0];
  const pdf = firstPagePreviewManifest as Record<string, string>;
  const other = nonPdfPreviewManifest as Record<string, {preview: string}>;
  const firstPagePath = pdf[path] ?? pdf[sourceKey] ?? other[path]?.preview ?? other[sourceKey]?.preview;
  if (!firstPagePath) return undefined;
  return bundledAssets[`../public${firstPagePath}`];
}

export function bundledDocumentDownload(sourceUrl: string): string | undefined {
  const path = publicDocumentPath(sourceUrl);
  if (!path) return undefined;
  return bundledDocumentDownloads[`../public${path}`];
}
