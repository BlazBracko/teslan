/**
 * Sezone izdelkov (Z12). Mesec je 1–12 (1 = januar), sezona lahko prelije čez
 * novo leto (npr. november–februar). Vse se računa v časovnem pasu
 * `Europe/Ljubljana` (načrt §8), ne glede na pas strežnika.
 */

export type Mesec = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface Sezona {
  od: Mesec;
  do: Mesec;
}

export const CASOVNI_PAS = "Europe/Ljubljana";

export const MESECI = [
  "januar",
  "februar",
  "marec",
  "april",
  "maj",
  "junij",
  "julij",
  "avgust",
  "september",
  "oktober",
  "november",
  "december",
] as const;

export function jeMesec(n: unknown): n is Mesec {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 12;
}

/** 4 → „april“. */
export const imeMeseca = (mesec: Mesec): string => MESECI[mesec - 1];

const zVelikoZacetnico = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** `{4, 6}` → „April — junij“. */
export function oznakaSezone(sezona: Sezona): string {
  return `${zVelikoZacetnico(imeMeseca(sezona.od))} — ${imeMeseca(sezona.do)}`;
}

/** Ali je mesec v sezoni (upošteva sezone čez novo leto). */
export function vSezoni(sezona: Sezona, mesec: Mesec): boolean {
  return sezona.od <= sezona.do
    ? mesec >= sezona.od && mesec <= sezona.do
    : mesec >= sezona.od || mesec <= sezona.do;
}

const prejsnjiMesec = (m: Mesec): Mesec => (m === 1 ? 12 : ((m - 1) as Mesec));

/** Mesec pred začetkom sezone: izdelek dobi oznako „Kmalu“. */
export function jeKmalu(sezona: Sezona, mesec: Mesec): boolean {
  return !vSezoni(sezona, mesec) && mesec === prejsnjiMesec(sezona.od);
}

export type StanjeSezone = "v-sezoni" | "kmalu" | "izven-sezone";

/** Brez sezone je izdelek vse leto „v sezoni“. */
export function stanjeSezone(
  sezona: Sezona | null | undefined,
  mesec: Mesec,
): StanjeSezone {
  if (!sezona || vSezoni(sezona, mesec)) return "v-sezoni";
  return jeKmalu(sezona, mesec) ? "kmalu" : "izven-sezone";
}

const oblikaMeseca = new Intl.DateTimeFormat("en-US", {
  timeZone: CASOVNI_PAS,
  month: "numeric",
});

/** Trenutni mesec v Ljubljani (ob polnoči 1. v mesecu se ne zmoti zaradi UTC). */
export function trenutniMesec(zdaj: Date = new Date()): Mesec {
  const mesec = Number(oblikaMeseca.format(zdaj));
  if (!jeMesec(mesec)) throw new Error(`Neveljaven mesec: ${mesec}`);
  return mesec;
}

/**
 * Sezona iz polj izdelka v Payloadu (`sezona.od`, `sezona.do` kot niza
 * "1"–"12"). Vrne `null`, če sezona ni vpisana v celoti.
 */
export function sezonaIzPolj(
  polja: { od?: string | number | null; do?: string | number | null } | null | undefined,
): Sezona | null {
  const od = Number(polja?.od);
  const do_ = Number(polja?.do);
  if (!polja?.od || !polja?.do || !jeMesec(od) || !jeMesec(do_)) return null;
  return { od, do: do_ };
}
