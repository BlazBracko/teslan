import { randomBytes, timingSafeEqual } from "node:crypto";
import { CASOVNI_PAS } from "@/katalog/sezona";

/**
 * Številka naročila `T-<leto>-<zaporedna>` (Z31): zaporedje teče po letu
 * (v Ljubljani), zaporedna številka ima vsaj 4 mesta (`T-2026-0001`).
 */

const oblikaLeta = new Intl.DateTimeFormat("en-US", { timeZone: CASOVNI_PAS, year: "numeric" });

export function letoVLjubljani(zdaj: Date = new Date()): number {
  return Number(oblikaLeta.format(zdaj));
}

export const predponaLeta = (leto: number) => `T-${leto}-`;

export function oblikujStevilko(leto: number, zaporedna: number): string {
  if (!Number.isInteger(zaporedna) || zaporedna < 1) throw new Error(`Neveljavna zaporedna številka: ${zaporedna}`);
  return `${predponaLeta(leto)}${String(zaporedna).padStart(4, "0")}`;
}

export const OBLIKA_STEVILKE = /^T-\d{4}-\d{4,}$/;

/**
 * Naključni žeton za ogled naročila brez prijave (Z32): 32 bajtov v
 * base64url, torej 43 znakov.
 */
export function ustvariZeton(): string {
  return randomBytes(32).toString("base64url");
}

/** Primerjava žetonov v stalnem času (ne izda, koliko znakov se ujema). */
export function zetonaSeUjemata(pricakovan: string | null | undefined, podan: string | null | undefined): boolean {
  if (!pricakovan || !podan) return false;
  const a = Buffer.from(pricakovan);
  const b = Buffer.from(podan);
  return a.length === b.length && timingSafeEqual(a, b);
}
