import { POT_TRGOVINE } from "@/katalog/nakup";

/**
 * Povezave glave (Z7) in noge (Z8) na enem mestu.
 *
 * Košarica ni v seznamu, ker ima v glavi svojo ikono s številom kosov.
 */
export interface Povezava {
  href: string;
  oznaka: string;
}

/**
 * „Trgovina“ vodi na spletno trgovino (izdelki, naročljivi na spletu); na
 * isti strani je izbira „Na kmetiji“ in „Vsi izdelki“.
 */
export const GLAVNA_NAVIGACIJA: Povezava[] = [
  { href: "/", oznaka: "Domov" },
  { href: POT_TRGOVINE, oznaka: "Trgovina" },
  { href: "/darila", oznaka: "Darila" },
  { href: "/about", oznaka: "O nas" },
];

/** Darilne škatle (K10, T5). */
export const POT_DARIL = "/darila";
export const POT_KONFIGURATORJA = "/darila/sestavi";

/** Konfigurator s pripravljenim programom (`/darila/sestavi?program=<slug>`). */
export const potPrograma = (slug: string) => `${POT_KONFIGURATORJA}?program=${encodeURIComponent(slug)}`;

/** Konfigurator z vsebino škatle iz košarice (T5 korak 4). */
export const potUrejanjaSkatle = (id: string) => `${POT_KONFIGURATORJA}?uredi=${encodeURIComponent(id)}`;

/** Stran košarice (ikona v glavi, Z7). */
export const POT_KOSARICE = "/kosarica";

/** Blagajna (K7). */
export const POT_BLAGAJNE = "/blagajna";

/** Pravne strani (Z8, Z61): noga, blagajna in sklici med pravnimi stranmi. */
export const POT_POGOJEV = "/pogoji";
export const POT_ODSTOPA = "/odstop";
export const POT_ZASEBNOSTI = "/privacyPolicy";

export const PRAVNE_POVEZAVE: Povezava[] = [
  { href: POT_POGOJEV, oznaka: "Splošni pogoji" },
  { href: POT_ODSTOPA, oznaka: "Odstop od pogodbe" },
  { href: POT_ZASEBNOSTI, oznaka: "Politika zasebnosti" },
];

/** Pomoč pri nakupu: dostava in plačilo, pogosta vprašanja, kontakt. */
export const POT_DOSTAVE = "/dostava";
export const POT_VPRASANJ = "/vprasanja";
export const POT_KONTAKTA = "/about#kontakt";

export const POMOC_POVEZAVE: Povezava[] = [
  { href: POT_DOSTAVE, oznaka: "Dostava in plačilo" },
  { href: POT_VPRASANJ, oznaka: "Pogosta vprašanja" },
  { href: POT_KONTAKTA, oznaka: "Kontakt" },
];

/** Ali je povezava aktivna na dani poti (podstrani izdelkov štejejo k „Trgovina“). */
export function jeAktivna(povezava: string, pot: string): boolean {
  const href = povezava.split("?")[0];
  if (href === "/") return pot === "/";
  return pot === href || pot.startsWith(`${href}/`);
}
