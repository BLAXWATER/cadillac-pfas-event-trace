import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cadillac PFAS Event Trace",
  description: "Hierarchical, source-linked PFAS event trace with event timestamps, embedded file metadata and an evidence request queue.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
