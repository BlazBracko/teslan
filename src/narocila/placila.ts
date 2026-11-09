import { okolje, type Env } from "../env";
import type { Narocila } from "../payload-types";
import { stripePonudnik } from "./stripe";

/**
 * Plačila s kartico (Z40–Z42). Koda naročil se pogovarja s ponudnikom
 * plačil prek tega vmesnika, ne neposredno s Stripom: v produkciji in na
 * stagingu je to Stripe Checkout (`./stripe.ts`), v integracijskih testih
 * nadomestek.
 *
 * Brez ključev Stripe ponudnika ni: blagajna kartico pokaže onemogočeno,
 * zato tudi pošte (samo kartica, Z22) ni mogoče oddati.
 */

/** Stanje seje plačila, kot ga potrebuje obdelava naročila. */
export interface StanjeSeje {
  id: string;
  /** `open`: kupec še lahko plača; `complete`: zaključena; `expired`: potekla ali preklicana. */
  status: "open" | "complete" | "expired";
  /** Denar je prejet (pri kartici takoj ob zaključku). */
  placano: boolean;
  paymentIntentId: string | null;
  /** Id naročila iz `metadata.orderId`. */
  narociloId: number | null;
}

export interface NovaSeja {
  id: string;
  /** Stran za plačilo, kamor gre kupec. */
  url: string;
}

export interface PonudnikPlacil {
  /** Ustvari sejo plačila za naročilo s statusom „Čaka na plačilo“. */
  ustvariSejo(narocilo: Narocila, moznosti: { izvor: string; zdaj: Date }): Promise<NovaSeja>;
  preberiSejo(id: string): Promise<StanjeSeje>;
  /** Takoj izteče odprto sejo (Z42); vrne njeno stanje po poskusu. */
  prekiniSejo(id: string): Promise<StanjeSeje>;
}

/** Ali so nastavljeni ključi za plačilo s kartico. */
export function stripeNastavljen(env: Pick<Env, "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET"> = okolje()): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
}

/** Ali blagajna ponudi plačilo s kartico (ko so nastavljeni ključi Stripe). */
export function karticaNaVoljo(): boolean {
  return stripeNastavljen();
}

let ponudnik: PonudnikPlacil | null | undefined;

/** Samo za teste: zamenja ponudnika plačil procesa (`undefined` ga ponastavi). */
export function nastaviPonudnikaPlacil(nadomestek: PonudnikPlacil | null | undefined): void {
  ponudnik = nadomestek;
}

/** Ponudnik plačil tega procesa ali `null`, če Stripe ni nastavljen. */
export function ponudnikPlacil(): PonudnikPlacil | null {
  if (ponudnik !== undefined) return ponudnik;
  const env = okolje();
  ponudnik = stripeNastavljen(env)
    ? stripePonudnik(env.STRIPE_SECRET_KEY as string, { apiUrl: env.STRIPE_API_URL })
    : null;
  return ponudnik;
}
