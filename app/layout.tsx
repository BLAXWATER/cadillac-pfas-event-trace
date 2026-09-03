import type { Metadata } from "next";
import "./globals.css";
import { bundledPublicAsset } from "./bundled-public-assets";

export const metadata: Metadata = {
  title: "Cadillac Contamination - Environmental Records Repository",
  description: "Hierarchical, source-linked PFAS event trace with event timestamps, embedded file metadata and an evidence request queue.",
  icons: {
    icon: bundledPublicAsset("/favicon.svg"),
    shortcut: bundledPublicAsset("/favicon.svg"),
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
