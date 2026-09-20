"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadDocumentFile } from "./document-download";

export function DocumentDownloadButton({ name, downloadUrl }: { name: string; downloadUrl: string }) {
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  // A requested download continues if the visitor closes the preview.
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const download = async () => {
    if (controller.current) return;
    const operation = new AbortController();
    controller.current = operation;
    const timeout = window.setTimeout(() => operation.abort(), 120_000);
    setPending(true);
    setMessage("");
    try {
      await downloadDocumentFile(downloadUrl, name, {
        fetch: (url, options) => fetch(url, options),
        save: (blob, filename) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          link.remove();
          // Retain the object long enough for the browser's save operation.
          window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        },
      }, operation.signal);
      if (mounted.current) setMessage("Download started. Check your browser's downloads.");
    } catch {
      const fallback = document.createElement("a");
      fallback.href = downloadUrl;
      fallback.target = "_blank";
      fallback.rel = "noopener noreferrer";
      document.body.appendChild(fallback);
      fallback.click();
      fallback.remove();
      if (mounted.current) setMessage("The original opened in a new tab. Use your browser's download control to save it.");
    } finally {
      window.clearTimeout(timeout);
      controller.current = null;
      if (mounted.current) setPending(false);
    }
  };

  return <div className="document-download-control">
    <Button type="button" variant="outline" size="sm" onClick={download} disabled={pending} aria-label={`Download ${name}`}>
      <Download aria-hidden="true" />{pending ? "Preparing…" : "Download"}
    </Button>
    <span className="document-download-status" role="status" aria-live="polite">{message}</span>
  </div>;
}
