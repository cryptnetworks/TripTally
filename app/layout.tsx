import type { Metadata } from "next";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "TripTally",
  description: "Track group trip expenses and settlements.",
  manifest: "/manifest.webmanifest",
  applicationName: "TripTally",
  appleWebApp: {
    capable: true,
    title: "TripTally",
    statusBarStyle: "default"
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.svg"
  }
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
