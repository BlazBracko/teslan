/**
 * Cenovni modul (Z22–Z24): čiste funkcije brez baze in brez ure, da jih
 * enako uporabljajo košarica, blagajna in naročilo. Denar je vedno v celih
 * centih, vse cene so z DDV (bruto).
 */

export type NacinDostave = "prevzem" | "posta";
export type NacinPlacila = "kartica" | "ob-prevzemu";

/** Stopnja DDV za poštnino (P5). */
export const STOPNJA_DDV_POSTNINE = 22;

export interface NastavitvePostnine {
  /** Poštnina pri pošiljanju (privzeto 500 c). */
  postninaCenti: number;
  /** Od tega vmesnega seštevka naprej je poštnina 0 (privzeto 5000 c). */
  pragBrezplacnePostnineCenti: number;
}

/**
 * Poštnina (Z23): pri prevzemu 0; pri pošti `postnina` iz nastavitev, razen
 * če vmesni seštevek doseže prag brezplačne poštnine.
 */
export function izracunajPostnino(
  nacinDostave: NacinDostave,
  vmesniSestevekCenti: number,
  nastavitve: NastavitvePostnine,
): number {
  if (nacinDostave === "prevzem") return 0;
  return vmesniSestevekCenti >= nastavitve.pragBrezplacnePostnineCenti ? 0 : nastavitve.postninaCenti;
}

/** Koliko še manjka do brezplačne poštnine (0, ko je prag dosežen). */
export function doBrezplacnePostnine(vmesniSestevekCenti: number, nastavitve: NastavitvePostnine): number {
  return Math.max(0, nastavitve.pragBrezplacnePostnineCenti - vmesniSestevekCenti);
}

export interface BrutoZnesek {
  /** Bruto znesek (z DDV) v centih. */
  brutoCenti: number;
  /** Stopnja DDV v odstotkih (9.5, 22). */
  stopnja: number;
}

export interface DDVPoStopnji {
  stopnja: number;
  osnovaCenti: number;
  ddvCenti: number;
}

/**
 * DDV, vključen v bruto znesek: `bruto − round(bruto / (1 + stopnja))`
 * (Z24). Računa se v celih številih (stopnja v desetinkah odstotka), da
 * 9,5 % ne prinese napake plavajoče vejice.
 */
export function vkljuceniDDV(brutoCenti: number, stopnja: number): number {
  const desetinke = Math.round(stopnja * 10);
  return brutoCenti - Math.round((brutoCenti * 1000) / (1000 + desetinke));
}

/**
 * Razčlenitev DDV po stopnjah (Z24, S3): zneski iste stopnje se najprej
 * seštejejo, DDV se izračuna na vsoto. Vsota osnov in DDV je zato vedno
 * enaka skupnemu bruto znesku na cent. Stopnje so urejene naraščajoče,
 * stopnje z ničelnim zneskom se izpustijo.
 */
export function razclenitevDDV(zneski: readonly BrutoZnesek[]): DDVPoStopnji[] {
  const poStopnjah = new Map<number, number>();
  for (const z of zneski) {
    poStopnjah.set(z.stopnja, (poStopnjah.get(z.stopnja) ?? 0) + z.brutoCenti);
  }
  return [...poStopnjah.entries()]
    .filter(([, bruto]) => bruto !== 0)
    .sort(([a], [b]) => a - b)
    .map(([stopnja, bruto]) => {
      const ddvCenti = vkljuceniDDV(bruto, stopnja);
      return { stopnja, osnovaCenti: bruto - ddvCenti, ddvCenti };
    });
}

export interface PostavkaZaZnesek {
  cenaCenti: number;
  kolicina: number;
  stopnjaDDV: number;
}

export interface Znesek {
  vmesniSestevekCenti: number;
  postninaCenti: number;
  skupajCenti: number;
  ddv: DDVPoStopnji[];
}

/**
 * Celoten znesek naročila: vmesni seštevek postavk, poštnina po načinu
 * dostave (Z23) in DDV po stopnjah, vključno s poštnino po 22 % (P5).
 */
export function izracunajZnesek(
  postavke: readonly PostavkaZaZnesek[],
  nacinDostave: NacinDostave,
  nastavitve: NastavitvePostnine,
): Znesek {
  const zneski: BrutoZnesek[] = postavke.map((p) => ({
    brutoCenti: p.cenaCenti * p.kolicina,
    stopnja: p.stopnjaDDV,
  }));
  const vmesniSestevekCenti = zneski.reduce((vsota, z) => vsota + z.brutoCenti, 0);
  const postninaCenti = izracunajPostnino(nacinDostave, vmesniSestevekCenti, nastavitve);
  return {
    vmesniSestevekCenti,
    postninaCenti,
    skupajCenti: vmesniSestevekCenti + postninaCenti,
    ddv: razclenitevDDV([...zneski, { brutoCenti: postninaCenti, stopnja: STOPNJA_DDV_POSTNINE }]),
  };
}

/** „9,5 %“, „22 %“. */
export function oznakaStopnje(stopnja: number): string {
  return `${stopnja.toLocaleString("sl-SI")} %`;
}
