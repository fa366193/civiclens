import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicLens — Public decisions, made locally legible",
  description:
    "A source-grounded civic intelligence prototype that turns public meetings into mapped decisions, deadlines, and resident action briefs.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "CivicLens",
    description: "Find the decision. See where it lands.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
