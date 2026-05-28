import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Trip Tally",
    template: "%s | Trip Tally"
  },
  description: "Track travel expenses and split trip costs easily.",
  manifest: "/manifest.webmanifest",
  applicationName: "Trip Tally",
  metadataBase: new URL(process.env.PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Trip Tally",
    description: "Track travel expenses and split trip costs easily.",
    siteName: "Trip Tally",
    images: [
      {
        url: "/branding/og-image.png",
        width: 1200,
        height: 630,
        alt: "Trip Tally"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Trip Tally",
    description: "Track travel expenses and split trip costs easily.",
    images: ["/branding/og-image.png"]
  },
  appleWebApp: {
    capable: true,
    title: "Trip Tally",
    statusBarStyle: "default",
    startupImage: ["/branding/apple-touch-icon.png"]
  },
  icons: {
    icon: [
      { url: "/branding/favicon.ico", sizes: "64x64" },
      { url: "/branding/logo-icon.png", type: "image/png", sizes: "512x512" }
    ],
    apple: "/branding/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#0f766e"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
