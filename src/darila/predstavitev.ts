import type { IzdelekPogled } from "@/katalog/pogled";
import type { Mesec } from "@/katalog/sezona";
import {
  cenaSkatle,
  izdelkiZaSkatlo,
  prilagodiVsebino,
  vsebinaZaPrikaz,
  type KosVsebineZaPrikaz,
} from "./konfigurator";
import type { Darila, ProgramPogled, TipSkatlePogled } from "./pogled";

/**
 * Darila za prikaz na domači strani in strani Darila: pripravljeni programi
 * s trenutno vsebino in ceno (izdelki izven sezone ali brez zaloge so
 * odstranjeni, enako kot v konfiguratorju, Z53) in praznično obdobje.
 */
export interface ProgramZaPrikaz extends ProgramPogled {
  tip: TipSkatlePogled;
  prikaz: KosVsebineZaPrikaz[];
  cena: number;
  /** Nekaj izdelkov iz programa ta čas ni na voljo. */
  nepopolno: boolean;
}

export function programiZaPrikaz(darila: Darila, izdelki: readonly IzdelekPogled[], mesec: Mesec): ProgramZaPrikaz[] {
  const zaSkatlo = izdelkiZaSkatlo(izdelki, mesec);
  const tipi = new Map(darila.tipi.map((t) => [t.id, t]));
  return darila.programi.flatMap((p) => {
    const tip = p.tipSkatleId != null ? tipi.get(p.tipSkatleId) : undefined;
    if (!tip) return [];
    const { vsebina, spremenjeni } = prilagodiVsebino(p.vsebina, zaSkatlo, tip.steviloMest);
    const prikaz = vsebinaZaPrikaz(vsebina, zaSkatlo);
    return [{ ...p, tip, prikaz, cena: cenaSkatle(tip.cenaCenti, prikaz), nepopolno: spremenjeni.length > 0 }];
  });
}

/**
 * Praznični čas (november in december): darila so predstavljena kot
 * božično-novoletna, z omembo poslovnih daril. Ostali meseci dobijo
 * splošno besedilo, da stran ne govori o praznikih poleti.
 */
export function prazniskiCas(datum: Date): boolean {
  const mesec = datum.getMonth() + 1;
  return mesec === 11 || mesec === 12;
}
