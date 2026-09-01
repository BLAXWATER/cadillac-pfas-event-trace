import { repositorySourceUrl } from "./source-url";

export type SourceFormat =
  | "PDF"
  | "HTML"
  | "JPG"
  | "JPEG"
  | "PNG"
  | "WEBP"
  | "DOC"
  | "DOCX"
  | "XLS"
  | "XLSX"
  | "CSV"
  | "TSV"
  | "MSG"
  | "ZIP"
  | "TXT"
  | "OTHER";

export type SourceMediaKind = "pdf" | "html" | "image" | "spreadsheet" | "office" | "archive" | "other";

const imageFormats = new Set<SourceFormat>(["JPG", "JPEG", "PNG", "WEBP"]);
const spreadsheetFormats = new Set<SourceFormat>(["XLS", "XLSX", "CSV", "TSV"]);
const officeFormats = new Set<SourceFormat>(["DOC", "DOCX", "MSG", "TXT"]);

export function sourceMediaKind(format: SourceFormat): SourceMediaKind {
  if (format === "PDF") return "pdf";
  if (format === "HTML") return "html";
  if (imageFormats.has(format)) return "image";
  if (spreadsheetFormats.has(format)) return "spreadsheet";
  if (officeFormats.has(format)) return "office";
  if (format === "ZIP") return "archive";
  return "other";
}

export function sourcePreviewUrl(source: {
  format: SourceFormat;
  preview?: string;
  url?: string;
}): string | undefined {
  if (source.preview) return source.preview;
  return sourceMediaKind(source.format) === "image" ? source.url : undefined;
}

export function sourceDocumentUrl(
  url: string,
  format: SourceFormat,
  withPdfPage: (url: string) => string,
): string {
  return format === "PDF" ? withPdfPage(url) : repositorySourceUrl(url);
}

function rawRepositoryUrl(url: string, keepFragment: boolean): string {
  const fragmentIndex = url.indexOf("#");
  const base = fragmentIndex >= 0 ? url.slice(0, fragmentIndex) : url;
  const fragment = fragmentIndex >= 0 ? url.slice(fragmentIndex) : "";
  const rawBase = base.replace(
    /^(https:\/\/github\.com\/BLAXWATER\/cadillac-pfas-event-trace\/)blob\//i,
    "$1raw/",
  );

  return `${rawBase}${keepFragment ? fragment : ""}`;
}

export function sourceInlineUrl(
  url: string,
  format: SourceFormat,
  withPdfPage: (url: string) => string,
): string {
  return rawRepositoryUrl(sourceDocumentUrl(url, format, withPdfPage), true);
}

export function sourceDownloadUrl(
  url: string,
  format: SourceFormat,
  withPdfPage: (url: string) => string,
): string {
  return rawRepositoryUrl(sourceDocumentUrl(url, format, withPdfPage), false);
}
