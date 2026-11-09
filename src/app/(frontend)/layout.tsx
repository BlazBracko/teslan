import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Glava } from "@/components/postavitev/Glava";
import { Noga } from "@/components/postavitev/Noga";
import { ToastProvider } from "@/components/ui/Toast";
import { naloziKontakt } from "@/katalog/podatki";

export const metadata: Metadata = {
  title: "Domačija Tešlan — Sveža ekološka hrana iz Dolenjske",
  description:
    "Lokalno pridelani šparglji, jagode, začimbe, liofilizirano sadje in domači izdelki. Obiščite nas v Podgori pri Novem mestu.",
  keywords: "kmetija, ekološko, šparglji, Dolenjska, Novo mesto, lokalna hrana",
  openGraph: {
    title: "Domačija Tešlan",
    description: "Iz naše zemlje na vašo mizo.",
    locale: "sl_SI",
  },
};

export const viewport: Viewport = {
  // Barva sistemske vrstice na mobilnem = `--color-canvas` (meta oznaka ne
  // more brati CSS spremenljivke).
  themeColor: "#f6f3ec",
};

/**
 * Glava in noga berejo kontakt iz nastavitev trgovine (baza), zato se vse
 * javne strani izrišejo ob zahtevi; podatki so predpomnjeni (Z17), gradnja
 * pa ne potrebuje baze.
 */
export const dynamic = "force-dynamic";

// Pisavi identitete (Z1): Fraunces za naslove, Inter za besedilo in
// vmesnik. Obe sta spremenljivi z osjo optične velikosti in obe imata
// latin-ext (č, š, ž). Izpostavita se kot CSS spremenljivki, ki ju
// `globals.css` preslika v `--font-display` in `--font-sans`; literalno
// ime družine ne deluje, ker ga next/font hashira.
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "SOFT"],
  display: "swap",
  variable: "--font-fraunces",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-inter",
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const kontakt = await naloziKontakt();

  return (
    <html lang="sl" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#vsebina"
          className="sr-only z-50 type-nav focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:rounded-full focus:bg-brand focus:px-5 focus:py-2.5 focus:text-on-brand"
        >
          Skoči na vsebino
        </a>
        <ToastProvider>
          <Glava telefon={kontakt.telefon} telefonPovezava={kontakt.telefonPovezava} />
          <main id="vsebina" className="flex-1">
            {children}
          </main>
          <Noga kontakt={kontakt} />
        </ToastProvider>
      </body>
    </html>
  );
}
