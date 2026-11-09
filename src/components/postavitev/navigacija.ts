/**
 * Povezave glave (Z7) in noge (Z8) na enem mestu.
 *
 * Glava in noga kažeta samo na strani, ki že obstajajo: „Darila“ doda K10
 * (`/darila`), ikono košarice K6 (`/kosarica`), „Splošne pogoje“ in
 * „Odstop od pogodbe“ pa K11 (`/pogoji`, `/odstop`). Do takrat bi bile
 * povezave na 404.
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

export const PRAVNE_POVEZAVE: Povezava[] = [{ href: "/privacyPolicy", oznaka: "Politika zasebnosti" }];

/** Ali je povezava aktivna na dani poti (podstrani izdelkov štejejo k „Izdelki“). */
export function jeAktivna(href: string, pot: string): boolean {
  if (href === "/") return pot === "/";
  return pot === href || pot.startsWith(`${href}/`);
}
