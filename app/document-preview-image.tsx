"use client";

import { useState } from "react";

export function DocumentPreviewImage({ src, name, caption }: { src: string; name: string; caption: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="unsupported-document" role="status">
    <strong>Preview image could not load</strong>
    <p>Download or share the original document using the controls above.</p>
  </div>;
  // The source-derived image is already optimized and must remain byte-identifiable.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={`${caption} of ${name}`} onError={() => setFailed(true)} />;
}
