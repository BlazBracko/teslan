import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { stripeNastavljen } from "./placila";
import { parametriSeje, preveriDogodek, REZERVA_IZTEKA_S, stanjeIzSeje, TRAJANJE_SEJE_S } from "./stripe";

/** Seja Stripe Checkout (Z40) in preverjanje podpisa webhooka (Z41). */

const ZDAJ = new Date("2026-11-09T10:00:00.400Z");

const narocilo = {
  id: 7,
  stevilka: "T-2026-0007",
  zeton: "zeton_ABC-123",
  kupec: { ime: "Ana", priimek: "Novak", email: "ana@primer.si", telefon: "040 123 456" },
  postavke: [
    { tip: "izdelek" as const, ime: "Česen v prahu", velikost: "41 ml", cenaCenti: 500, stopnjaDDV: 9.5, kolicina: 2 },
    { tip: "izdelek" as const, ime: "Aronija sok", velikost: null, cenaCenti: 1000, stopnjaDDV: 9.5, kolicina: 1 },
  ],
  postninaCenti: 500,
  skupajCenti: 2500,
};

describe("parametri seje Checkout (Z40)", () => {
  it("EUR, slovenščina, postavke s poštnino, metapodatki, iztek in povratna naslova", () => {
    const p = parametriSeje(narocilo, { izvor: "https://www.teslan.si/", zdaj: ZDAJ });
    expect(p).toMatchObject({
      mode: "payment",
      currency: "eur",
      locale: "sl",
      customer_email: "ana@primer.si",
      client_reference_id: "T-2026-0007",
      metadata: { orderId: "7", stevilka: "T-2026-0007" },
      payment_intent_data: { description: "Naročilo T-2026-0007", metadata: { orderId: "7" } },
      success_url: "https://www.teslan.si/narocilo/T-2026-0007?k=zeton_ABC-123&placilo=1",
      cancel_url: "https://www.teslan.si/blagajna/preklic?narocilo=T-2026-0007&k=zeton_ABC-123",
    });
    expect(p.line_items).toEqual([
      { quantity: 2, price_data: { currency: "eur", unit_amount: 500, product_data: { name: "Česen v prahu, 41 ml" } } },
      { quantity: 1, price_data: { currency: "eur", unit_amount: 1000, product_data: { name: "Aronija sok" } } },
      { quantity: 1, price_data: { currency: "eur", unit_amount: 500, product_data: { name: "Poštnina" } } },
    ]);
    // Načini plačila po nastavitvah v Stripu (kartice, Apple Pay, Google Pay).
    expect(p).not.toHaveProperty("payment_method_types");
    // 30 minut (+ rezerva, ker Stripe krajšega izteka ne sprejme).
    expect(p.expires_at).toBe(Math.ceil(ZDAJ.getTime() / 1000) + TRAJANJE_SEJE_S + REZERVA_IZTEKA_S);
    expect(TRAJANJE_SEJE_S).toBe(1800);
  });

  it("brez poštnine ni postavke Poštnina", () => {
    const p = parametriSeje({ ...narocilo, postninaCenti: 0, skupajCenti: 2000 }, { izvor: "http://localhost:3000", zdaj: ZDAJ });
    expect(p.line_items?.map((l) => l.price_data?.product_data?.name)).toEqual(["Česen v prahu, 41 ml", "Aronija sok"]);
  });

  it("zavrne sejo, če se vsota postavk ne ujema z zneskom naročila", () => {
    expect(() => parametriSeje({ ...narocilo, skupajCenti: 2499 }, { izvor: "https://x.si", zdaj: ZDAJ })).toThrow(
      /se ne ujemajo/,
    );
  });
});

describe("stanje seje", () => {
  it("prebere status, plačilo, id plačila in naročila", () => {
    const seja = (s: Record<string, unknown>) => stanjeIzSeje({ id: "cs_1", metadata: { orderId: "7" }, ...s } as never);
    expect(seja({ status: "complete", payment_status: "paid", payment_intent: "pi_1" })).toEqual({
      id: "cs_1",
      status: "complete",
      placano: true,
      paymentIntentId: "pi_1",
      narociloId: 7,
    });
    expect(seja({ status: "open", payment_status: "unpaid", payment_intent: null, metadata: {} })).toMatchObject({
      status: "open",
      placano: false,
      paymentIntentId: null,
      narociloId: null,
    });
    expect(seja({ status: "expired", payment_status: "unpaid", payment_intent: { id: "pi_2" } })).toMatchObject({
      status: "expired",
      paymentIntentId: "pi_2",
    });
  });
});

describe("podpis webhooka (Z41)", () => {
  const skrivnost = "whsec_testna_skrivnost";
  const telo = JSON.stringify({ id: "evt_1", object: "event", type: "checkout.session.completed", data: { object: {} } });

  it("sprejme pravilno podpisan dogodek", () => {
    const podpis = Stripe.webhooks.generateTestHeaderString({ payload: telo, secret: skrivnost });
    expect(preveriDogodek(telo, podpis, skrivnost)).toMatchObject({ id: "evt_1", type: "checkout.session.completed" });
  });

  it("zavrne manjkajoč, napačen ali spremenjen podpis", () => {
    const podpis = Stripe.webhooks.generateTestHeaderString({ payload: telo, secret: skrivnost });
    expect(() => preveriDogodek(telo, null, skrivnost)).toThrow(/Stripe-Signature/);
    expect(() => preveriDogodek(telo, podpis, "whsec_druga")).toThrow();
    expect(() => preveriDogodek(telo.replace("evt_1", "evt_2"), podpis, skrivnost)).toThrow();
  });

  it("zavrne prestar podpis", () => {
    const podpis = Stripe.webhooks.generateTestHeaderString({
      payload: telo,
      secret: skrivnost,
      timestamp: Math.floor(Date.now() / 1000) - 10 * 60,
    });
    expect(() => preveriDogodek(telo, podpis, skrivnost)).toThrow();
  });
});

describe("kartica na voljo", () => {
  it("samo z obema ključema Stripe", () => {
    expect(stripeNastavljen({ STRIPE_SECRET_KEY: undefined, STRIPE_WEBHOOK_SECRET: undefined })).toBe(false);
    expect(stripeNastavljen({ STRIPE_SECRET_KEY: "sk_test_x", STRIPE_WEBHOOK_SECRET: undefined })).toBe(false);
    expect(stripeNastavljen({ STRIPE_SECRET_KEY: "sk_test_x", STRIPE_WEBHOOK_SECRET: "whsec_x" })).toBe(true);
  });
});
