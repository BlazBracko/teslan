import { jeMesec } from "./sezona";
import type { NacinProdaje } from "./razpolozljivost";

/**
 * Pravila za vnos izdelka v adminu (Z10–Z12, Z52). Vsaka funkcija vrne
 * `true` ali sporočilo napake v slovenščini, kot ga pričakuje Payloadov
 * `validate`.
 */
export type Rezultat = true | string;

const jeNarocljiv = (nacin: NacinProdaje | null | undefined) => nacin !== "samo-prikaz";

const prazno = (v: unknown) => v === null || v === undefined || v === "";

/** Z11: cena v centih je obvezna (≥ 1 cent) pri naročljivih izdelkih. */
export function preveriCeno(cena: unknown, nacin: NacinProdaje | null | undefined): Rezultat {
  if (prazno(cena)) {
    return jeNarocljiv(nacin)
      ? "Vpišite ceno v centih (npr. 550 za 5,50 €). Brez cene je mogoč le način „Samo prikaz“."
      : true;
  }
  if (typeof cena !== "number" || !Number.isInteger(cena)) {
    return "Cena mora biti celo število centov (npr. 550 za 5,50 €).";
  }
  if (cena < 0 || (jeNarocljiv(nacin) && cena < 1)) {
    return "Cena mora biti večja od 0.";
  }
  return true;
}

/** Z11: zaloga je obvezna (celo število ≥ 0) pri naročljivih izdelkih. */
export function preveriZalogo(zaloga: unknown, nacin: NacinProdaje | null | undefined): Rezultat {
  if (prazno(zaloga)) {
    return jeNarocljiv(nacin)
      ? "Vpišite zalogo (število kosov, 0 če ga ni). Brez zaloge je mogoč le način „Samo prikaz“."
      : true;
  }
  if (typeof zaloga !== "number" || !Number.isInteger(zaloga) || zaloga < 0) {
    return "Zaloga mora biti celo število, 0 ali več.";
  }
  return true;
}

/** Z52: za darilo je primeren le izdelek, ki se lahko pošlje po pošti. */
export function preveriPrimernoZaDarilo(
  primerno: unknown,
  nacin: NacinProdaje | null | undefined,
): Rezultat {
  if (primerno === true && nacin !== "posta-in-prevzem") {
    return "Za darilno škatlo je lahko primeren le izdelek z načinom prodaje „Pošta in prevzem na kmetiji“.";
  }
  return true;
}

/** Z12: sezona ima oba meseca ali nobenega. */
export function preveriSezono(od: unknown, do_: unknown): Rezultat {
  const imaOd = !prazno(od);
  const imaDo = !prazno(do_);
  if (imaOd !== imaDo) {
    return "Sezona potrebuje oba meseca (od in do) ali nobenega, če je izdelek na voljo vse leto.";
  }
  if (imaOd && (!jeMesec(Number(od)) || !jeMesec(Number(do_)))) {
    return "Izberite mesec od januarja do decembra.";
  }
  return true;
}
