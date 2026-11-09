/**
 * Podatki prodajalca za pravne strani (Z61). Vir je global
 * `nastavitve-trgovine` → `prodajalec`, ki ga ureja administrator.
 *
 * Prazno obvezno polje ne izgine (kot v nogi), ampak se na pravni strani
 * pokaže kot `[manjka: …]` (načrt §7): pogoji brez davčne številke niso
 * popolni in lastnik mora to videti, preden gre trgovina v produkcijo.
 * Matična številka je izjema, ker je kmetija morda nima (»če obstaja«).
 */

export interface VhodProdajalca {
  naziv?: string | null;
  naslov?: string | null;
  davcnaStevilka?: string | null;
  maticnaStevilka?: string | null;
  kmgMid?: string | null;
  telefon?: string | null;
  email?: string | null;
}

/** Vrednost polja: vpisano besedilo ali oznaka, kaj manjka. */
export type Vrednost = { vpisano: true; besedilo: string } | { vpisano: false; manjka: string };

export interface PravniPodatkiProdajalca {
  naziv: Vrednost;
  naslov: Vrednost;
  davcnaStevilka: Vrednost;
  /** `null`, če ni vpisana (ni obvezna). */
  maticnaStevilka: string | null;
  kmgMid: Vrednost;
  telefon: Vrednost;
  email: Vrednost;
  /** Imena manjkajočih obveznih polj, v vrstnem redu prikaza. */
  manjka: string[];
}

/** Obvezna polja in imena, ki se pokažejo v `[manjka: …]`. */
const OBVEZNA = {
  naziv: "naziv prodajalca",
  naslov: "naslov",
  davcnaStevilka: "davčna številka",
  kmgMid: "KMG-MID",
  telefon: "telefon",
  email: "e-pošta",
} as const;

type ObveznoPolje = keyof typeof OBVEZNA;

const ocisti = (v: string | null | undefined) => v?.trim() || null;

function vrednost(v: string | null | undefined, ime: string): Vrednost {
  const s = ocisti(v);
  return s ? { vpisano: true, besedilo: s } : { vpisano: false, manjka: ime };
}

export function pravniPodatkiProdajalca(vhod: VhodProdajalca | null | undefined): PravniPodatkiProdajalca {
  const polja = Object.fromEntries(
    (Object.keys(OBVEZNA) as ObveznoPolje[]).map((k) => [k, vrednost(vhod?.[k], OBVEZNA[k])]),
  ) as Record<ObveznoPolje, Vrednost>;
  return {
    ...polja,
    maticnaStevilka: ocisti(vhod?.maticnaStevilka),
    manjka: (Object.keys(OBVEZNA) as ObveznoPolje[]).flatMap((k) => {
      const p = polja[k];
      return p.vpisano ? [] : [p.manjka];
    }),
  };
}

/** Besedilo za mesta brez oblikovanja (obrazec za odstop za kopiranje). */
export function kotBesedilo(v: Vrednost): string {
  return v.vpisano ? v.besedilo : `[manjka: ${v.manjka}]`;
}

/**
 * Vzorčni obrazec za odstop od pogodbe (ZVPot-1, priloga z vzorcem
 * obrazca), izpolnjen s podatki prodajalca. Kupec ga skopira v e-pošto.
 */
export function obrazecZaOdstop(p: PravniPodatkiProdajalca): string {
  const prejemnik = [kotBesedilo(p.naziv), kotBesedilo(p.naslov), `e-pošta: ${kotBesedilo(p.email)}`].join(", ");
  return [
    `Za: ${prejemnik}`,
    "",
    "Obveščam vas, da odstopam od pogodbe za nakup naslednjega blaga:",
    "…………………………………………",
    "",
    "Številka naročila: …………………",
    "Datum naročila: ………………… / datum prejema: …………………",
    "Ime in priimek: …………………………………………",
    "Naslov: …………………………………………",
    "Podpis (samo, če obrazec pošljete v papirni obliki): …………………",
    "Datum: …………………",
  ].join("\n");
}
