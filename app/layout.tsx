import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SeddleUp",
    template: "%s | SeddleUp"
  },
  description: "Travel together. Settle up easily.",
  manifest: "/site.webmanifest",
  applicationName: "SeddleUp",
  metadataBase: new URL(process.env.PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "SeddleUp",
    description: "Travel together. Settle up easily.",
    siteName: "SeddleUp",
    images: [
      {
        url: "/app-icon-1024.png",
        width: 1024,
        height: 1024,
        alt: "SeddleUp"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "SeddleUp",
    description: "Travel together. Settle up easily.",
    images: ["/app-icon-1024.png"]
  },
  appleWebApp: {
    capable: true,
    title: "SeddleUp",
    statusBarStyle: "default",
    startupImage: ["/apple-touch-icon.png"]
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#0F172A"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
