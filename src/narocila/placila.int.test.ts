import type { Payload } from "payload";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Izdelki, User } from "@/payload-types";
import { payloadNaCistiBazi } from "@/test/payload";
import { dogodekSeje, NadomestniPonudnik } from "@/test/placila";
import { oddajNarocilo, RAZLOG_NAPAKA_ZACETKA, SPOROCILO_NAPAKA_PLACILA, type RezultatOddaje } from "./oddaja";
import { nastaviPonudnikaPlacil } from "./placila";
import {
  obdelajDogodek,
  pocistiNeplacana,
  preklicObVrnitvi,
  RAZLOG_NEPLACANO,
  RAZLOG_PREKINJENO,
  ZAMUDA_VAROVALKE_MS,
} from "./potek-placila";

/**
 * Plačilo s kartico s Postgres (K8): oddaja ustvari sejo Checkout (Z40),
 * webhook potrdi ali prekliče naročilo idempotentno (Z41, S8), vrnitev s
 * preklicem izteče sejo (Z42), varovalka za izgubljene dogodke (P10).
 * Stripe nadomešča `NadomestniPonudnik`.
 */

let payload: Payload;
let urednik: User;
let olje: Izdelki;
let ponudnik: NadomestniPonudnik;
const ZDAJ = new Date("2026-11-09T10:00:00Z");
const IZVOR = "https://trgovina.test";

const obrazec = {
  ime: "Bor",
  priimek: "Kos",
  email: "bor@primer.si",
  telefon: "041 222 333",
  nacinDostave: "posta",
  nacinPlacila: "kartica",
  ulica: "Glavna cesta 12",
  postnaStevilka: "8000",
  kraj: "Novo mesto",
  soglasje: true,
};

const oddaj = (kolicina = 1, popravki: Record<string, unknown> = {}) =>
  oddajNarocilo(
    payload,
    {
      obrazec: { ...obrazec, ...popravki },
      kosarica: [{ izdelekId: olje.id, velikostId: olje.velikosti[0].id as string, kolicina }],
    },
    { placila: ponudnik, izvor: IZVOR, zdaj: ZDAJ },
  );

function uspesno(r: RezultatOddaje): Extract<RezultatOddaje, { ok: true }> {
  if (!r.ok) throw new Error(`Oddaja ni uspela: ${JSON.stringify(r)}`);
  return r;
}

const narocilo = (id: number) => payload.findByID({ collection: "narocila", id, overrideAccess: true });

async function zaloga(): Promise<number> {
  const doc = await payload.findByID({ collection: "izdelki", id: olje.id });
  return doc.velikosti[0].zaloga ?? 0;
}

/** Oddano kartično naročilo in njegova seja. */
async function oddanoNarocilo(kolicina = 1) {
  const r = uspesno(await oddaj(kolicina));
  const n = await narocilo(r.id);
  return { r, n, sejaId: n.stripeSessionId as string };
}

beforeAll(async () => {
  payload = await payloadNaCistiBazi();
  const kategorija = await payload.create({ collection: "kategorije", data: { ime: "Olja", vrstniRed: 0 } });
  olje = await payload.create({
    collection: "izdelki",
    data: {
      ime: "Bučno olje",
      objavljen: true,
      kategorija: kategorija.id,
      nacinProdaje: "posta-in-prevzem",
      stopnjaDDV: "9.5",
      velikosti: [{ oznaka: "0,5 L", cenaCenti: 1200, zaloga: 100 }],
      vrstniRed: 0,
    },
    context: { brezRevalidacije: true },
  });
  await payload.updateGlobal({
    slug: "nastavitve-trgovine",
    data: { trgovinaOdprta: true, postninaCenti: 500, pragBrezplacnePostnineCenti: 5000, emailObvestil: "sandi@primer.si" },
  });
  urednik = await payload.create({
    collection: "users",
    data: { ime: "Urednik", email: "urednik-placila@teslan.test", password: "geslo-urednika-12", vloga: "urednik" },
  });
}, 60_000);

afterAll(async () => {
  nastaviPonudnikaPlacil(undefined);
  await payload?.destroy();
});

beforeEach(() => {
  ponudnik = new NadomestniPonudnik();
  nastaviPonudnikaPlacil(ponudnik);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("oddaja s kartico (Z40)", () => {
  it("ustvari naročilo, ki čaka na plačilo, rezervira zalogo in sejo Checkout; e-pošte še ni", async () => {
    const posiljanje = vi.spyOn(payload, "sendEmail");
    const prej = await zaloga();
    const r = uspesno(await oddaj(2));

    const { stanje, parametri } = ponudnik.zadnja();
    expect(r.placilo).toBe(`https://placilo.test/${stanje.id}`);
    expect(await narocilo(r.id)).toMatchObject({
      status: "caka-placilo",
      placano: false,
      nacinPlacila: "kartica",
      stripeSessionId: stanje.id,
      vmesniSestevekCenti: 2400,
      postninaCenti: 500,
      skupajCenti: 2900,
    });
    expect(await zaloga()).toBe(prej - 2);
    expect(posiljanje).not.toHaveBeenCalled();

    expect(parametri).toMatchObject({
      mode: "payment",
      currency: "eur",
      locale: "sl",
      customer_email: "bor@primer.si",
      client_reference_id: r.stevilka,
      metadata: { orderId: String(r.id), stevilka: r.stevilka },
      success_url: `${IZVOR}/narocilo/${r.stevilka}?k=${r.zeton}&placilo=1`,
      cancel_url: `${IZVOR}/blagajna/preklic?narocilo=${r.stevilka}&k=${r.zeton}`,
      line_items: [
        { quantity: 2, price_data: { currency: "eur", unit_amount: 1200, product_data: { name: "Bučno olje, 0,5 L" } } },
        { quantity: 1, price_data: { currency: "eur", unit_amount: 500, product_data: { name: "Poštnina" } } },
      ],
    });
    expect(parametri.expires_at).toBeGreaterThanOrEqual(ZDAJ.getTime() / 1000 + 30 * 60);
    expect(parametri).not.toHaveProperty("payment_method_types");
  });

  it("napaka pri ustvarjanju seje prekliče naročilo in vrne zalogo", async () => {
    ponudnik.napakaPriUstvarjanju = new Error("Stripe ni dosegljiv");
    vi.spyOn(payload.logger, "error").mockImplementation(() => undefined);
    const prej = await zaloga();
    const steviloPrej = (await payload.count({ collection: "narocila" })).totalDocs;

    expect(await oddaj()).toEqual({ ok: false, vrsta: "zavrnjeno", sporocilo: SPOROCILO_NAPAKA_PLACILA });
    expect(await zaloga()).toBe(prej);
    const { docs } = await payload.find({ collection: "narocila", sort: "-createdAt", limit: 1, overrideAccess: true });
    expect((await payload.count({ collection: "narocila" })).totalDocs).toBe(steviloPrej + 1);
    expect(docs[0]).toMatchObject({ status: "preklicano", razlogPreklica: RAZLOG_NAPAKA_ZACETKA, zalogaVrnjena: true });
  });
});

describe("webhook (Z41, S8)", () => {
  it("ponovljen checkout.session.completed potrdi plačilo in pošlje E1 in E2 natanko enkrat", async () => {
    const posiljanje = vi.spyOn(payload, "sendEmail");
    const { r, sejaId } = await oddanoNarocilo();
    const placano = ponudnik.placaj(sejaId);
    const dogodek = dogodekSeje("checkout.session.completed", placano);

    expect(await obdelajDogodek(payload, dogodek)).toBe("placano");
    expect(await obdelajDogodek(payload, dogodek)).toBe("ze-obdelano");
    // Hkratni ponovitvi (Stripe lahko dogodek pošlje večkrat hkrati).
    expect(await Promise.all([obdelajDogodek(payload, dogodek), obdelajDogodek(payload, dogodek)])).toEqual([
      "ze-obdelano",
      "ze-obdelano",
    ]);

    expect(await narocilo(r.id)).toMatchObject({ status: "novo", placano: true, stripePaymentIntentId: `pi_${sejaId}` });
    expect(posiljanje).toHaveBeenCalledTimes(2);
    expect(posiljanje.mock.calls.map(([s]) => s.to).sort()).toEqual(["bor@primer.si", "sandi@primer.si"]);
    expect(posiljanje.mock.calls[0][0].subject).toContain(r.stevilka);
  });

  it("hkratna prva dogodka pošljeta e-pošto enkrat", async () => {
    const posiljanje = vi.spyOn(payload, "sendEmail");
    const { sejaId } = await oddanoNarocilo();
    const dogodek = dogodekSeje("checkout.session.completed", ponudnik.placaj(sejaId));
    const izidi = await Promise.all([obdelajDogodek(payload, dogodek), obdelajDogodek(payload, dogodek)]);
    expect(izidi.sort()).toEqual(["placano", "ze-obdelano"]);
    expect(posiljanje).toHaveBeenCalledTimes(2);
  });

  it("checkout.session.expired prekliče naročilo in vrne zalogo enkrat, brez e-pošte", async () => {
    const posiljanje = vi.spyOn(payload, "sendEmail");
    const prej = await zaloga();
    const { r, sejaId } = await oddanoNarocilo(3);
    expect(await zaloga()).toBe(prej - 3);

    const dogodek = dogodekSeje("checkout.session.expired", await ponudnik.prekiniSejo(sejaId));
    expect(await obdelajDogodek(payload, dogodek)).toBe("preklicano");
    expect(await obdelajDogodek(payload, dogodek)).toBe("ze-obdelano");

    expect(await zaloga()).toBe(prej);
    expect(await narocilo(r.id)).toMatchObject({
      status: "preklicano",
      placano: false,
      razlogPreklica: RAZLOG_NEPLACANO,
      zalogaVrnjena: true,
    });
    expect(posiljanje).not.toHaveBeenCalled();
  });

  it("neplačana zaključena seja in seja druge trgovine se prezreta", async () => {
    const { r, sejaId } = await oddanoNarocilo();
    const odprta = await ponudnik.preberiSejo(sejaId);
    expect(await obdelajDogodek(payload, dogodekSeje("checkout.session.completed", odprta, { placano: false }))).toBe(
      "prezrto",
    );
    expect(
      await obdelajDogodek(
        payload,
        dogodekSeje("checkout.session.completed", { ...odprta, id: "cs_test_tuja", status: "complete", placano: true }),
      ),
    ).toBe("prezrto");
    expect(
      await obdelajDogodek(payload, { id: "evt_x", type: "payment_intent.created", data: { object: {} } } as never),
    ).toBe("prezrto");
    expect((await narocilo(r.id)).status).toBe("caka-placilo");
  });

  it("plačilo za naročilo, ki ga je Sandi medtem preklical, se zapiše za ročno vračilo", async () => {
    const posiljanje = vi.spyOn(payload, "sendEmail");
    vi.spyOn(payload.logger, "error").mockImplementation(() => undefined);
    const { r, sejaId } = await oddanoNarocilo();
    // Sandi prekliče v adminu, kupec pa je ravno plačal (seja je že zaključena).
    const placano = ponudnik.placaj(sejaId);
    await payload.update({
      collection: "narocila",
      id: r.id,
      data: { status: "preklicano" },
      user: urednik,
      overrideAccess: false,
    });

    expect(await obdelajDogodek(payload, dogodekSeje("checkout.session.completed", placano))).toBe(
      "placano-po-preklicu",
    );
    expect(await obdelajDogodek(payload, dogodekSeje("checkout.session.completed", placano))).toBe("ze-obdelano");
    const n = await narocilo(r.id);
    expect(n).toMatchObject({ status: "preklicano", placano: true, stripePaymentIntentId: `pi_${sejaId}` });
    expect(n.internaOpomba).toContain("Znesek vrnite kupcu v Stripu.");
    expect(posiljanje).not.toHaveBeenCalled();
  });
});

describe("vrnitev s preklicem in preklic v adminu (Z42)", () => {
  it("vrnitev s preklicem takoj izteče sejo, prekliče naročilo in vrne zalogo", async () => {
    const prej = await zaloga();
    const { r, sejaId } = await oddanoNarocilo(2);

    expect(await preklicObVrnitvi(payload, ponudnik, r.stevilka, "napacen-zeton")).toEqual({ izid: "prezrto" });
    expect((await narocilo(r.id)).status).toBe("caka-placilo");

    expect(await preklicObVrnitvi(payload, ponudnik, r.stevilka, r.zeton)).toEqual({
      izid: "preklicano",
      stevilka: r.stevilka,
    });
    expect((await ponudnik.preberiSejo(sejaId)).status).toBe("expired");
    expect(await narocilo(r.id)).toMatchObject({ status: "preklicano", razlogPreklica: RAZLOG_PREKINJENO });
    expect(await zaloga()).toBe(prej);

    // Stripe po izteku pošlje še dogodek expired: nič se ne spremeni.
    const dogodek = dogodekSeje("checkout.session.expired", await ponudnik.preberiSejo(sejaId));
    expect(await obdelajDogodek(payload, dogodek)).toBe("ze-obdelano");
    expect(await preklicObVrnitvi(payload, ponudnik, r.stevilka, r.zeton)).toMatchObject({ izid: "ze-obdelano" });
    expect(await zaloga()).toBe(prej);
  });

  it("če je seja že plačana, vrnitev potrdi plačilo in vrne pot do potrdila", async () => {
    vi.spyOn(payload, "sendEmail").mockResolvedValue(undefined);
    const { r, sejaId } = await oddanoNarocilo();
    ponudnik.placaj(sejaId);
    expect(await preklicObVrnitvi(payload, ponudnik, r.stevilka, r.zeton)).toEqual({
      izid: "placano",
      stevilka: r.stevilka,
      potNarocila: r.pot,
    });
    expect(await narocilo(r.id)).toMatchObject({ status: "novo", placano: true });
  });

  it("preklic v adminu izteče sejo, da kupec ne more plačati preklicanega naročila", async () => {
    const prej = await zaloga();
    const { r, sejaId } = await oddanoNarocilo();
    await payload.update({
      collection: "narocila",
      id: r.id,
      data: { status: "preklicano", razlogPreklica: "Ni več na zalogi." },
      user: urednik,
      overrideAccess: false,
    });
    expect((await ponudnik.preberiSejo(sejaId)).status).toBe("expired");
    expect(await zaloga()).toBe(prej);
  });
});

describe("varovalka za izgubljene dogodke (P10)", () => {
  it("naročila, ki predolgo čakajo na plačilo, uskladi s Stripom", async () => {
    vi.spyOn(payload, "sendEmail").mockResolvedValue(undefined);
    // Seje naročil prejšnjih testov ta nadomestek ne pozna: napaka se zabeleži in preskoči.
    vi.spyOn(payload.logger, "error").mockImplementation(() => undefined);
    const prej = await zaloga();
    const neplacano = await oddanoNarocilo();
    const placano = await oddanoNarocilo();
    ponudnik.placaj(placano.sejaId);

    // Še ni prepozno: nič se ne zgodi.
    expect(await pocistiNeplacana(payload, ponudnik, new Date())).toBe(0);
    expect((await narocilo(neplacano.r.id)).status).toBe("caka-placilo");

    const kasneje = new Date(Date.now() + ZAMUDA_VAROVALKE_MS + 60_000);
    expect(await pocistiNeplacana(payload, ponudnik, kasneje)).toBe(1);
    expect(await narocilo(neplacano.r.id)).toMatchObject({ status: "preklicano", razlogPreklica: RAZLOG_NEPLACANO });
    expect((await ponudnik.preberiSejo(neplacano.sejaId)).status).toBe("expired");
    expect(await narocilo(placano.r.id)).toMatchObject({ status: "novo", placano: true });
    expect(await zaloga()).toBe(prej - 1);
  });
});
