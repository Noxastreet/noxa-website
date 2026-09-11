import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { MotionProvider } from "@/components/motion/MotionProvider";
import { SitePreferencesGate } from "@/components/preferences/SitePreferencesGate";

import "./globals.css";
import "./header-logo.css";
import "./public-feature-visibility.css";

const SITE_TITLE = "NOXA — Car & Moto Events in Greece";
const SITE_DESCRIPTION =
  "Discover car and moto events, organizers, tracks, routes and verified automotive places across Greece with NOXA.";

export const metadata: Metadata = {
  metadataBase: new URL("https://noxastreetapp.com"),
  title: {
    default: SITE_TITLE,
    template: "%s | NOXA",
  },
  description: SITE_DESCRIPTION,
  applicationName: "NOXA",
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      el: "/el",
    },
  },
  icons: {
    icon: [{ url: "/icon.png", sizes: "300x300", type: "image/png" }],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "https://noxastreetapp.com",
    siteName: "NOXA",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/brand/noxa-og-preview.jpg",
        width: 1200,
        height: 630,
        alt: "NOXA — Car & Moto Events in Greece",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/brand/noxa-og-preview.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-noxa-locale") === "el" ? "el" : "en";

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://videos.pexels.com" />
        <link rel="preconnect" href="https://images.pexels.com" />
        <link rel="dns-prefetch" href="https://videos.pexels.com" />
      </head>
      <body>
        <MotionProvider>{children}</MotionProvider>
        <SitePreferencesGate />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
