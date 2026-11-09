"use client";

import { useSyncExternalStore } from "react";
import {
  dodajPostavko,
  KLJUC_SHRAMBE,
  nastaviKolicino,
  odstraniPostavko,
  preberiIzShrambe,
  steviloKosovVKosarici,
  zapisiZaShrambo,
  type PostavkaKosarice,
} from "./postavke";

/**
 * Košarica v brskalniku (Z20): `localStorage`, ki ga berejo vse komponente
 * prek `useSyncExternalStore`. Sprememba v enem zavihku se takoj pokaže
 * tudi v drugih (dogodek `storage`), ikona v glavi se posodobi takoj (Z7).
 *
 * Če shramba ni na voljo (zasebni način, polna kvota), košarica živi v
 * pomnilniku do osvežitve strani.
 */

const poslusalci = new Set<() => void>();
let vPomnilniku: string | null = null;
let predpomnilnik: { niz: string | null; kosarica: PostavkaKosarice[] } = { niz: null, kosarica: [] };

function beri(): string | null {
  try {
    return window.localStorage.getItem(KLJUC_SHRAMBE);
  } catch {
    return vPomnilniku;
  }
}

function pisi(niz: string) {
  vPomnilniku = niz;
  try {
    window.localStorage.setItem(KLJUC_SHRAMBE, niz);
  } catch {
    // Ostane v pomnilniku.
  }
}

function obvesti() {
  for (const p of poslusalci) p();
}

function posnetek(): PostavkaKosarice[] {
  const niz = beri();
  // Isti niz → isti objekt, sicer bi useSyncExternalStore risal v neskončnost.
  if (niz !== predpomnilnik.niz) predpomnilnik = { niz, kosarica: preberiIzShrambe(niz) };
  return predpomnilnik.kosarica;
}

function narocnina(poslusalec: () => void) {
  poslusalci.add(poslusalec);
  const obShrambi = (e: StorageEvent) => {
    if (e.key === KLJUC_SHRAMBE || e.key === null) poslusalec();
  };
  window.addEventListener("storage", obShrambi);
  return () => {
    poslusalci.delete(poslusalec);
    window.removeEventListener("storage", obShrambi);
  };
}

function spremeni(sprememba: (k: PostavkaKosarice[]) => PostavkaKosarice[]) {
  pisi(zapisiZaShrambo(sprememba(posnetek())));
  obvesti();
}

/** Vsebina košarice; `null` med strežniškim izrisom in hidracijo. */
export function useKosarica(): PostavkaKosarice[] | null {
  return useSyncExternalStore(narocnina, posnetek, () => null);
}

/** Število kosov za ikono v glavi; `null`, dokler ni znano. */
export function useSteviloKosov(): number | null {
  const kosarica = useKosarica();
  return kosarica === null ? null : steviloKosovVKosarici(kosarica);
}

/** Doda velikost v košarico; vrne, koliko kosov je bilo dejansko dodanih. */
export function dodajVKosarico(postavka: PostavkaKosarice, najvec?: number): number {
  const { kosarica, dodano } = dodajPostavko(posnetek(), postavka, najvec);
  if (dodano > 0) {
    pisi(zapisiZaShrambo(kosarica));
    obvesti();
  }
  return dodano;
}

/** Količina te velikosti, ki je že v košarici. */
export function kolicinaVKosarici(izdelekId: number, velikostId: string): number {
  return posnetek().find((p) => p.izdelekId === izdelekId && p.velikostId === velikostId)?.kolicina ?? 0;
}

export function nastaviKolicinoVKosarici(kljuc: string, kolicina: number) {
  spremeni((k) => nastaviKolicino(k, kljuc, kolicina));
}

export function odstraniIzKosarice(kljuc: string) {
  spremeni((k) => odstraniPostavko(k, kljuc));
}

export function izprazniKosarico() {
  spremeni(() => []);
}
