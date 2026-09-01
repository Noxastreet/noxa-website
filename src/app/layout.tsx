import type { Metadata, Viewport } from "next";

import { MotionProvider } from "@/components/motion/MotionProvider";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://noxastreetapp.com"),
  title: {
    default: "NOXA — The road becomes social",
    template: "%s | NOXA",
  },
  description:
    "Discover drivers, car meets, crews, routes and automotive events around you with NOXA.",
  applicationName: "NOXA",
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      el: "/el",
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "https://noxastreetapp.com",
    siteName: "NOXA",
    title: "NOXA — The road becomes social",
    description:
      "Discover drivers, car meets, crews, routes and automotive events around you with NOXA.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NOXA — The road becomes social",
    description:
      "Discover drivers, car meets, crews, routes and automotive events around you with NOXA.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
