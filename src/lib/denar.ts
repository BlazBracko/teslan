/**
 * Denar je v celotni aplikaciji v celih centih (načrt §6). Ta modul je
 * edino mesto, kjer se centi pretvorijo v besedilo za prikaz.
 */

const oblikaEUR = new Intl.NumberFormat("sl-SI", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1250 → „12,50 €“ (z nedeljivim presledkom pred znakom €). */
export function formatirajCeno(centi: number): string {
  if (!Number.isInteger(centi)) {
    throw new TypeError(`Cena mora biti celo število centov, dobil sem ${centi}.`);
  }
  return oblikaEUR.format(centi / 100);
}
