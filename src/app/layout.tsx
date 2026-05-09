// src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FinFlow — Invoice & Finance Management",
    template: "%s | FinFlow",
  },
  description:
    "FinFlow is a modern invoice and finance management platform for freelancers and growing businesses. Track invoices, expenses, clients, and cash flow in one place.",
  keywords: [
    "invoice management",
    "finance dashboard",
    "expense tracking",
    "cash flow",
    "billing software",
    "freelancer tools",
    "SaaS finance",
  ],
  authors: [{ name: "FinFlow" }],
  creator: "FinFlow",
  metadataBase: new URL("https://finflow-three-pied.vercel.app"), // ← replace with your actual URL
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://finflow-three-pied.vercel.app",
    siteName: "FinFlow",
    title: "FinFlow — Invoice & Finance Management",
    description:
      "Modern invoice and finance management for freelancers and growing businesses.",
    images: [
      {
        url: "/og-image.png", // add a 1200x630 image to /public
        width: 1200,
        height: 630,
        alt: "FinFlow Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinFlow — Invoice & Finance Management",
    description:
      "Modern invoice and finance management for freelancers and growing businesses.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}