import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "SnapStage – AI Virtual Staging",
    template: "%s | SnapStage",
  },
  description:
    "Transform empty rooms into beautifully staged spaces in seconds with AI. Professional virtual staging for real estate agents, developers & homeowners.",
  keywords: [
    "virtual staging",
    "AI staging",
    "real estate",
    "interior design",
    "property photos",
    "home staging",
  ],
  authors: [{ name: "SnapStage" }],
  openGraph: {
    title: "SnapStage – AI Virtual Staging",
    description:
      "Transform empty rooms into beautifully staged spaces in seconds with AI.",
    type: "website",
    url: "https://snapstage.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapStage – AI Virtual Staging",
    description:
      "Transform empty rooms into beautifully staged spaces in seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
