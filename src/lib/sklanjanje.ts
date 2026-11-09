/**
 * Slovenska števila: ednina, dvojina, množina za 3 in 4 ter množina od 5
 * naprej. Odloča zadnji dve števki (101 kos, 102 kosa, 105 kosov).
 *
 *   stevilo(2, ["izdelek", "izdelka", "izdelki", "izdelkov"]) → „2 izdelka“
 */
export type OblikeSamostalnika = readonly [ednina: string, dvojina: string, mnozina34: string, mnozina: string];

export function oblikaZaStevilo(n: number, oblike: OblikeSamostalnika): string {
  const ostanek = Math.abs(n) % 100;
  if (ostanek === 1) return oblike[0];
  if (ostanek === 2) return oblike[1];
  if (ostanek === 3 || ostanek === 4) return oblike[2];
  return oblike[3];
}

export function stevilo(n: number, oblike: OblikeSamostalnika): string {
  return `${n} ${oblikaZaStevilo(n, oblike)}`;
}

export const IZDELEK: OblikeSamostalnika = ["izdelek", "izdelka", "izdelki", "izdelkov"];
export const KOS: OblikeSamostalnika = ["kos", "kosa", "kosi", "kosov"];
