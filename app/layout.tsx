import type { Metadata, Viewport } from "next";
import ServiceWorkerRegister from "./ServiceWorkerRegister";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://askdj.app"),
  title: "AskDJ",
  description: "Invia richieste al DJ con QR (YouTube, Spotify, Apple, Amazon, Tidal).",
  manifest: "/manifest.json", 
};


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegister />

        {children}
      </body>
    </html>
  );
}
