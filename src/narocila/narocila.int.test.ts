import type { Payload } from "payload";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Izdelki, Narocila, User } from "@/payload-types";
import { payloadNaCistiBazi } from "@/test/payload";
import { oddajNarocilo, SPOROCILO_ZAPRTA_TRGOVINA, type RezultatOddaje } from "./oddaja";

/**
 * Integracija oddaje naročila s Postgres (K7): transakcija in zaloga (Z30,
 * S6), številke in žeton (Z31, Z32), statusi v adminu (Z33, S5), preklic
 * (Z34, S7), brez brisanja (Z35), stikalo trgovine (Z27, S15) in obvestili
 * ob plačilu ob prevzemu (Z43).
 */

let payload: Payload;
let urednik: User;
let cesen: Izdelki;
let jajca: Izdelki;
let zadnjiKos: Izdelki;
const ZDAJ = new Date("2026-11-09T10:00:00Z");

const obrazec = {
  ime: "Ana",
  priimek: "Novak",
  email: "ana@primer.si",
  telefon: "040 123 456",
  nacinDostave: "prevzem",
  nacinPlacila: "ob-prevzemu",
  opomba: "Prevzem v soboto dopoldne.",
  soglasje: true,
};

const postavka = (izdelek: Izdelki, kolicina = 1, velikost = 0) => ({
  izdelekId: izdelek.id,
  velikostId: izdelek.velikosti[velikost].id as string,
  kolicina,
});

const oddaj = (kosarica: unknown[], obrazecPopravki: Record<string, unknown> = {}, kartica = false) =>
  oddajNarocilo(payload, { obrazec: { ...obrazec, ...obrazecPopravki }, kosarica }, { kartica, zdaj: ZDAJ });

async function zaloga(izdelek: Izdelki, velikost = 0): Promise<number | null | undefined> {
  const doc = await payload.findByID({ collection: "izdelki", id: izdelek.id });
  return doc.velikosti[velikost].zaloga;
}

function uspesno(r: RezultatOddaje): Extract<RezultatOddaje, { ok: true }> {
  if (!r.ok) throw new Error(`Oddaja ni uspela: ${JSON.stringify(r)}`);
  return r;
}

/** Besedilo napake z vsemi sporočili validacije polj (Payload jih da v `data.errors`). */
async function napaka(obljuba: Promise<unknown>): Promise<string> {
  try {
    await obljuba;
  } catch (e) {
    const n = e as { message: string; data?: { errors?: Array<{ message: string }> } };
    return [n.message, ...(n.data?.errors ?? []).map((x) => x.message)].join(" | ");
  }
  throw new Error("Pričakovana je bila napaka, operacija pa je uspela.");
}

const narocilo = (id: number) => payload.findByID({ collection: "narocila", id, overrideAccess: true });

beforeAll(async () => {
  payload = await payloadNaCistiBazi();
  const kategorija = await payload.create({ collection: "kategorije", data: { ime: "Začimbe", vrstniRed: 0 } });
  const izdelek = (ime: string, nacinProdaje: Izdelki["nacinProdaje"], velikosti: Izdelki["velikosti"]) =>
    payload.create({
      collection: "izdelki",
      data: { ime, objavljen: true, kategorija: kategorija.id, nacinProdaje, stopnjaDDV: "9.5", velikosti, vrstniRed: 0 },
      context: { brezRevalidacije: true },
    });
  cesen = await izdelek("Česen v prahu", "posta-in-prevzem", [
    { oznaka: "41 ml", cenaCenti: 500, zaloga: 20 },
    { oznaka: "106 ml", cenaCenti: 1200, zaloga: 20 },
  ]);
  jajca = await izdelek("Jajca kokošja", "samo-prevzem", [{ oznaka: "10 kos", cenaCenti: 300, zaloga: 20 }]);
  zadnjiKos = await izdelek("Zadnji kos", "posta-in-prevzem", [{ oznaka: "1 kos", cenaCenti: 900, zaloga: 1 }]);
  await payload.updateGlobal({
    slug: "nastavitve-trgovine",
    data: {
      trgovinaOdprta: true,
      postninaCenti: 500,
      pragBrezplacnePostnineCenti: 5000,
      emailObvestil: "sandi@primer.si",
      navodilaZaPrevzem: "Pokličite nas za termin.",
    },
  });
  urednik = await payload.create({
    collection: "users",
    data: { ime: "Urednik", email: "urednik-narocila@teslan.test", password: "geslo-urednika-12", vloga: "urednik" },
  });
}, 60_000);

afterAll(async () => {
  await payload?.destroy();
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("oddaja ob prevzemu (Z30–Z32, Z43)", () => {
  it("ustvari naročilo s posnetkom, zmanjša zalogo in pošlje E1 in E2", async () => {
    const posiljanje = vi.spyOn(payload, "sendEmail");
    const r = uspesno(await oddaj([postavka(cesen, 2), postavka(cesen, 1, 1), postavka(jajca, 1)]));

    expect(r.stevilka).toBe("T-2026-0001");
    expect(r.zeton.length).toBeGreaterThanOrEqual(32);
    expect(r.pot).toBe(`/narocilo/T-2026-0001?k=${encodeURIComponent(r.zeton)}`);

    const n = await narocilo(r.id);
    expect(n).toMatchObject({
      status: "novo",
      placano: false,
      nacinDostave: "prevzem",
      nacinPlacila: "ob-prevzemu",
      kupec: { ime: "Ana", priimek: "Novak", email: "ana@primer.si", telefon: "040 123 456" },
      opomba: "Prevzem v soboto dopoldne.",
      vmesniSestevekCenti: 2500,
      postninaCenti: 0,
      skupajCenti: 2500,
      zalogaVrnjena: false,
    });
    expect(n.postavke.map((p) => [p.ime, p.velikost, p.kolicina, p.cenaCenti, p.stopnjaDDV])).toEqual([
      ["Česen v prahu", "41 ml", 2, 500, 9.5],
      ["Česen v prahu", "106 ml", 1, 1200, 9.5],
      ["Jajca kokošja", "10 kos", 1, 300, 9.5],
    ]);
    expect(n.ddv?.map((d) => [d.stopnja, d.osnovaCenti, d.ddvCenti])).toEqual([[9.5, 2283, 217]]);
    expect(n.soglasjePogoji).toBe(ZDAJ.toISOString());

    expect(await zaloga(cesen)).toBe(18);
    expect(await zaloga(cesen, 1)).toBe(19);
    expect(await zaloga(jajca)).toBe(19);

    expect(posiljanje).toHaveBeenCalledTimes(2);
    const [e1, e2] = posiljanje.mock.calls.map(([s]) => s);
    expect(e1).toMatchObject({ to: "ana@primer.si", replyTo: "sandi@primer.si", subject: expect.stringContaining("T-2026-0001") });
    expect(e1.text).toContain("To ni račun.");
    expect(e1.text).toContain("Pokličite nas za termin.");
    expect(e1.text).toContain(r.pot);
    expect(e2).toMatchObject({ to: "sandi@primer.si", replyTo: "ana@primer.si" });
    expect(e2.text).toContain(`/admin/collections/narocila/${r.id}`);
    expect(e2.text).toContain("Prevzem v soboto dopoldne.");
  });

  it("številke tečejo zaporedno po letu (Z31)", async () => {
    const drugo = uspesno(await oddaj([postavka(cesen)]));
    expect(drugo.stevilka).toBe("T-2026-0002");
    const novoLeto = uspesno(
      await oddajNarocilo(
        payload,
        { obrazec, kosarica: [postavka(cesen)] },
        // 31. 12. ob 23.30 UTC je v Ljubljani že novo leto.
        { kartica: false, zdaj: new Date("2026-12-31T23:30:00Z") },
      ),
    );
    expect(novoLeto.stevilka).toBe("T-2027-0001");
    expect(drugo.zeton).not.toBe(novoLeto.zeton);
  });

  it("žeton ni viden prek API (Z32)", async () => {
    const { docs } = await payload.find({ collection: "narocila", user: urednik, overrideAccess: false, limit: 1 });
    expect(docs[0].stevilka).toMatch(/^T-/);
    expect(docs[0]).not.toHaveProperty("zeton");
  });

  it("napaka pri pošiljanju e-pošte ne razveljavi naročila (Z59)", async () => {
    vi.spyOn(payload, "sendEmail").mockRejectedValue(new Error("strežnik ni dosegljiv"));
    vi.spyOn(payload.logger, "error").mockImplementation(() => undefined);
    const r = uspesno(await oddaj([postavka(cesen)]));
    const n = await narocilo(r.id);
    expect(n.status).toBe("novo");
    expect(n.napakaEposte).toContain("strežnik ni dosegljiv");
  });
});

describe("zavrnjene oddaje ne spremenijo ničesar (Z30)", () => {
  it("premajhna zaloga vrne seznam postavk s težavami", async () => {
    const prej = await zaloga(cesen);
    const steviloPrej = (await payload.count({ collection: "narocila" })).totalDocs;
    const r = await oddaj([postavka(cesen, 1), postavka(zadnjiKos, 2)]);
    expect(r).toMatchObject({
      ok: false,
      vrsta: "kosarica",
      tezave: [{ ime: "Zadnji kos, 1 kos", razlog: "Na zalogi je samo še 1 kos." }],
    });
    expect(await zaloga(cesen)).toBe(prej);
    expect(await zaloga(zadnjiKos)).toBe(1);
    expect((await payload.count({ collection: "narocila" })).totalDocs).toBe(steviloPrej);
  });

  it("neveljaven obrazec vrne napake po poljih (Z25)", async () => {
    const r = await oddaj([postavka(cesen)], {
      email: "ni-email",
      nacinDostave: "posta",
      nacinPlacila: "kartica",
      postnaStevilka: "83",
      soglasje: false,
    });
    expect(r).toMatchObject({
      ok: false,
      vrsta: "obrazec",
      napake: {
        email: expect.stringContaining("veljaven"),
        ulica: expect.any(String),
        postnaStevilka: expect.stringContaining("4 števke"),
        kraj: expect.any(String),
        soglasje: expect.stringContaining("splošnimi pogoji"),
      },
    });
  });

  it("pošta z izdelkom samo za prevzem in kartica brez Stripa sta zavrnjeni (Z22)", async () => {
    const posta = { nacinDostave: "posta", ulica: "Glavna 1", postnaStevilka: "8000", kraj: "Novo mesto" };
    expect(await oddaj([postavka(jajca)], { ...posta, nacinPlacila: "kartica" }, true)).toMatchObject({
      ok: false,
      vrsta: "zavrnjeno",
      sporocilo: expect.stringContaining("Jajca kokošja"),
    });
    expect(await oddaj([postavka(cesen)], { ...posta, nacinPlacila: "ob-prevzemu" }, true)).toMatchObject({
      ok: false,
      sporocilo: "Pri pošiljanju po pošti je mogoče plačati samo s kartico.",
    });
    expect(await oddaj([postavka(cesen)], { nacinPlacila: "kartica" })).toMatchObject({
      ok: false,
      sporocilo: expect.stringContaining("Plačilo s kartico trenutno ni mogoče"),
    });
  });

  it("prazna ali neveljavna košarica je zavrnjena", async () => {
    expect(await oddaj([])).toMatchObject({ ok: false, sporocilo: "Košarica je prazna." });
    expect(await oddaj([{ izdelekId: 999_999, velikostId: "x", kolicina: 1 }])).toMatchObject({
      ok: false,
      vrsta: "kosarica",
      tezave: [{ razlog: "Izdelka ni več v ponudbi." }],
    });
  });

  it("zaprta trgovina zavrne naročilo (Z27, S15)", async () => {
    await payload.updateGlobal({ slug: "nastavitve-trgovine", data: { trgovinaOdprta: false } });
    try {
      const prej = await zaloga(cesen);
      expect(await oddaj([postavka(cesen)])).toEqual({ ok: false, vrsta: "zavrnjeno", sporocilo: SPOROCILO_ZAPRTA_TRGOVINA });
      expect(await zaloga(cesen)).toBe(prej);
    } finally {
      await payload.updateGlobal({ slug: "nastavitve-trgovine", data: { trgovinaOdprta: true } });
    }
  });
});

describe("sočasnost (S6)", () => {
  it("dve hkratni naročili za zadnji kos: uspe natanko eno, zaloga ne pade pod 0", async () => {
    const rezultati = await Promise.all([
      oddaj([postavka(zadnjiKos)], { ime: "Prvi" }),
      oddaj([postavka(zadnjiKos)], { ime: "Drugi" }),
      oddaj([postavka(zadnjiKos)], { ime: "Tretji" }),
    ]);
    expect(rezultati.filter((r) => r.ok)).toHaveLength(1);
    expect(rezultati.filter((r) => !r.ok)).toEqual([
      expect.objectContaining({ vrsta: "kosarica" }),
      expect.objectContaining({ vrsta: "kosarica" }),
    ]);
    expect(await zaloga(zadnjiKos)).toBe(0);
  });
});

describe("statusi in preklic v adminu (Z33–Z35, S5, S7)", () => {
  let n: Narocila;
  const posodobi = (data: Partial<Narocila>, id = n.id) =>
    payload.update({ collection: "narocila", id, data, user: urednik, overrideAccess: false });

  beforeAll(async () => {
    vi.spyOn(payload, "sendEmail").mockResolvedValue(undefined);
    n = await narocilo(uspesno(await oddaj([postavka(cesen, 3)])).id);
  });

  it("nedovoljen prehod je zavrnjen z razlogom (S5)", async () => {
    expect(await napaka(posodobi({ status: "zakljuceno" }))).toMatch(/Iz statusa „Novo“ ni mogoče preiti v „Zaključeno“/);
    expect(await napaka(posodobi({ status: "poslano" }))).toMatch(/prevzame na kmetiji/);
    expect((await narocilo(n.id)).status).toBe("novo");
  });

  it("urednik spremeni le dovoljena polja; posnetek ostane (Z35)", async () => {
    const posodobljeno = await posodobi({
      status: "pripravljeno",
      placano: true,
      internaOpomba: "Pripravljeno v hladilniku.",
      skupajCenti: 1,
      kupec: { ime: "Vsiljeno", priimek: "X", email: "x@x.si", telefon: "1" },
    });
    expect(posodobljeno).toMatchObject({
      status: "pripravljeno",
      placano: true,
      internaOpomba: "Pripravljeno v hladilniku.",
      skupajCenti: 1500,
      kupec: { ime: "Ana" },
    });
  });

  it("naročila ni mogoče izbrisati ne ustvariti v adminu (Z35)", async () => {
    await expect(
      payload.delete({ collection: "narocila", id: n.id, user: urednik, overrideAccess: false }),
    ).rejects.toThrow();
    await expect(
      payload.create({
        collection: "narocila",
        data: (await narocilo(n.id)) as never,
        user: urednik,
        overrideAccess: false,
      }),
    ).rejects.toThrow();
  });

  it("preklic dvakrat zapored vrne zalogo enkrat (Z34, S7)", async () => {
    const prej = await zaloga(cesen);
    await posodobi({ status: "preklicano", razlogPreklica: "Kupec je odpovedal." });
    expect(await zaloga(cesen)).toBe((prej ?? 0) + 3);
    await posodobi({ status: "preklicano", internaOpomba: "Ponovno shranjeno." });
    await posodobi({ internaOpomba: "Še enkrat." });
    expect(await zaloga(cesen)).toBe((prej ?? 0) + 3);
    expect(await narocilo(n.id)).toMatchObject({ status: "preklicano", zalogaVrnjena: true, razlogPreklica: "Kupec je odpovedal." });
    expect(await napaka(posodobi({ status: "novo" }))).toMatch(/Status je končen/);
  });

  it("hkratna preklica vrneta zalogo enkrat", async () => {
    const drugo = await narocilo(uspesno(await oddaj([postavka(cesen, 2)])).id);
    const prej = await zaloga(cesen);
    await Promise.allSettled([posodobi({ status: "preklicano" }, drugo.id), posodobi({ status: "preklicano" }, drugo.id)]);
    expect(await zaloga(cesen)).toBe((prej ?? 0) + 2);
  });
});
