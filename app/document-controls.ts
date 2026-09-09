import { sourceMediaKind, type SourceFormat } from "./source-media";

export function documentPreviewCaption(source: { format: SourceFormat; previewPage?: number }): string {
  if (source.format === "PDF") return `Page ${source.previewPage ?? 1} preview`;
  if (sourceMediaKind(source.format) === "image") return "Original source image";
  return "Content excerpt from the original file; not original page layout. Download for the complete file.";
}
