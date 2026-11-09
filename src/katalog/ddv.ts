/**
 * Stopnje DDV (P5): živila 9,5 %, darilna škatla in poštnina 22 %. V Payloadu
 * je stopnja shranjena kot niz ("9.5", "22"), ker so izbirna polja nizi.
 */
export const STOPNJE_DDV = [
  { vrednost: "9.5", oznaka: "9,5 % (živila)", odstotek: 9.5 },
  { vrednost: "22", oznaka: "22 %", odstotek: 22 },
] as const;

export type VrednostStopnjeDDV = (typeof STOPNJE_DDV)[number]["vrednost"];

/** "9.5" → 9.5; neznana vrednost vrže napako, da se napačen DDV ne izračuna tiho. */
export function odstotekDDV(vrednost: string): number {
  const stopnja = STOPNJE_DDV.find((s) => s.vrednost === vrednost);
  if (!stopnja) throw new Error(`Neznana stopnja DDV: ${vrednost}`);
  return stopnja.odstotek;
}
