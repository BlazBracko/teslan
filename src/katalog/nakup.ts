import { jeNaKmetiji, type NacinProdaje } from "./razpolozljivost";

/**
 * Filter „Način nakupa“ na seznamu izdelkov. Kupec takoj vidi, kaj lahko
 * naroči na spletu in kaj kupi samo na kmetiji, namesto da to išče po
 * posameznih karticah.
 *
 *  - `vse`: celoten katalog (privzeto, tudi za stare povezave s kategorijo),
 *  - `splet`: spletna trgovina, izdelki, ki jih pošljemo po pošti (ali jih
 *    kupec prevzame, če tako izbere),
 *  - `kmetija`: vse, kar je vezano na kmetijo (`samo-prevzem` in
 *    `samo-prikaz`): kupec ga vidi pod eno oznako „Na voljo na kmetiji“.
 *    Nekatere od teh lahko naroči na spletu za prevzem, ostale kupi v živo.
 *
 * Stanje je v URL (`?nakup=splet`), enako kot filter kategorij.
 */
export const NACINI_NAKUPA = ["vse", "splet", "kmetija"] as const;
export type NacinNakupa = (typeof NACINI_NAKUPA)[number];

export const PARAMETER_NAKUPA = "nakup";

/** Vrednost iz URL; neznana ali manjkajoča pomeni `vse`. */
export function nacinNakupaIzParametra(vrednost: string | string[] | undefined): NacinNakupa {
  const v = Array.isArray(vrednost) ? vrednost[0] : vrednost;
  return (NACINI_NAKUPA as readonly string[]).includes(v ?? "") ? (v as NacinNakupa) : "vse";
}

export function ustrezaNacinuNakupa(izdelek: { nacinProdaje: NacinProdaje }, nacin: NacinNakupa): boolean {
  if (nacin === "vse") return true;
  const naKmetiji = jeNaKmetiji(izdelek.nacinProdaje);
  return nacin === "kmetija" ? naKmetiji : !naKmetiji;
}

/** Povezava na seznam izdelkov z izbranim načinom nakupa in kategorijo. */
export function potSeznama({ nakup, kategorija }: { nakup?: NacinNakupa; kategorija?: string | null }): string {
  const iskanje = new URLSearchParams();
  if (nakup && nakup !== "vse") iskanje.set(PARAMETER_NAKUPA, nakup);
  if (kategorija) iskanje.set("kategorija", kategorija);
  const niz = iskanje.toString();
  return niz ? `/products?${niz}` : "/products";
}

/** Spletna trgovina: seznam izdelkov, ki jih pošljemo po pošti. */
export const POT_TRGOVINE = potSeznama({ nakup: "splet" });

/** Seznam, na katerega vodi „Nazaj“ s podstrani izdelka, ko zgodovine ni. */
export function potSeznamaZaIzdelek(izdelek: { nacinProdaje: NacinProdaje }): string {
  return potSeznama({ nakup: jeNaKmetiji(izdelek.nacinProdaje) ? "kmetija" : "splet" });
}
