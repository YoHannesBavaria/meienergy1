import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Navigation } from "@/components/navigation";
import { SiteFooter } from "@/components/site-footer";
import { getSiteContent } from "@/lib/content";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mei Energy | Fitness & Gesundheit in Passau",
  description: "Mei Energy in Passau: Kurse, Team, Angebote und persoenliche Betreuung fuer dein Training.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const content = await getSiteContent();

  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${cormorant.variable} ${manrope.variable}`}>
        <Navigation menuItems={content.menuItems} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
