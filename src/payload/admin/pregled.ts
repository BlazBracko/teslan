import { MALO_ZALOGE, type NacinProdaje } from "@/katalog/razpolozljivost";

/**
 * Čista logika nadzorne plošče admina (`NadzornaPlosca.tsx`): kaj je
 * treba pokazati, ne kako. Ločeno, da je preverljivo s testi.
 */

export interface IzdelekZaPregled {
  id: number | string;
  ime: string;
  objavljen?: boolean | null;
  nacinProdaje?: NacinProdaje | null;
  velikosti?: Array<{ id?: string | null; oznaka?: string | null; zaloga?: number | null }> | null;
}

export interface SkatlaZaPregled {
  id: number | string;
  ime: string;
  aktiven?: boolean | null;
  zaloga?: number | null;
}

export interface NizkaZaloga {
  vrsta: "izdelek" | "skatla";
  id: number | string;
  ime: string;
  /** Oznaka velikosti; pri škatli prazno. */
  velikost: string | null;
  zaloga: number;
}

/**
 * Velikosti objavljenih, naročljivih izdelkov in aktivne škatle z zalogo
 * `meja` ali manj, najprej tiste, ki jih je zmanjkalo. „Samo prikaz“ nima
 * zaloge, neobjavljenih kupci ne vidijo.
 */
export function nizkaZaloga(
  izdelki: readonly IzdelekZaPregled[],
  skatle: readonly SkatlaZaPregled[] = [],
  meja: number = MALO_ZALOGE,
): NizkaZaloga[] {
  const vrstice: NizkaZaloga[] = [];
  for (const izdelek of izdelki) {
    if (!izdelek.objavljen || izdelek.nacinProdaje === "samo-prikaz") continue;
    for (const v of izdelek.velikosti ?? []) {
      const zaloga = v.zaloga ?? 0;
      if (zaloga > meja) continue;
      vrstice.push({ vrsta: "izdelek", id: izdelek.id, ime: izdelek.ime, velikost: v.oznaka || null, zaloga });
    }
  }
  for (const skatla of skatle) {
    if (!skatla.aktiven) continue;
    const zaloga = skatla.zaloga ?? 0;
    if (zaloga <= meja) vrstice.push({ vrsta: "skatla", id: skatla.id, ime: skatla.ime, velikost: null, zaloga });
  }
  return vrstice.sort((a, b) => a.zaloga - b.zaloga || a.ime.localeCompare(b.ime, "sl"));
}

/** Ura v Sloveniji (strežnik na Railwayu teče v UTC). */
export function uraVSloveniji(zdaj: Date): number {
  const ura = new Intl.DateTimeFormat("sl-SI", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: "Europe/Ljubljana",
  }).format(zdaj);
  return Number.parseInt(ura, 10);
}

/** „Dobro jutro, Sandi“ / „Dober dan, Sandi“ / „Dober večer, Sandi“. */
export function pozdrav(ime: string | null | undefined, ura: number): string {
  const del = ura >= 4 && ura < 10 ? "Dobro jutro" : ura >= 10 && ura < 18 ? "Dober dan" : "Dober večer";
  const krstno = (ime ?? "").trim().split(/\s+/)[0];
  return krstno ? `${del}, ${krstno}` : del;
}

/** 1 naročilo, 2 naročili, 3 naročila, 5 naročil (slovenska dvojina). */
export function steviloNarocil(n: number): string {
  const ostanek = Math.abs(n) % 100;
  const beseda =
    ostanek === 1 ? "naročilo" : ostanek === 2 ? "naročili" : ostanek === 3 || ostanek === 4 ? "naročila" : "naročil";
  return `${n} ${beseda}`;
}
