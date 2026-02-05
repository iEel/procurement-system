import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "Procurement System | ระบบจัดซื้อ",
  description: "ระบบจัดซื้อ (Procurement System) สำหรับบริษัท",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${sarabun.variable} font-sans antialiased bg-gray-50`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
