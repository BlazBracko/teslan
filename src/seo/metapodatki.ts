import type { Metadata } from "next";
import { IME_KMETIJE } from "@/lib/kontakt";

/**
 * Metapodatki strani (Z70, Z72): naslov, opis, kanonični URL in Open Graph.
 * Vse javne strani jih sestavijo tu, da ima vsaka enako obliko. Relativni
 * naslovi se razrešijo proti `metadataBase` iz korenske postavitve.
 *
 * Next metapodatke združuje plitvo: `openGraph` strani v celoti zamenja
 * tistega iz postavitve, zato ga sestavimo v celoti (tudi s privzeto sliko).
 */

/** Privzeta slika za deljenje (domača stran in strani brez lastne slike). */
export const PRIVZETA_SLIKA_OG = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: "Polje jagod na Domačiji Tešlan v Podgori pri Novem mestu",
} as const;

/** Predloga naslova: „Izdelki — Domačija Tešlan“. */
export const PREDLOGA_NASLOVA = `%s — ${IME_KMETIJE}`;

export interface SlikaOG {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
}

export interface PodatkiStrani {
  /** Naslov brez imena kmetije (doda ga predloga); `null` = privzeti naslov. */
  naslov: string | null;
  opis: string;
  /**
   * Pot strani brez parametrov, razen kadar parameter določa vsebino.
   * `null` samo v korenski postavitvi (privzete vrednosti brez kanoničnega URL).
   */
  pot: string | null;
  slike?: SlikaOG[];
  /** Strani, ki jih iskalniki ne smejo indeksirati (košarica, blagajna …). */
  brezIndeksa?: boolean;
  /** Tudi povezav s strani ne sledijo (naročilo z žetonom, slogovni vodnik). */
  brezSledenja?: boolean;
}

export function metapodatkiStrani(p: PodatkiStrani): Metadata {
  const slike = (p.slike?.length ? p.slike : [PRIVZETA_SLIKA_OG]).map((s) => ({
    url: s.url,
    alt: s.alt,
    ...(s.width ? { width: s.width } : {}),
    ...(s.height ? { height: s.height } : {}),
  }));
  const naslovOG = p.naslov ?? IME_KMETIJE;
  return {
    ...(p.naslov ? { title: p.naslov } : {}),
    description: p.opis,
    ...(p.pot ? { alternates: { canonical: p.pot } } : {}),
    openGraph: {
      type: "website",
      locale: "sl_SI",
      siteName: IME_KMETIJE,
      title: naslovOG,
      description: p.opis,
      ...(p.pot ? { url: p.pot } : {}),
      images: slike,
    },
    twitter: { card: "summary_large_image", title: naslovOG, description: p.opis, images: slike.map((s) => s.url) },
    ...(p.brezIndeksa || p.brezSledenja
      ? { robots: { index: false, follow: !p.brezSledenja } }
      : {}),
  };
}
