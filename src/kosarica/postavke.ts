import { z } from "zod/mini";
import { NAJDALJSE_SPOROCILO, NAJVEC_MEST, zdruziVsebino } from "@/darila/pravila";

/**
 * Vsebina košarice, kot jo hrani brskalnik (Z20): samo id-ji, velikosti,
 * količine, vsebina darilnih škatel in sporočilo. Cen, imen in zaloge
 * košarica ne hrani; te vedno izračuna strežnik iz baze (`preverjanje.ts`).
 *
 * Postavka je izdelek (velikost in količina) ali darilna škatla (K10):
 * tip škatle, vsebina (velikosti izdelkov s količinami), sporočilo na
 * kartici in število enakih škatel. Škatla ima svoj naključni id, da jo
 * konfigurator lahko uredi (T5 korak 4).
 *
 * Vse funkcije so čiste in vračajo novo košarico, zato jih uporabljata
 * brskalnik (`shramba.ts`) in strežnik (preverjanje vnosa). Sheme so v
 * `zod/mini`, ker modul teče v glavi vsake strani (ikona košarice) in je
 * polni zod zanj predolg (S18).
 */

/** Največja količina ene velikosti (ali enakih škatel) v eni postavki (Z15). */
export const NAJVEC_KOSOV = 20;

/** Varovalka pred zlorabo: več različnih postavk strežnik ne preveri. */
export const NAJVEC_POSTAVK = 50;

const celoStevilo = (od: number, do_: number) => z.number().check(z.int(), z.gte(od), z.lte(do_));
const id = () => z.number().check(z.int(), z.positive());
const niz = (od: number, do_: number) => z.string().check(z.minLength(od), z.maxLength(do_));

export const postavkaIzdelkaShema = z.object({
  vrsta: z.optional(z.literal("izdelek")),
  izdelekId: id(),
  velikostId: niz(1, 64),
  kolicina: celoStevilo(1, NAJVEC_KOSOV),
});

export const kosVsebineShema = z.object({
  izdelekId: id(),
  velikostId: niz(1, 64),
  kolicina: celoStevilo(1, NAJVEC_MEST),
});

export const postavkaSkatleShema = z.object({
  vrsta: z.literal("skatla"),
  id: z.string().check(z.regex(/^[\w-]{1,64}$/)),
  tipSkatleId: id(),
  /** Slug programa, iz katerega je škatla nastala (za ime v košarici). */
  program: z.optional(z.string().check(z.maxLength(100))),
  vsebina: z.array(kosVsebineShema).check(z.minLength(1), z.maxLength(NAJVEC_MEST)),
  sporocilo: z.optional(z.string().check(z.maxLength(NAJDALJSE_SPOROCILO))),
  kolicina: celoStevilo(1, NAJVEC_KOSOV),
});

export type PostavkaIzdelka = z.infer<typeof postavkaIzdelkaShema>;
export type PostavkaSkatle = z.infer<typeof postavkaSkatleShema>;
export type KosVsebine = z.infer<typeof kosVsebineShema>;
export type PostavkaKosarice = PostavkaIzdelka | PostavkaSkatle;

export const jeSkatla = (p: PostavkaKosarice): p is PostavkaSkatle => p.vrsta === "skatla";

/**
 * Ključ postavke: ista velikost istega izdelka je v košarici le enkrat;
 * vsaka škatla ima svoj id.
 */
export function kljucPostavke(p: PostavkaKosarice): string {
  return jeSkatla(p) ? `skatla:${p.id}` : `${p.izdelekId}:${p.velikostId}`;
}

const omejiKolicino = (kolicina: number, najvec = NAJVEC_KOSOV) =>
  Math.max(1, Math.min(Math.floor(kolicina), najvec, NAJVEC_KOSOV));

/**
 * Doda velikost v košarico. Če je že v njej, se količini seštejeta, a ne
 * presežeta `najvec` (zaloga, kot jo pozna stran izdelka) in 20 kosov.
 * Vrne novo košarico in koliko kosov je bilo dejansko dodanih.
 */
export function dodajPostavko(
  kosarica: readonly PostavkaKosarice[],
  nova: PostavkaIzdelka,
  najvec = NAJVEC_KOSOV,
): { kosarica: PostavkaKosarice[]; dodano: number } {
  const kljuc = kljucPostavke(nova);
  const obstojeca = kosarica.find((p) => kljucPostavke(p) === kljuc);
  if (!obstojeca) {
    if (kosarica.length >= NAJVEC_POSTAVK) return { kosarica: [...kosarica], dodano: 0 };
    const kolicina = omejiKolicino(nova.kolicina, najvec);
    return {
      kosarica: [...kosarica, { izdelekId: nova.izdelekId, velikostId: nova.velikostId, kolicina }],
      dodano: kolicina,
    };
  }
  const kolicina = Math.max(obstojeca.kolicina, omejiKolicino(obstojeca.kolicina + nova.kolicina, najvec));
  return {
    kosarica: kosarica.map((p) => (kljucPostavke(p) === kljuc ? { ...p, kolicina } : p)),
    dodano: kolicina - obstojeca.kolicina,
  };
}

/** Škatla z združeno vsebino in očiščenim sporočilom. */
function urediSkatlo(skatla: PostavkaSkatle): PostavkaSkatle | null {
  const vsebina = zdruziVsebino(skatla.vsebina);
  if (vsebina.length === 0) return null;
  const sporocilo = skatla.sporocilo?.trim();
  return {
    vrsta: "skatla",
    id: skatla.id,
    tipSkatleId: skatla.tipSkatleId,
    ...(skatla.program ? { program: skatla.program } : {}),
    vsebina: vsebina.map((v) => ({ izdelekId: v.izdelekId, velikostId: v.velikostId, kolicina: v.kolicina })),
    ...(sporocilo ? { sporocilo } : {}),
    kolicina: omejiKolicino(skatla.kolicina),
  };
}

/**
 * Doda škatlo ali, če škatla s tem id-jem že obstaja, jo zamenja (urejanje
 * v konfiguratorju). Vrne `null`, če košarica nima več prostora.
 */
export function shraniSkatlo(kosarica: readonly PostavkaKosarice[], skatla: PostavkaSkatle): PostavkaKosarice[] | null {
  const urejena = urediSkatlo(skatla);
  if (!urejena) return null;
  const kljuc = kljucPostavke(urejena);
  if (kosarica.some((p) => kljucPostavke(p) === kljuc)) {
    return kosarica.map((p) => (kljucPostavke(p) === kljuc ? urejena : p));
  }
  if (kosarica.length >= NAJVEC_POSTAVK) return null;
  return [...kosarica, urejena];
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

/** Skupno število kosov (številka ob ikoni košarice, Z7); škatla šteje kot en kos. */
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
    const skatla = postavkaSkatleShema.safeParse(element);
    if (skatla.success) {
      if (kosarica.some((p) => jeSkatla(p) && p.id === skatla.data.id)) continue;
      kosarica = shraniSkatlo(kosarica, skatla.data) ?? kosarica;
      continue;
    }
    const p = postavkaIzdelkaShema.safeParse(element);
    if (p.success) kosarica = dodajPostavko(kosarica, p.data).kosarica;
  }
  return kosarica;
}

/** Nov id škatle (v brskalniku). */
export function novIdSkatle(): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c && typeof c.randomUUID === "function") return c.randomUUID();
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Oblika v localStorage; verzija 2 doda škatle (verzija 1 se prebere enako). */
export const KLJUC_SHRAMBE = "teslan-kosarica";
const VERZIJA = 2;

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
