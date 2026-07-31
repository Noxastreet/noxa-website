import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://noxastreetapp.com"),
  title: {
    default: "NOXA — The road becomes social",
    template: "%s | NOXA",
  },
  description:
    "Discover drivers, car meets, crews and automotive events around you with NOXA.",
  applicationName: "NOXA",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      <body>{children}</body>
    </html>
  );
}
