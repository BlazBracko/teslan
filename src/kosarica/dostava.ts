import type { NacinProdaje } from "@/katalog/razpolozljivost";
import type { NacinDostave, NacinPlacila } from "./cene";

/**
 * Pravila dostave in plačila (Z22, T4): pošta je dovoljena le, če je vsaka
 * postavka `posta-in-prevzem` (K10 doda darilne škatle, ki so vedno
 * primerne za pošto, P6). Pri pošti je plačilo samo s kartico, pri
 * prevzemu s kartico ali ob prevzemu.
 */

export interface PostavkaZaDostavo {
  ime: string;
  nacinProdaje: NacinProdaje;
}

export interface PravilaDostave {
  postaDovoljena: boolean;
  /** Imena izdelkov, zaradi katerih pošta ni mogoča (za razlago kupcu). */
  samoPrevzem: string[];
}

export function pravilaDostave(postavke: readonly PostavkaZaDostavo[]): PravilaDostave {
  const samoPrevzem = [...new Set(postavke.filter((p) => p.nacinProdaje !== "posta-in-prevzem").map((p) => p.ime))];
  return { postaDovoljena: samoPrevzem.length === 0, samoPrevzem };
}

export function dovoljeniNaciniDostave(pravila: PravilaDostave): NacinDostave[] {
  return pravila.postaDovoljena ? ["prevzem", "posta"] : ["prevzem"];
}

export function dovoljenaPlacila(nacinDostave: NacinDostave): NacinPlacila[] {
  return nacinDostave === "posta" ? ["kartica"] : ["kartica", "ob-prevzemu"];
}

/** „A“, „A in B“, „A, B in C“. */
export function nastevanje(imena: readonly string[]): string {
  if (imena.length <= 1) return imena[0] ?? "";
  return `${imena.slice(0, -1).join(", ")} in ${imena[imena.length - 1]}`;
}
