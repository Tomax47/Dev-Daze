import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dev Daze",
  description: "Interactive zen playground",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable} style={{ height: "100%", overflow: "hidden" }}>
      <body style={{ height: "100%", overflow: "hidden", margin: 0 }}>{children}</body>
    </html>
  );
}
