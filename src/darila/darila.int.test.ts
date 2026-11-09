import type { Payload } from "payload";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { oddajNarocilo, type RezultatOddaje } from "@/narocila/oddaja";
import { parametriSeje } from "@/narocila/stripe";
import type { DarilniProgrami, Izdelki, TipiSkatel, User } from "@/payload-types";
import { payloadNaCistiBazi } from "@/test/payload";
import { NadomestniPonudnik } from "@/test/placila";

/**
 * Integracija daril s Postgres (K10): validacija programov v adminu (Z51,
 * Z52), dostop (Z80), škatla v naročilu z zalogo škatle in vsebine (Z30,
 * P8), sporočilo na kartici (Z54), naslov prejemnika (Z55) in vračilo
 * zaloge ob preklicu (Z34).
 */

let payload: Payload;
let urednik: User;
let cesen: Izdelki;
let olje: Izdelki;
let jajca: Izdelki;
let mala: TipiSkatel;
const ZDAJ = new Date("2026-11-09T10:00:00Z");

const obrazec = {
  ime: "Ana",
  priimek: "Novak",
  email: "ana@primer.si",
  telefon: "040 123 456",
  nacinDostave: "prevzem",
  nacinPlacila: "ob-prevzemu",
  soglasje: true,
};

const oddaj = (kosarica: unknown[], popravki: Record<string, unknown> = {}, kartica = false) =>
  oddajNarocilo(
    payload,
    { obrazec: { ...obrazec, ...popravki }, kosarica },
    { placila: kartica ? new NadomestniPonudnik() : null, izvor: "https://trgovina.test", zdaj: ZDAJ },
  );

function uspesno(r: RezultatOddaje): Extract<RezultatOddaje, { ok: true }> {
  if (!r.ok) throw new Error(`Oddaja ni uspela: ${JSON.stringify(r)}`);
  return r;
}

async function napaka(obljuba: Promise<unknown>): Promise<string> {
  try {
    await obljuba;
  } catch (e) {
    const n = e as { message: string; data?: { errors?: Array<{ message: string }> } };
    return [n.message, ...(n.data?.errors ?? []).map((x) => x.message)].join(" | ");
  }
  throw new Error("Pričakovana je bila napaka, operacija pa je uspela.");
}

const zaloga = async (izdelek: Izdelki, velikost = 0) =>
  (await payload.findByID({ collection: "izdelki", id: izdelek.id })).velikosti[velikost].zaloga ?? 0;
const zalogaSkatel = async () => (await payload.findByID({ collection: "tipi-skatel", id: mala.id })).zaloga;
const vel = (izdelek: Izdelki, i = 0) => izdelek.velikosti[i].id as string;

const skatla = (vsebina: Array<[Izdelki, number, number]>, del: Record<string, unknown> = {}) => ({
  vrsta: "skatla",
  id: `s-${Math.random().toString(36).slice(2)}`,
  tipSkatleId: mala.id,
  vsebina: vsebina.map(([izdelek, velikost, kolicina]) => ({ izdelekId: izdelek.id, velikostId: vel(izdelek, velikost), kolicina })),
  kolicina: 1,
  ...del,
});

beforeAll(async () => {
  payload = await payloadNaCistiBazi();
  const kategorija = await payload.create({ collection: "kategorije", data: { ime: "Začimbe", vrstniRed: 0 } });
  const izdelek = (
    ime: string,
    nacinProdaje: Izdelki["nacinProdaje"],
    primernoZaDarilo: boolean,
    velikosti: Izdelki["velikosti"],
  ) =>
    payload.create({
      collection: "izdelki",
      data: {
        ime,
        objavljen: true,
        kategorija: kategorija.id,
        nacinProdaje,
        primernoZaDarilo,
        stopnjaDDV: "9.5",
        velikosti,
        vrstniRed: 0,
      },
      context: { brezRevalidacije: true },
    });
  cesen = await izdelek("Česen v prahu", "posta-in-prevzem", true, [
    { oznaka: "41 ml (15 g)", cenaCenti: 500, zaloga: 20 },
    { oznaka: "106 ml (40 g)", cenaCenti: 1200, zaloga: 20 },
  ]);
  olje = await izdelek("Bučno olje", "posta-in-prevzem", true, [{ oznaka: "0,5 L", cenaCenti: 1200, zaloga: 20 }]);
  jajca = await izdelek("Jajca kokošja", "samo-prevzem", false, [{ oznaka: "10 kos", cenaCenti: 300, zaloga: 20 }]);
  mala = await payload.create({
    collection: "tipi-skatel",
    data: { ime: "Mala darilna škatla", steviloMest: 3, cenaCenti: 500, zaloga: 10, aktiven: true, vrstniRed: 0 },
    context: { brezRevalidacije: true },
  });
  await payload.updateGlobal({
    slug: "nastavitve-trgovine",
    data: { trgovinaOdprta: true, postninaCenti: 500, pragBrezplacnePostnineCenti: 5000, emailObvestil: "sandi@primer.si" },
  });
  urednik = await payload.create({
    collection: "users",
    data: { ime: "Urednik", email: "urednik-darila@teslan.test", password: "geslo-urednika-12", vloga: "urednik" },
  });
}, 60_000);

afterAll(async () => {
  await payload?.destroy();
});

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(payload, "sendEmail").mockResolvedValue(undefined);
});

describe("programi v adminu (Z51, Z52)", () => {
  it("urednik ustvari program; velikost vpiše z oznako ali jo pusti prazno", async () => {
    const program: DarilniProgrami = await payload.create({
      collection: "darilni-programi",
      data: {
        ime: "Okusi Dolenjske",
        objavljen: true,
        tipSkatle: mala.id,
        vsebina: [
          { izdelek: cesen.id, velikostId: "106 ml (40 g)", kolicina: 1 },
          { izdelek: olje.id, velikostId: "", kolicina: 2 },
        ],
        vrstniRed: 0,
      },
      user: urednik,
      overrideAccess: false,
      context: { brezRevalidacije: true },
    });
    expect(program.slug).toBe("okusi-dolenjske");
    expect(program.vsebina.map((v) => [v.velikostId, v.kolicina])).toEqual([
      [vel(cesen, 1), 1],
      [vel(olje), 2],
    ]);
    // Urednik v adminu vidi izbrano velikost z oznako.
    const prebran = await payload.findByID({ collection: "darilni-programi", id: program.id, depth: 0, user: urednik });
    expect(prebran.vsebina.map((v) => (v as { izbranaVelikost?: string }).izbranaVelikost)).toEqual([
      "106 ml (40 g)",
      "0,5 L",
    ]);
  });

  it("zavrne več kosov, kot ima škatla mest, neprimeren izdelek in neznano velikost", async () => {
    const ustvari = (vsebina: DarilniProgrami["vsebina"]) =>
      payload.create({
        collection: "darilni-programi",
        data: { ime: `Napačen ${Math.random()}`, tipSkatle: mala.id, vsebina, vrstniRed: 0 },
        user: urednik,
        overrideAccess: false,
        context: { brezRevalidacije: true },
      });
    expect(await napaka(ustvari([{ izdelek: cesen.id, kolicina: 2 }, { izdelek: olje.id, kolicina: 2 }]))).toContain(
      "V programu je 4 kosov, izbrana škatla pa ima samo 3 mest.",
    );
    expect(await napaka(ustvari([{ izdelek: jajca.id, kolicina: 1 }]))).toContain(
      "Jajca kokošja ni primeren za darilno škatlo.",
    );
    expect(await napaka(ustvari([{ izdelek: cesen.id, velikostId: "1 kg", kolicina: 1 }]))).toContain(
      "Česen v prahu nima velikosti „1 kg“. Vpišite eno od: 41 ml (15 g), 106 ml (40 g).",
    );
  });

  it("javnost vidi le aktivne škatle in objavljene programe (Z80)", async () => {
    await payload.create({
      collection: "tipi-skatel",
      data: { ime: "Neaktivna", steviloMest: 2, cenaCenti: 100, zaloga: 5, aktiven: false, vrstniRed: 1 },
      user: urednik,
      overrideAccess: false,
      context: { brezRevalidacije: true },
    });
    await payload.create({
      collection: "darilni-programi",
      data: { ime: "Skrit program", objavljen: false, tipSkatle: mala.id, vsebina: [{ izdelek: cesen.id, kolicina: 1 }], vrstniRed: 0 },
      context: { brezRevalidacije: true },
    });
    const javno = { overrideAccess: false, depth: 0 } as const;
    expect((await payload.find({ collection: "tipi-skatel", ...javno })).docs.map((t) => t.ime)).toEqual([
      "Mala darilna škatla",
    ]);
    expect((await payload.find({ collection: "darilni-programi", ...javno })).docs.map((p) => p.ime)).toEqual([
      "Okusi Dolenjske",
    ]);
    expect((await payload.find({ collection: "tipi-skatel", depth: 0, user: urednik, overrideAccess: false })).totalDocs).toBe(2);
  });
});

describe("škatla v naročilu (Z30, Z54, P8)", () => {
  it("zmanjša zalogo škatle in vsebine, shrani posnetek in sporočilo; preklic vrne vse enkrat", async () => {
    const [c41, c106, o, s] = [await zaloga(cesen), await zaloga(cesen, 1), await zaloga(olje), await zalogaSkatel()];
    const r = uspesno(
      await oddaj([
        skatla([[cesen, 0, 1], [olje, 0, 2]], { kolicina: 2, sporocilo: "Vse najboljše, babi!", program: "okusi-dolenjske" }),
        { izdelekId: cesen.id, velikostId: vel(cesen), kolicina: 1 },
      ]),
    );
    const n = await payload.findByID({ collection: "narocila", id: r.id, depth: 0 });
    // (5,00 + 5,00 + 2 × 12,00) × 2 + 5,00 = 73,00 €
    expect(n.vmesniSestevekCenti).toBe(7300);
    expect(n.ddv?.map((d) => [d.stopnja, d.osnovaCenti, d.ddvCenti])).toEqual([
      [9.5, 5753, 547],
      [22, 820, 180],
    ]);
    const [skatlaN, cesenN] = n.postavke;
    expect(skatlaN).toMatchObject({
      tip: "skatla",
      ime: "Mala darilna škatla: Okusi Dolenjske",
      tipSkatle: mala.id,
      cenaCenti: 500,
      stopnjaDDV: 22,
      kolicina: 2,
      sporociloNaKartici: "Vse najboljše, babi!",
    });
    expect(skatlaN.vsebina?.map((v) => [v.ime, v.velikost, v.kolicina, v.cenaCenti, v.stopnjaDDV])).toEqual([
      ["Česen v prahu", "41 ml (15 g)", 1, 500, 9.5],
      ["Bučno olje", "0,5 L", 2, 1200, 9.5],
    ]);
    expect(cesenN).toMatchObject({ tip: "izdelek", ime: "Česen v prahu", kolicina: 1 });

    expect(await zalogaSkatel()).toBe(s - 2);
    expect(await zaloga(cesen)).toBe(c41 - 3);
    expect(await zaloga(cesen, 1)).toBe(c106);
    expect(await zaloga(olje)).toBe(o - 4);

    // Stripe: škatla je ena vrstica s ceno škatle in vsebine.
    const params = parametriSeje(n, { izvor: "https://trgovina.test", zdaj: ZDAJ });
    expect(params.line_items?.map((l) => [l.price_data?.product_data?.name, l.price_data?.unit_amount, l.quantity])).toEqual([
      ["Mala darilna škatla: Okusi Dolenjske", 3400, 2],
      ["Česen v prahu, 41 ml (15 g)", 500, 1],
    ]);

    // Preklic dvakrat: zaloga se vrne natanko enkrat (Z34).
    for (let i = 0; i < 2; i++) {
      await payload.update({
        collection: "narocila",
        id: r.id,
        data: { status: "preklicano" },
        user: urednik,
        overrideAccess: false,
        context: { brezRevalidacije: true },
      });
    }
    expect(await zalogaSkatel()).toBe(s);
    expect(await zaloga(cesen)).toBe(c41);
    expect(await zaloga(olje)).toBe(o);
  });

  it("premalo zalog: transakcija ne spremeni ničesar in kupec dobi seznam (Z30)", async () => {
    const s = await zalogaSkatel();
    const o = await zaloga(olje);
    const r = await oddaj([skatla([[olje, 0, 3]], { kolicina: 7 })]);
    expect(r).toMatchObject({ ok: false, vrsta: "kosarica" });
    expect(!r.ok && r.vrsta === "kosarica" && r.tezave).toEqual([
      { ime: "Mala darilna škatla", razlog: "Na zalogi je dovolj samo za 6 škatel." },
    ]);
    expect(await zalogaSkatel()).toBe(s);
    expect(await zaloga(olje)).toBe(o);

    const neprimerna = await oddaj([skatla([[jajca, 0, 1]])]);
    expect(neprimerna).toMatchObject({ ok: false, vrsta: "kosarica" });
  });

  it("pošta na naslov prejemnika (Z55): naslov dostave je prejemnikov, naročilo je darilo", async () => {
    const r = uspesno(
      await oddaj(
        [skatla([[cesen, 1, 1]])],
        {
          nacinDostave: "posta",
          nacinPlacila: "kartica",
          darilo: true,
          prejemnikIme: "Marija Novak",
          ulica: "Cesta 1",
          postnaStevilka: "1000",
          kraj: "Ljubljana",
        },
        true,
      ),
    );
    const n = await payload.findByID({ collection: "narocila", id: r.id, depth: 0 });
    expect(n).toMatchObject({
      darilo: true,
      prejemnik: { ime: "Marija Novak", ulica: "Cesta 1", postnaStevilka: "1000", kraj: "Ljubljana" },
      naslov: { ulica: "Cesta 1", postnaStevilka: "1000", kraj: "Ljubljana" },
      postninaCenti: 500,
      skupajCenti: 500 + 1200 + 500,
    });
  });

  it("naslov prejemnika brez škatle ali brez imena prejemnika zavrne", async () => {
    const posta = { nacinDostave: "posta", nacinPlacila: "kartica", ulica: "Cesta 1", postnaStevilka: "1000", kraj: "Ljubljana" };
    const brezSkatle = await oddaj(
      [{ izdelekId: cesen.id, velikostId: vel(cesen), kolicina: 1 }],
      { ...posta, darilo: true, prejemnikIme: "Marija" },
      true,
    );
    expect(brezSkatle).toMatchObject({
      ok: false,
      sporocilo: "Pošiljanje na naslov prejemnika je mogoče samo, če je v košarici darilna škatla.",
    });
    const brezImena = await oddaj([skatla([[cesen, 0, 1]])], { ...posta, darilo: true }, true);
    expect(brezImena).toMatchObject({ ok: false, vrsta: "obrazec", napake: { prejemnikIme: "Vpišite ime in priimek prejemnika." } });
  });
});
