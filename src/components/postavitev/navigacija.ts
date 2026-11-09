/**
 * Povezave glave (Z7) in noge (Z8) na enem mestu.
 *
 * Košarica ni v seznamu, ker ima v glavi svojo ikono s številom kosov.
 */
export interface Povezava {
  href: string;
  oznaka: string;
}

export const GLAVNA_NAVIGACIJA: Povezava[] = [
  { href: "/", oznaka: "Domov" },
  { href: "/products", oznaka: "Izdelki" },
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

/** Ali je povezava aktivna na dani poti (podstrani izdelkov štejejo k „Izdelki“). */
export function jeAktivna(href: string, pot: string): boolean {
  if (href === "/") return pot === "/";
  return pot === href || pot.startsWith(`${href}/`);
}
