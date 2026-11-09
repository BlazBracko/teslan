import type { IzdelekPogled, SlikaPogled } from "@/katalog/pogled";
import { razpolozljivostVelikosti } from "@/katalog/razpolozljivost";
import type { Mesec } from "@/katalog/sezona";
import { kljucVsebine, NAJVEC_MEST, primerenZaDarilo, zasedenaMesta, type KosVsebine } from "./pravila";

/**
 * Logika konfiguratorja darilne škatle (T5, Z53, P7, P8): kateri izdelki
 * so na izbiro, koliko kosov gre še v škatlo in kako se pripravljen
 * program (ali škatla iz košarice) prilagodi trenutni ponudbi. Čiste
 * funkcije, ki jih uporabljata stran (strežnik) in konfigurator (brskalnik).
 */

export interface VelikostZaSkatlo {
  id: string;
  oznaka: string;
  cenaCenti: number | null;
  zaloga: number;
  /** V sezoni, na zalogi in s ceno. */
  narocljiva: boolean;
  /** Oznaka razpoložljivosti (Z13), npr. „Na zalogi“, „Ni na zalogi“. */
  oznakaRazpolozljivosti: string;
}

export interface IzdelekZaSkatlo {
  id: number;
  ime: string;
  slug: string;
  kategorija: string;
  slika: SlikaPogled | null;
  velikosti: VelikostZaSkatlo[];
}

/**
 * Izdelki, ki so na izbiro v konfiguratorju: samo primerni za darilo (Z52,
 * P6). Neprimerni (npr. jajca) se sploh ne pokažejo; velikosti izven
 * sezone ali brez zaloge so vidne, a jih ni mogoče dodati (Z53).
 */
export function izdelkiZaSkatlo(izdelki: readonly IzdelekPogled[], mesec: Mesec): IzdelekZaSkatlo[] {
  return izdelki.filter(primerenZaDarilo).map((i) => ({
    id: i.id,
    ime: i.ime,
    slug: i.slug,
    kategorija: i.kategorija.ime,
    slika: i.slike[0] ?? null,
    velikosti: i.velikosti.map((v) => {
      const r = razpolozljivostVelikosti(i, v, mesec);
      return {
        id: v.id,
        oznaka: v.oznaka,
        cenaCenti: v.cenaCenti,
        zaloga: v.zaloga ?? 0,
        narocljiva: r.narocljiva && v.cenaCenti != null,
        oznakaRazpolozljivosti: r.oznaka,
      };
    }),
  }));
}

export interface KosVsebineZaPrikaz extends KosVsebine {
  ime: string;
  velikost: string;
  cenaCenti: number;
  /** Največ kosov te velikosti (zaloga). */
  zaloga: number;
}

/** Velikost iz seznama izdelkov konfiguratorja. */
export function najdiVelikost(
  izdelki: readonly IzdelekZaSkatlo[],
  izdelekId: number,
  velikostId: string,
): { izdelek: IzdelekZaSkatlo; velikost: VelikostZaSkatlo } | null {
  const izdelek = izdelki.find((i) => i.id === izdelekId);
  const velikost = izdelek?.velikosti.find((v) => v.id === velikostId);
  return izdelek && velikost ? { izdelek, velikost } : null;
}

/**
 * Prilagodi vsebino programa ali škatle iz košarice trenutni ponudbi (Z53):
 * izdelki, ki niso več primerni, niso v sezoni ali jih ni na zalogi, se
 * odstranijo; količina se zmanjša na zalogo; presežek mest se odreže.
 * Vrne vsebino in imena odstranjenih ali zmanjšanih izdelkov za obvestilo.
 */
export function prilagodiVsebino(
  vsebina: ReadonlyArray<{ izdelekId: number | null; velikostId: string | null; kolicina: number }>,
  izdelki: readonly IzdelekZaSkatlo[],
  steviloMest: number = NAJVEC_MEST,
): { vsebina: KosVsebine[]; spremenjeni: string[] } {
  const izid: KosVsebine[] = [];
  const spremenjeni: string[] = [];
  for (const v of vsebina) {
    const izdelek = v.izdelekId != null ? izdelki.find((i) => i.id === v.izdelekId) : undefined;
    const velikost = izdelek && (v.velikostId ? izdelek.velikosti.find((x) => x.id === v.velikostId) : izdelek.velikosti[0]);
    if (!izdelek || !velikost || !velikost.narocljiva) {
      if (izdelek) spremenjeni.push(izdelek.ime);
      else spremenjeni.push("izdelek, ki ga ni več v ponudbi");
      continue;
    }
    const zeVSkatli = izid.find((x) => kljucVsebine(x) === kljucVsebine({ izdelekId: izdelek.id, velikostId: velikost.id }));
    const prostih = steviloMest - zasedenaMesta(izid);
    const zeKosov = zeVSkatli?.kolicina ?? 0;
    const kolicina = Math.min(v.kolicina, prostih, velikost.zaloga - zeKosov);
    if (kolicina < v.kolicina) spremenjeni.push(izdelek.ime);
    if (kolicina < 1) continue;
    if (zeVSkatli) zeVSkatli.kolicina += kolicina;
    else izid.push({ izdelekId: izdelek.id, velikostId: velikost.id, kolicina });
  }
  return { vsebina: izid, spremenjeni: [...new Set(spremenjeni)] };
}

/** Prosta mesta v škatli. */
export const prostaMesta = (vsebina: readonly KosVsebine[], steviloMest: number) =>
  Math.max(0, steviloMest - zasedenaMesta(vsebina));

/**
 * Največja količina kosa v škatli: kolikor dopuščajo prosta mesta in
 * zaloga velikosti (P7).
 */
export function najvecKosa(vsebina: readonly KosVsebine[], kos: KosVsebine, steviloMest: number, zaloga: number): number {
  return Math.max(0, Math.min(kos.kolicina + prostaMesta(vsebina, steviloMest), zaloga));
}

/**
 * Doda en kos velikosti v škatlo. Če ni prostega mesta ali zaloge, vrne
 * nespremenjeno vsebino (konfigurator ne dovoli več kosov kot mest, S12).
 */
export function dodajKos(
  vsebina: readonly KosVsebine[],
  kos: Pick<KosVsebine, "izdelekId" | "velikostId">,
  steviloMest: number,
  zaloga: number,
): KosVsebine[] {
  const obstojeci = vsebina.find((v) => kljucVsebine(v) === kljucVsebine(kos));
  if (prostaMesta(vsebina, steviloMest) < 1 || (obstojeci?.kolicina ?? 0) >= zaloga) return [...vsebina];
  if (obstojeci) return vsebina.map((v) => (v === obstojeci ? { ...v, kolicina: v.kolicina + 1 } : v));
  return [...vsebina, { izdelekId: kos.izdelekId, velikostId: kos.velikostId, kolicina: 1 }];
}

/** Nastavi količino kosa (omejeno na mesta in zalogo); 0 ga odstrani. */
export function nastaviKolicinoKosa(
  vsebina: readonly KosVsebine[],
  kljuc: string,
  kolicina: number,
  steviloMest: number,
  zaloga: number,
): KosVsebine[] {
  return vsebina.flatMap((v) => {
    if (kljucVsebine(v) !== kljuc) return [v];
    const n = Math.min(Math.floor(kolicina), najvecKosa(vsebina, v, steviloMest, zaloga));
    return n >= 1 ? [{ ...v, kolicina: n }] : [];
  });
}

/** Vsebina s podatki za prikaz; kosi, ki jih v ponudbi ni več, se izpustijo. */
export function vsebinaZaPrikaz(vsebina: readonly KosVsebine[], izdelki: readonly IzdelekZaSkatlo[]): KosVsebineZaPrikaz[] {
  return vsebina.flatMap((v) => {
    const najdeno = najdiVelikost(izdelki, v.izdelekId, v.velikostId);
    if (!najdeno || najdeno.velikost.cenaCenti == null) return [];
    return [
      {
        ...v,
        ime: najdeno.izdelek.ime,
        velikost: najdeno.velikost.oznaka,
        cenaCenti: najdeno.velikost.cenaCenti,
        zaloga: najdeno.velikost.zaloga,
      },
    ];
  });
}

/** Cena škatle z vsebino (P8). */
export function cenaSkatle(cenaTipaCenti: number, vsebina: readonly Pick<KosVsebineZaPrikaz, "cenaCenti" | "kolicina">[]) {
  return cenaTipaCenti + vsebina.reduce((s, v) => s + v.cenaCenti * v.kolicina, 0);
}
