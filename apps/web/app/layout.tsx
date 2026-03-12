import type { Metadata } from "next";

import { PwaProvider } from "@/components/layout/pwa-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "NutriLens",
  description: "AI nutrition tracking that compares calories in versus calories out.",
  applicationName: "NutriLens",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-mist text-ink">
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
