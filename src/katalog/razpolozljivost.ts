import { oznakaSezone, stanjeSezone, type Mesec, type Sezona } from "./sezona";

/**
 * Načini prodaje (Z10): vsak izdelek ima natanko enega.
 *  - `posta-in-prevzem`: naročljiv za pošiljanje po pošti ali prevzem,
 *  - `samo-prevzem`: naročljiv samo za prevzem na kmetiji,
 *  - `samo-prikaz`: viden v katalogu, a ni naročljiv (npr. sveže jagode).
 */
export const NACINI_PRODAJE = ["posta-in-prevzem", "samo-prevzem", "samo-prikaz"] as const;
export type NacinProdaje = (typeof NACINI_PRODAJE)[number];

export const OZNAKE_NACINOV: Record<NacinProdaje, string> = {
  "posta-in-prevzem": "Pošta in prevzem na kmetiji",
  "samo-prevzem": "Samo prevzem na kmetiji",
  "samo-prikaz": "Samo prikaz (ni naročljivo)",
};

/** Pod to zalogo (vključno) oznaka pove točno število kosov (Z13). */
export const MALO_ZALOGE = 3;

export type VrstaRazpolozljivosti =
  | "na-zalogi"
  | "malo"
  | "ni-na-zalogi"
  | "kmalu"
  | "izven-sezone"
  | "na-kmetiji";

export interface Razpolozljivost {
  vrsta: VrstaRazpolozljivosti;
  /** Ali se velikost da dati v košarico. */
  narocljiva: boolean;
  /** Besedilo oznake, kot ga vidi kupec. */
  oznaka: string;
}

export interface IzdelekZaRazpolozljivost {
  nacinProdaje: NacinProdaje;
  sezona: Sezona | null;
}

export interface VelikostZaRazpolozljivost {
  cenaCenti: number | null;
  zaloga: number | null;
}

/** „1 kos“, „2 kosa“, „3 kosi“, „5 kosov“ (slovenska dvojina in množina). */
export function steviloKosov(n: number): string {
  const ostanek = n % 100;
  if (ostanek === 1) return `${n} kos`;
  if (ostanek === 2) return `${n} kosa`;
  if (ostanek === 3 || ostanek === 4) return `${n} kosi`;
  return `${n} kosov`;
}

/**
 * Razpoložljivost ene velikosti (Z11–Z13): naročljiva je, če način ni
 * `samo-prikaz`, je izdelek v sezoni, ima ceno in je zaloga > 0.
 */
export function razpolozljivostVelikosti(
  izdelek: IzdelekZaRazpolozljivost,
  velikost: VelikostZaRazpolozljivost,
  mesec: Mesec,
): Razpolozljivost {
  if (izdelek.nacinProdaje === "samo-prikaz") {
    return { vrsta: "na-kmetiji", narocljiva: false, oznaka: "Na voljo na kmetiji" };
  }
  const sezona = stanjeSezone(izdelek.sezona, mesec);
  if (sezona === "kmalu") {
    return { vrsta: "kmalu", narocljiva: false, oznaka: "Kmalu" };
  }
  if (sezona === "izven-sezone" && izdelek.sezona) {
    return {
      vrsta: "izven-sezone",
      narocljiva: false,
      oznaka: `Sezona ${oznakaSezone(izdelek.sezona)}`,
    };
  }
  const zaloga = velikost.zaloga ?? 0;
  if (zaloga <= 0 || velikost.cenaCenti == null) {
    return { vrsta: "ni-na-zalogi", narocljiva: false, oznaka: "Ni na zalogi" };
  }
  if (zaloga <= MALO_ZALOGE) {
    return { vrsta: "malo", narocljiva: true, oznaka: `Še ${steviloKosov(zaloga)}` };
  }
  return { vrsta: "na-zalogi", narocljiva: true, oznaka: "Na zalogi" };
}

/** Dodatna oznaka načina prodaje na kartici in podstrani (Z13). */
export function oznakaNacinaProdaje(nacin: NacinProdaje): string | null {
  return nacin === "samo-prevzem" ? "Samo prevzem na kmetiji" : null;
}

/**
 * Najnižja cena med naročljivimi velikostmi (za „od X €“, Z14/Z16) ali
 * `null`, če ni naročljiva nobena.
 */
export function najnizjaNarocljivaCena(
  izdelek: IzdelekZaRazpolozljivost & { velikosti: VelikostZaRazpolozljivost[] },
  mesec: Mesec,
): number | null {
  const cene = izdelek.velikosti
    .filter((v) => razpolozljivostVelikosti(izdelek, v, mesec).narocljiva)
    .map((v) => v.cenaCenti as number);
  return cene.length > 0 ? Math.min(...cene) : null;
}
