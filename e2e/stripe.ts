/**
 * Stripe v e2e testih (K8). S pravimi testnimi ključi v okolju
 * (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) strežnika uporabljata pravi
 * Stripe in teče `stripe-pravi.spec.ts` (S11 s kartico 4242 4242 4242 4242).
 * Brez njih se zažene nadomestni Stripe (`stripe-nadomestek.ts`) in teče
 * `placilo.spec.ts`; preizkus s pravim Stripom se preskoči z izpisom razloga.
 */
export const PRAVI_STRIPE = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);

export const RAZLOG_BREZ_PRAVEGA_STRIPA =
  "S11 s pravim Stripom je preskočen: STRIPE_SECRET_KEY in STRIPE_WEBHOOK_SECRET (testna) nista nastavljena. " +
  "Tok s kartico preveri placilo.spec.ts z nadomestnim Stripom. Gl. docs/nacrti/spletna-trgovina-predaja.md.";

/** Nastavitve nadomestnega Stripa (ključa nista skrivnost nobenega okolja). */
export const NADOMESTEK = {
  kljuc: "sk_test_e2e_nadomestek",
  skrivnost: "whsec_e2e_nadomestek",
};
