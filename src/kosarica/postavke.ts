import { z } from "zod";

/**
 * Vsebina košarice, kot jo hrani brskalnik (Z20): samo id-ji, velikosti in
 * količine. Cen, imen in zaloge košarica ne hrani; te vedno izračuna
 * strežnik iz baze (`preverjanje.ts`). Darilne škatle (vsebina, sporočilo)
 * doda K10 kot novo vrsto postavke.
 *
 * Vse funkcije so čiste in vračajo novo košarico, zato jih uporabljata
 * brskalnik (`shramba.ts`) in strežnik (preverjanje vnosa).
 */

/** Največja količina ene velikosti v eni postavki (Z15). */
export const NAJVEC_KOSOV = 20;

/** Varovalka pred zlorabo: več različnih postavk strežnik ne preveri. */
export const NAJVEC_POSTAVK = 50;

export const postavkaShema = z.object({
  izdelekId: z.number().int().positive(),
  velikostId: z.string().min(1).max(64),
  kolicina: z.number().int().min(1).max(NAJVEC_KOSOV),
});

export type PostavkaKosarice = z.infer<typeof postavkaShema>;

export const kosaricaShema = z.array(postavkaShema).max(NAJVEC_POSTAVK);

/** Ključ postavke: ista velikost istega izdelka je v košarici le enkrat. */
export const kljucPostavke = (p: Pick<PostavkaKosarice, "izdelekId" | "velikostId">) =>
  `${p.izdelekId}:${p.velikostId}`;

const omejiKolicino = (kolicina: number, najvec = NAJVEC_KOSOV) =>
  Math.max(1, Math.min(Math.floor(kolicina), najvec, NAJVEC_KOSOV));

/**
 * Doda velikost v košarico. Če je že v njej, se količini seštejeta, a ne
 * presežeta `najvec` (zaloga, kot jo pozna stran izdelka) in 20 kosov.
 * Vrne novo košarico in koliko kosov je bilo dejansko dodanih.
 */
export function dodajPostavko(
  kosarica: readonly PostavkaKosarice[],
  nova: PostavkaKosarice,
  najvec = NAJVEC_KOSOV,
): { kosarica: PostavkaKosarice[]; dodano: number } {
  const kljuc = kljucPostavke(nova);
  const obstojeca = kosarica.find((p) => kljucPostavke(p) === kljuc);
  if (!obstojeca) {
    if (kosarica.length >= NAJVEC_POSTAVK) return { kosarica: [...kosarica], dodano: 0 };
    const kolicina = omejiKolicino(nova.kolicina, najvec);
    return { kosarica: [...kosarica, { ...nova, kolicina }], dodano: kolicina };
  }
  const kolicina = Math.max(obstojeca.kolicina, omejiKolicino(obstojeca.kolicina + nova.kolicina, najvec));
  return {
    kosarica: kosarica.map((p) => (kljucPostavke(p) === kljuc ? { ...p, kolicina } : p)),
    dodano: kolicina - obstojeca.kolicina,
  };
}

/** Nastavi količino postavke (1–20); neznan ključ ne spremeni ničesar. */
export function nastaviKolicino(
  kosarica: readonly PostavkaKosarice[],
  kljuc: string,
  kolicina: number,
): PostavkaKosarice[] {
  return kosarica.map((p) => (kljucPostavke(p) === kljuc ? { ...p, kolicina: omejiKolicino(kolicina) } : p));
}

export function odstraniPostavko(kosarica: readonly PostavkaKosarice[], kljuc: string): PostavkaKosarice[] {
  return kosarica.filter((p) => kljucPostavke(p) !== kljuc);
}

/** Skupno število kosov (številka ob ikoni košarice, Z7). */
export function steviloKosovVKosarici(kosarica: readonly PostavkaKosarice[]): number {
  return kosarica.reduce((vsota, p) => vsota + p.kolicina, 0);
}

/**
 * Košarica iz poljubnega vnosa (localStorage, zahteva strežniku). Neveljavne
 * postavke se tiho izpustijo, podvojene velikosti združijo, preveč postavk
 * odreže: pokvarjena shramba ne sme zrušiti strani.
 */
export function normalizirajKosarico(vnos: unknown): PostavkaKosarice[] {
  if (!Array.isArray(vnos)) return [];
  let kosarica: PostavkaKosarice[] = [];
  for (const element of vnos) {
    const p = postavkaShema.safeParse(element);
    if (p.success) kosarica = dodajPostavko(kosarica, p.data).kosarica;
  }
  return kosarica;
}

/** Oblika v localStorage; verzija omogoča kasnejše spremembe (K10: škatle). */
export const KLJUC_SHRAMBE = "teslan-kosarica";
const VERZIJA = 1;

export function preberiIzShrambe(niz: string | null): PostavkaKosarice[] {
  if (!niz) return [];
  try {
    const podatki: unknown = JSON.parse(niz);
    if (typeof podatki !== "object" || podatki === null || !("postavke" in podatki)) return [];
    return normalizirajKosarico(podatki.postavke);
  } catch {
    return [];
  }
}

export function zapisiZaShrambo(kosarica: readonly PostavkaKosarice[]): string {
  return JSON.stringify({ verzija: VERZIJA, postavke: kosarica });
}
