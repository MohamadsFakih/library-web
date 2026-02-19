import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Library — Borrow & Discover Books",
  description: "Mini Library Management System. Browse, rent, and return books.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
