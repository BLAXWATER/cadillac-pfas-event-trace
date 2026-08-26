import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cadillac PFAS Event Trace",
  description: "Interactive source-linked event trace for Cadillac WWTP, Wexford County Landfill leachate and Plett Road PFAS records.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
