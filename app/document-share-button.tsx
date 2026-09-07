"use client";

import React, { useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { documentShareUrl, shareDocumentLink } from "./document-share";

export function DocumentShareButton({ name, downloadUrl }: { name: string; downloadUrl: string }) {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [manualUrl, setManualUrl] = useState("");

  const share = async () => {
    if (busy.current) return;
    const url = documentShareUrl(downloadUrl, window.location.origin);
    setMessage("");
    setManualUrl("");
    if (!url) {
      setMessage("Use Share on the published site for a public document link.");
      return;
    }
    busy.current = true;
    setPending(true);
    try {
      // Invoke in the click handler, retaining the browser's user activation.
      const result = await shareDocumentLink({ title: name, url }, {
        share: navigator.share ? (data) => navigator.share(data) : undefined,
        canShare: navigator.canShare ? (data) => navigator.canShare(data) : undefined,
        writeText: navigator.clipboard?.writeText ? (text) => navigator.clipboard.writeText(text) : undefined,
      });
      if (result === "copied") setMessage("Link copied. Paste it to share this document.");
      if (result === "manual") {
        setManualUrl(url);
        setMessage("Automatic copying is unavailable. Select and copy this document link.");
      }
    } finally {
      busy.current = false;
      setPending(false);
    }
  };

  return <div className="document-share-control">
    <Button type="button" variant="outline" size="sm" onClick={share} disabled={pending} aria-label={`Share ${name}`}>
      <Share2 aria-hidden="true" />{pending ? "Sharing…" : "Share"}
    </Button>
    <span className="document-share-status" role="status" aria-live="polite">{message}</span>
    {manualUrl && <label className="document-share-link">Document link
      <Input readOnly value={manualUrl} onFocus={(event) => event.currentTarget.select()} onClick={(event) => event.currentTarget.select()} />
    </label>}
  </div>;
}
