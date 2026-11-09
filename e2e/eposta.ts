import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ZapisEposte } from "../src/eposta/dnevnik";

/**
 * Dnevnik e-pošte za e2e (Z58): strežnik brez Resenda vsako sporočilo
 * doda v to datoteko kot vrstico JSON (`EPOSTA_DNEVNIK`).
 */
export const DNEVNIK_EPOSTE = path.resolve(".e2e/eposta.jsonl");

export function prebranaEposta(): ZapisEposte[] {
  if (!existsSync(DNEVNIK_EPOSTE)) return [];
  return readFileSync(DNEVNIK_EPOSTE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((vrstica) => JSON.parse(vrstica) as ZapisEposte);
}
