import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Glava } from "@/components/postavitev/Glava";
import { Noga } from "@/components/postavitev/Noga";
import { Gibanje } from "@/components/ui/Gibanje";
import { razrediPisav } from "./pisave";
import { ToastProvider } from "@/components/ui/Toast";
import { okolje } from "@/env";
import { naloziKontakt } from "@/katalog/podatki";
import { IME_KMETIJE } from "@/lib/kontakt";
import { izvorStrani } from "@/seo/izvor";
import { metapodatkiStrani, PREDLOGA_NASLOVA } from "@/seo/metapodatki";

const OPIS =
  "Lokalno pridelani šparglji, jagode, začimbe, liofilizirano sadje in domači izdelki. Obiščite nas v Podgori pri Novem mestu.";

/**
 * Skupni metapodatki (Z70): `metadataBase` iz `NEXT_PUBLIC_SITE_URL`, da so
 * kanonični in OG naslovi absolutni, predloga naslova in privzeta OG slika.
 * Okolje se bere ob zahtevi (ista gradnja teče na stagingu in v produkciji);
 * na stagingu (`NOINDEX=1`) je vsaka stran tudi v HTML označena z noindex.
 */
export async function generateMetadata(): Promise<Metadata> {
  const env = okolje();
  return {
    metadataBase: izvorStrani(env),
    title: { default: `${IME_KMETIJE} — Spletna trgovina s kmetije na Dolenjskem`, template: PREDLOGA_NASLOVA },
    keywords: ["kmetija", "spletna trgovina", "šparglji", "darilne škatle", "Dolenjska", "Novo mesto", "lokalna hrana"],
    ...metapodatkiStrani({ naslov: null, opis: OPIS, pot: null }),
    ...(env.NOINDEX === "1" ? { robots: { index: false, follow: false } } : {}),
  };
}

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const kontakt = await naloziKontakt();

  return (
    // `data-scroll-behavior`: Next.js med menjavo strani izklopi gladek
    // scroll, da nova stran začne na vrhu, ne pa sredi animacije.
    <html lang="sl" className={razrediPisav} data-scroll-behavior="smooth">
      <body className="flex min-h-dvh flex-col">
        <a
          href="#vsebina"
          className="sr-only z-50 type-nav focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:rounded-full focus:bg-brand focus:px-5 focus:py-2.5 focus:text-on-brand"
        >
          Skoči na vsebino
        </a>
        <Gibanje>
          <ToastProvider>
            <Glava telefon={kontakt.telefon} telefonPovezava={kontakt.telefonPovezava} />
            <main id="vsebina" className="flex-1">
              {children}
            </main>
            <Noga kontakt={kontakt} />
          </ToastProvider>
        </Gibanje>
      </body>
    </html>
  );
}
