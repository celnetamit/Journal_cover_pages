import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "Journal Initial Pages Builder",
  description: "Create and download print-ready journal initial pages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
