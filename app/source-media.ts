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
  return format === "PDF" ? withPdfPage(url) : url;
}
