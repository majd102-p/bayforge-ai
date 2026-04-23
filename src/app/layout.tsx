import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = localFont({
  src: [
    {
      path: "../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    {
      path: "../../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BayForge AI - California ADU Zoning Analysis Platform",
  description: "AI-powered ADU zoning analysis for 58+ California cities. Multi-agent RAG system with 7 AI models. Get instant zoning answers with legal code references. Free to start.",
  keywords: ["BayForge AI", "ADU", "Accessory Dwelling Unit", "California zoning", "ADU regulations", "JADU", "California ADU laws", "zoning analysis", "Gov Code 65852.2", "AB 2221", "SB 897", "AI zoning", "multi-agent RAG"],
  authors: [{ name: "BayForge AI" }],
  icons: {
    icon: "/hero-bg.png",
  },
  openGraph: {
    title: "BayForge AI - California ADU Zoning Analysis",
    description: "AI-powered ADU zoning analysis for 58+ California cities with legal code references.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BayForge AI - California ADU Zoning Analysis",
    description: "AI-powered ADU zoning analysis for 58+ California cities with legal code references.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
