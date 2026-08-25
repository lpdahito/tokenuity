import type { Metadata } from "next";

import { Playfair_Display, Rubik } from "next/font/google";

import { Logo } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Tokenuity",
  description: "My on-chain portfolio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${rubik.variable}`}>
      <body className="text-[13px] bg-bg text-fg font-sans min-h-screen flex flex-col items-center antialiased">
        <Navbar />

        <Logo />

        <main className="flex w-full max-w-[800px] flex-1 flex-col items-center">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}
