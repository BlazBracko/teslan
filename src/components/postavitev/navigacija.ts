/**
 * Povezave glave (Z7) in noge (Z8) na enem mestu.
 *
 * Glava in noga kažeta samo na strani, ki že obstajajo: „Darila“ doda K10
 * (`/darila`), „Splošne pogoje“ in „Odstop od pogodbe“ pa K11 (`/pogoji`,
 * `/odstop`). Do takrat bi bile povezave na 404. Košarica ni v seznamu,
 * ker ima v glavi svojo ikono s številom kosov.
 */
export interface Povezava {
  href: string;
  oznaka: string;
}

export const GLAVNA_NAVIGACIJA: Povezava[] = [
  { href: "/", oznaka: "Domov" },
  { href: "/products", oznaka: "Izdelki" },
  { href: "/about", oznaka: "O nas" },
];

/** Stran košarice (ikona v glavi, Z7). */
export const POT_KOSARICE = "/kosarica";

/** Blagajna (K7). */
export const POT_BLAGAJNE = "/blagajna";

/** Splošni pogoji (povezava ob potrditvi na blagajni; celotno besedilo doda K11). */
export const POT_POGOJEV = "/pogoji";

export const POT_ZASEBNOSTI = "/privacyPolicy";

export const PRAVNE_POVEZAVE: Povezava[] = [{ href: "/privacyPolicy", oznaka: "Politika zasebnosti" }];

/** Ali je povezava aktivna na dani poti (podstrani izdelkov štejejo k „Izdelki“). */
export function jeAktivna(href: string, pot: string): boolean {
  if (href === "/") return pot === "/";
  return pot === href || pot.startsWith(`${href}/`);
}
