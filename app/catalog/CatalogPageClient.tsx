"use client";

/* eslint-disable @next/next/no-img-element -- previews are local evidence assets */

import { useMemo, useState } from "react";
import { ArrowLeft, FileSearch, Search } from "lucide-react";
import { bundledDocumentDownload, bundledFirstPagePreview } from "../bundled-public-assets";
import { documentSummary } from "../document-summary.mjs";
import { DocumentDownloadButton } from "../document-download-button";
import { DocumentShareButton } from "../document-share-button";
import { formatSourceDisplayName } from "../source-display-name";
import { withPdfStartPage } from "../pdf-source-url";
import { sourceDownloadUrl, type SourceFormat } from "../source-media";
import { catalogPageList, type CatalogPageConfig, type CatalogRecord } from "./catalog-data";
import { SourceCatalogLinks } from "../source-catalog-links";

type Props = { config: CatalogPageConfig };

const formatBytes = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return "Size not recorded";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const searchableText = (record: CatalogRecord) => [
  record.name,
  record.type,
  record.category,
  record.description,
  record.year,
  record.format,
].filter(Boolean).join(" ").toLowerCase();

function RecordCard({ record }: { record: CatalogRecord }) {
  const preview = bundledFirstPagePreview(record.url);
  const sourceFormat = (record.format ?? "OTHER") as SourceFormat;
  const sourceHref = bundledDocumentDownload(record.url)
    ?? sourceDownloadUrl(record.url, sourceFormat, (url) => withPdfStartPage(url));
  const title = formatSourceDisplayName(record.name, record.format ?? undefined, Boolean(record.url));

  return (
    <article className="catalog-page-card" data-record-id={record.id}>
      <div className="catalog-page-card-topline">
        <span>{record.format ?? "SOURCE"}</span>
        {record.year && <span>{record.year}</span>}
        {Boolean(record.pages) && <span>{record.pages} {record.pages === 1 ? "page" : "pages"}</span>}
      </div>
      <div className="catalog-page-card-content">
        {preview ? (
          <a className="catalog-page-preview" href={sourceHref} target="_blank" rel="noreferrer" aria-label={`Open ${title}`}>
            <img src={preview} alt={`First page preview of ${title}`} loading="lazy" />
          </a>
        ) : (
          <div className="catalog-page-preview catalog-page-preview-empty" aria-hidden="true"><FileSearch size={28} /></div>
        )}
        <div className="catalog-page-card-copy">
          <h2>{title}</h2>
          <p>{documentSummary(record)}</p>
          <dl className="catalog-page-card-meta">
            <div><dt>Record type</dt><dd>{record.type ?? "Not recorded"}</dd></div>
            <div><dt>File size</dt><dd>{formatBytes(record.size)}</dd></div>
            {record.sha256 && <div><dt>SHA-256</dt><dd className="catalog-page-hash">{record.sha256}</dd></div>}
          </dl>
          <div className="catalog-page-card-actions" aria-label={`Actions for ${title}`}>
            <DocumentDownloadButton name={record.name} downloadUrl={sourceHref} />
            <DocumentShareButton name={title} downloadUrl={sourceHref} />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CatalogPageClient({ config }: Props) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const records = useMemo(
    () => normalizedQuery ? config.documents.filter((record) => searchableText(record).includes(normalizedQuery)) : config.documents,
    [config.documents, normalizedQuery],
  );

  return (
    <main className="site-shell catalog-page">
      <header className="catalog-page-header">
        <a className="catalog-page-back" href="/"><ArrowLeft size={16} aria-hidden="true" /> Back to evidence timeline</a>
        <p className="eyebrow">{config.eyebrow}</p>
        <h1>{config.title}</h1>
        <p className="catalog-page-summary">{config.description}</p>
        <div className="catalog-page-statline"><strong>{config.documents.length}</strong> distinct cataloged records <span aria-hidden="true">·</span> original source links preserved</div>
      </header>

      <nav className="catalog-page-nav" aria-label="Source catalog pages">
        <SourceCatalogLinks links={catalogPageList.map((page) => ({ slug: page.slug, href: `/catalog/${page.slug}`, label: page.buttonLabel }))} activeSlug={config.slug} />
      </nav>

      <section className="catalog-page-controls" aria-label="Search this category">
        <label htmlFor="catalog-search"><Search size={18} aria-hidden="true" /> Search this category</label>
        <input id="catalog-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, year, type or description" />
        <span>{records.length} shown</span>
      </section>

      <section className="catalog-page-grid" aria-live="polite">
        {records.length ? records.map((record) => <RecordCard key={record.id} record={record} />) : (
          <div className="catalog-page-empty"><h2>No records match that search.</h2><p>Clear the search to return to the complete {config.buttonLabel.toLowerCase()} catalog.</p></div>
        )}
      </section>
    </main>
  );
}
