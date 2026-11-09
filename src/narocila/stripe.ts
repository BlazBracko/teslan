import Stripe from "stripe";
import type { Narocila } from "../payload-types";
import type { NovaSeja, PonudnikPlacil, StanjeSeje } from "./placila";
import { potNarocila } from "./pogled";

/**
 * Stripe Checkout (Z40–Z42): gostovana stran za plačilo, brez Stripe.js na
 * naši strani. Odjemalec se ustvari šele ob prvem plačilu, zato gradnja in
 * strani brez ključev Stripa ne potrebujejo.
 */

/** Seja poteče po 30 minutah (Z40, P10). */
export const TRAJANJE_SEJE_S = 30 * 60;
/**
 * Stripe zavrne `expires_at`, ki je manj kot 30 minut po nastanku seje (po
 * njegovi uri). Minuta rezerve pokrije zamik omrežja in razliko ur.
 */
export const REZERVA_IZTEKA_S = 60;

/** Pot, kamor Stripe vrne kupca, ki plačilo prekine (Z42). */
export const POT_PREKLICA_PLACILA = "/blagajna/preklic";

/** Parameter na strani naročila, s katerim se kupec vrne s plačila. */
export const PARAMETER_PLACILA = "placilo";

/** Pot na stran naročila po uspešnem plačilu (kupec se vrne s Stripa). */
export function potPoPlacilu(stevilka: string, zeton: string): string {
  return `${potNarocila(stevilka, zeton)}&${PARAMETER_PLACILA}=1`;
}

/** Pot za vrnitev s preklicem; žeton dokazuje, da je kupec lastnik naročila. */
export function potPreklica(stevilka: string, zeton: string): string {
  return `${POT_PREKLICA_PLACILA}?narocilo=${encodeURIComponent(stevilka)}&k=${encodeURIComponent(zeton)}`;
}

/**
 * Parametri seje Checkout za naročilo (Z40): plačilo v EUR, slovenski
 * vmesnik, načini plačila po nastavitvah v Stripu (kartice, Apple Pay,
 * Google Pay), postavke s cenami z DDV in poštnina. Vsota postavk je enaka
 * znesku naročila na cent; sicer se seja ne ustvari.
 */
export function parametriSeje(
  n: Pick<Narocila, "id" | "stevilka" | "zeton" | "kupec" | "postavke" | "postninaCenti" | "skupajCenti">,
  { izvor, zdaj }: { izvor: string; zdaj: Date },
): Stripe.Checkout.SessionCreateParams {
  const osnova = izvor.replace(/\/$/, "");
  const postavka = (ime: string, cenaCenti: number, kolicina: number): Stripe.Checkout.SessionCreateParams.LineItem => ({
    quantity: kolicina,
    price_data: { currency: "eur", unit_amount: cenaCenti, product_data: { name: ime } },
  });
  const postavke = [
    // Darilna škatla je ena vrstica: cena škatle in vsebine za eno škatlo.
    ...n.postavke.map((p) =>
      postavka(
        [p.ime, p.velikost].filter(Boolean).join(", "),
        p.cenaCenti + (p.tip === "skatla" ? (p.vsebina ?? []).reduce((s, v) => s + v.cenaCenti * v.kolicina, 0) : 0),
        p.kolicina,
      ),
    ),
    ...(n.postninaCenti > 0 ? [postavka("Poštnina", n.postninaCenti, 1)] : []),
  ];
  const vsota = postavke.reduce((s, p) => s + (p.price_data?.unit_amount ?? 0) * (p.quantity ?? 0), 0);
  if (vsota !== n.skupajCenti) {
    throw new Error(`Postavke za Stripe (${vsota} c) se ne ujemajo z zneskom naročila ${n.stevilka} (${n.skupajCenti} c).`);
  }
  const metadata = { orderId: String(n.id), stevilka: n.stevilka };
  return {
    mode: "payment",
    currency: "eur",
    locale: "sl",
    line_items: postavke,
    customer_email: n.kupec.email,
    client_reference_id: n.stevilka,
    metadata,
    payment_intent_data: { description: `Naročilo ${n.stevilka}`, metadata },
    expires_at: Math.ceil(zdaj.getTime() / 1000) + TRAJANJE_SEJE_S + REZERVA_IZTEKA_S,
    success_url: `${osnova}${potPoPlacilu(n.stevilka, n.zeton)}`,
    cancel_url: `${osnova}${potPreklica(n.stevilka, n.zeton)}`,
  };
}

/** Stanje seje iz Stripovega objekta (iz API ali dogodka webhooka). */
export function stanjeIzSeje(s: Stripe.Checkout.Session): StanjeSeje {
  const id = Number(s.metadata?.orderId);
  return {
    id: s.id,
    status: s.status === "complete" ? "complete" : s.status === "expired" ? "expired" : "open",
    placano: s.payment_status === "paid" || s.payment_status === "no_payment_required",
    paymentIntentId: typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? null),
    narociloId: Number.isInteger(id) && id > 0 ? id : null,
  };
}

/**
 * Preveri podpis webhooka (Z41) in vrne dogodek. Vrže napako, če podpis
 * manjka, je napačen ali prestar (privzeto 5 minut).
 */
export function preveriDogodek(telo: string, podpis: string | null, skrivnost: string): Stripe.Event {
  if (!podpis) throw new Error("Manjka glava Stripe-Signature.");
  return Stripe.webhooks.constructEvent(telo, podpis, skrivnost);
}

function odjemalec(kljuc: string, apiUrl?: string): Stripe {
  const naslov = apiUrl ? new URL(apiUrl) : null;
  return new Stripe(kljuc, {
    maxNetworkRetries: 2,
    timeout: 20_000,
    appInfo: { name: "teslan" },
    ...(naslov
      ? {
          host: naslov.hostname,
          port: naslov.port || (naslov.protocol === "https:" ? 443 : 80),
          protocol: naslov.protocol === "https:" ? "https" : "http",
        }
      : {}),
  });
}

/**
 * Ponudnik plačil prek Stripe Checkout. `apiUrl` preusmeri klice na
 * nadomestni API (samo e2e testi).
 */
export function stripePonudnik(kljuc: string, { apiUrl }: { apiUrl?: string } = {}): PonudnikPlacil {
  let stripe: Stripe | undefined;
  const s = () => (stripe ??= odjemalec(kljuc, apiUrl));
  const preberiSejo = async (id: string) => stanjeIzSeje(await s().checkout.sessions.retrieve(id));
  return {
    async ustvariSejo(narocilo, moznosti): Promise<NovaSeja> {
      const seja = await s().checkout.sessions.create(parametriSeje(narocilo, moznosti), {
        // Ponovljen klic za isto naročilo ne ustvari druge seje.
        idempotencyKey: `teslan-narocilo-${narocilo.id}-${narocilo.stevilka}`,
      });
      if (!seja.url) throw new Error(`Stripe ni vrnil naslova za plačilo (seja ${seja.id}).`);
      return { id: seja.id, url: seja.url };
    },
    preberiSejo,
    async prekiniSejo(id) {
      try {
        return stanjeIzSeje(await s().checkout.sessions.expire(id));
      } catch (napaka) {
        // Seje, ki ni več odprta (zaključena ali že potekla), ni mogoče izteči:
        // vrnemo njeno dejansko stanje.
        const stanje = await preberiSejo(id);
        if (stanje.status === "open") throw napaka;
        return stanje;
      }
    },
  };
}
