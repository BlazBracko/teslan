/**
 * Zaščita staginga (Z71, Z74): HTTP Basic Auth in `X-Robots-Tag`. Čiste
 * funkcije za `src/proxy.ts`; berejo surovo okolje in nikoli ne vržejo
 * napake, da napačna nastavitev ne ustavi strežnika.
 *
 * Varovalo pred nedosegljivim stagingom: geslo se zahteva samo, ko sta
 * nastavljena **oba** `BASIC_AUTH_USER` in `BASIC_AUTH_PASSWORD`. Brez njiju
 * (ali s samo enim) je stran odprta, kot pred K12, strežnik pa ob zagonu
 * izpiše opozorilo (`opozorilaZascite`). `NOINDEX=1` iskalnike odvrne v
 * vsakem primeru.
 */

/** Pot, ki jo Stripe kliče brez gesla (Z74); vse druge so zaščitene. */
export const POT_WEBHOOKA_STRIPE = "/api/stripe/webhook";

export const REALM = "Domacija Teslan (staging)";

type Okolje = Record<string, string | undefined>;

const vrednost = (v: string | undefined) => (v && v.trim() !== "" ? v : undefined);

export interface NastavitveZascite {
  noindex: boolean;
  /** Pričakovano uporabniško ime in geslo ali `null` (zaščita izklopljena). */
  geslo: { uporabnik: string; geslo: string } | null;
}

export function nastavitveZascite(env: Okolje): NastavitveZascite {
  const uporabnik = vrednost(env.BASIC_AUTH_USER);
  const geslo = vrednost(env.BASIC_AUTH_PASSWORD);
  return {
    noindex: env.NOINDEX === "1",
    geslo: uporabnik && geslo ? { uporabnik, geslo } : null,
  };
}

/** Opozorila ob zagonu (brez vrednosti spremenljivk). */
export function opozorilaZascite(env: Okolje): string[] {
  const uporabnik = vrednost(env.BASIC_AUTH_USER);
  const geslo = vrednost(env.BASIC_AUTH_PASSWORD);
  const opozorila: string[] = [];
  if (Boolean(uporabnik) !== Boolean(geslo)) {
    opozorila.push(
      `Zaščita: nastavljen je samo ${uporabnik ? "BASIC_AUTH_USER" : "BASIC_AUTH_PASSWORD"}, zato je geslo izklopljeno. Nastavite oba.`,
    );
  } else if (!uporabnik && env.NOINDEX === "1" && env.NODE_ENV === "production") {
    opozorila.push(
      "Zaščita: staging (NOINDEX=1) je brez gesla dostopen vsem. Za geslo nastavite BASIC_AUTH_USER in BASIC_AUTH_PASSWORD.",
    );
  }
  if (uporabnik && geslo && env.NOINDEX !== "1" && env.NODE_ENV === "production") {
    opozorila.push("Zaščita: geslo je vklopljeno brez NOINDEX=1. V produkciji ne nastavljajte BASIC_AUTH_*.");
  }
  return opozorila;
}

/** Iz glave `Authorization: Basic …` vrne uporabnika in geslo (UTF-8) ali `null`. */
export function preberiOsnovnoAvtentikacijo(glava: string | null): { uporabnik: string; geslo: string } | null {
  const ujemanje = glava ? /^Basic\s+([A-Za-z0-9+/=]+)\s*$/i.exec(glava) : null;
  if (!ujemanje) return null;
  let besedilo: string;
  try {
    const bajti = Uint8Array.from(atob(ujemanje[1]), (z) => z.charCodeAt(0));
    besedilo = new TextDecoder("utf-8", { fatal: true }).decode(bajti);
  } catch {
    return null;
  }
  const dvopicje = besedilo.indexOf(":");
  if (dvopicje < 0) return null;
  return { uporabnik: besedilo.slice(0, dvopicje), geslo: besedilo.slice(dvopicje + 1) };
}

const kodirnik = new TextEncoder();

/**
 * Primerjava v konstantnem času: primerjamo SHA-256 obeh nizov, zato čas ne
 * izda niti dolžine niti skupne predpone pravega gesla.
 */
async function enaka(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", kodirnik.encode(a)),
    crypto.subtle.digest("SHA-256", kodirnik.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let razlika = 0;
  for (let i = 0; i < x.length; i++) razlika |= x[i] ^ y[i];
  return razlika === 0;
}

/** Ali zahteva sme naprej (zaščita izklopljena, izvzeta pot ali pravilno geslo). */
export async function dovoljeno(
  pot: string,
  glavaAvtentikacije: string | null,
  nastavitve: NastavitveZascite,
): Promise<boolean> {
  if (!nastavitve.geslo || pot === POT_WEBHOOKA_STRIPE) return true;
  const podano = preberiOsnovnoAvtentikacijo(glavaAvtentikacije);
  if (!podano) return false;
  const [uporabnik, geslo] = await Promise.all([
    enaka(podano.uporabnik, nastavitve.geslo.uporabnik),
    enaka(podano.geslo, nastavitve.geslo.geslo),
  ]);
  return uporabnik && geslo;
}
