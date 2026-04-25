import type { Metadata } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const lilitaOne = localFont({
  src: "../public/fonts/LilitaOne.woff2",
  variable: "--font-lilita-one",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dev Daze",
  description: "Interactive zen playground",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${lilitaOne.variable}`} style={{ height: "100%", overflow: "hidden" }}>
      <body style={{ height: "100%", overflow: "hidden", margin: 0 }}>{children}</body>
    </html>
  );
}
