import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Izdelki, User } from "@/payload-types";
import { IZDELKI, KATEGORIJE, SKUPINE, ZACETNA_ZALOGA } from "@/seed/podatki";
import { seed } from "@/seed/seed";
import { payloadNaCistiBazi } from "@/test/payload";

/**
 * Integracija s Postgres (K4): seed, pravila izdelka, dostop do kataloga in
 * nastavitev trgovine. Operacije v imenu uporabnika tečejo z
 * `overrideAccess: false`, torej z enakimi pravili kot v adminu in REST API.
 */

let payload: Payload;
let admin: User;
let urednik: User;
let kategorijaId: number;
const tiho = () => {};

/** Besedilo napake z vsemi sporočili validacije polj (Payload jih da v `data.errors`). */
async function napaka(obljuba: Promise<unknown>): Promise<string> {
  try {
    await obljuba;
  } catch (e) {
    const napaka = e as { message: string; data?: { errors?: Array<{ message: string }> } };
    return [napaka.message, ...(napaka.data?.errors ?? []).map((n) => n.message)].join(" | ");
  }
  throw new Error("Pričakovana je bila napaka, operacija pa je uspela.");
}

beforeAll(async () => {
  payload = await payloadNaCistiBazi();
}, 60_000);

afterAll(async () => {
  await payload?.delete({ collection: "media", where: { id: { exists: true } } });
  await payload?.destroy();
});

describe("seed (§6)", () => {
  it("prazno bazo napolni s katalogom, nastavitvami in administratorjem", async () => {
    const porocilo = await seed(payload, {
      nacin: "ce-prazno",
      admin: { email: "seed-admin@teslan.test", geslo: "geslo-seed-admina-1" },
      log: tiho,
    });
    expect(porocilo).toMatchObject({
      admin: "ustvarjen",
      katalog: "dopolnjen",
      nastavitve: "ustvarjene",
      ustvarjeno: { kategorije: KATEGORIJE.length, skupine: SKUPINE.length, izdelki: IZDELKI.length },
    });
    expect(IZDELKI).toHaveLength(25);

    const { docs: uporabniki } = await payload.find({ collection: "users" });
    expect(uporabniki).toHaveLength(1);
    expect(uporabniki[0]).toMatchObject({ email: "seed-admin@teslan.test", vloga: "admin" });
    admin = uporabniki[0];

    const nastavitve = await payload.findGlobal({ slug: "nastavitve-trgovine" });
    expect(nastavitve).toMatchObject({
      trgovinaOdprta: true,
      postninaCenti: 500,
      pragBrezplacnePostnineCenti: 5000,
      emailObvestil: "sandi.dercar@gmail.com",
      prodajalec: { telefon: "040 578 512", naslov: "Podgora 15, 8351 Straža pri Novem mestu" },
    });
  }, 60_000);

  it("izdelki imajo načine prodaje, sezone, zalogo in DDV po tabeli (P2–P6, P12)", async () => {
    const najdi = async (slug: string) =>
      (await payload.find({ collection: "izdelki", where: { slug: { equals: slug } }, depth: 1 }))
        .docs[0];

    const sparglji = await najdi("sparglji");
    expect(sparglji).toMatchObject({
      ime: "Šparglji",
      objavljen: true,
      izpostavljen: true,
      nacinProdaje: "samo-prevzem",
      sezona: { od: "4", do: "6" },
      stopnjaDDV: "9.5",
      primernoZaDarilo: false,
      skupnaZaloga: ZACETNA_ZALOGA,
    });
    expect(sparglji.velikosti).toMatchObject([
      { oznaka: "šopek 0,5 kg", cenaCenti: 550, zaloga: ZACETNA_ZALOGA },
    ]);
    expect((sparglji.kategorija as { ime: string }).ime).toBe("Sveža zelenjava");
    expect(sparglji.slike).toHaveLength(1);

    const jagode = await najdi("jagode");
    expect(jagode).toMatchObject({ nacinProdaje: "samo-prikaz", izpostavljen: true });
    expect(jagode.velikosti[0]).toMatchObject({ cenaCenti: null, zaloga: null });

    const olje = await najdi("bucno-olje");
    expect(olje).toMatchObject({ nacinProdaje: "posta-in-prevzem", primernoZaDarilo: true });
    expect(olje.velikosti.map((v) => [v.oznaka, v.cenaCenti])).toEqual([
      ["1 L", 2000],
      ["0,5 L", 1200],
    ]);
    expect(olje.skupnaZaloga).toBe(2 * ZACETNA_ZALOGA);

    const jajca = await payload.find({
      collection: "izdelki",
      where: { "kategorija.slug": { equals: "jajca" } },
    });
    expect(jajca.docs.map((d) => d.nacinProdaje)).toEqual([
      "samo-prevzem",
      "samo-prevzem",
      "samo-prevzem",
    ]);

    const skupina = (
      await payload.find({
        collection: "skupine-ponudbe",
        where: { ime: { equals: "Sveže z njive" } },
        depth: 1,
      })
    ).docs[0];
    expect((skupina.kategorije ?? []).map((k) => (k as { slug: string }).slug)).toEqual([
      "sveza-zelenjava",
      "sveze-iz-sezone",
    ]);
  });

  it("ponovni seed ničesar ne podvoji in ne povozi sprememb lastnika", async () => {
    const sparglji = (
      await payload.find({ collection: "izdelki", where: { slug: { equals: "sparglji" } } })
    ).docs[0];
    await payload.update({
      collection: "izdelki",
      id: sparglji.id,
      data: { ime: "Šparglji (urejeno)" },
    });

    const porocilo = await seed(payload, {
      nacin: "dopolni",
      admin: { email: "drugi@teslan.test", geslo: "geslo-drugega-12" },
      log: tiho,
    });
    expect(porocilo).toMatchObject({
      admin: "obstaja",
      nastavitve: "obstajajo",
      ustvarjeno: { kategorije: 0, skupine: 0, izdelki: 0, slike: 0 },
    });
    expect((await payload.count({ collection: "izdelki" })).totalDocs).toBe(IZDELKI.length);
    expect((await payload.count({ collection: "users" })).totalDocs).toBe(1);
    expect((await payload.findByID({ collection: "izdelki", id: sparglji.id })).ime).toBe(
      "Šparglji (urejeno)",
    );
  }, 60_000);

  it("seed:if-empty ne vrne izbrisanih izdelkov, seed jih dopolni", async () => {
    const redkvica = (
      await payload.find({ collection: "izdelki", where: { slug: { equals: "redkvica" } } })
    ).docs[0];
    await payload.delete({ collection: "izdelki", id: redkvica.id });

    const obDeployu = await seed(payload, { nacin: "ce-prazno", log: tiho });
    expect(obDeployu.katalog).toBe("preskocen");
    expect((await payload.count({ collection: "izdelki" })).totalDocs).toBe(IZDELKI.length - 1);

    const rocno = await seed(payload, { nacin: "dopolni", log: tiho });
    expect(rocno.ustvarjeno.izdelki).toBe(1);
    expect((await payload.count({ collection: "izdelki" })).totalDocs).toBe(IZDELKI.length);
  }, 60_000);
});

describe("pravila izdelka v adminu (Z10–Z12, Z52)", () => {
  beforeAll(async () => {
    urednik = await payload.create({
      collection: "users",
      data: {
        ime: "Sandi Urednik",
        email: "urednik@teslan.test",
        password: "geslo-urednika-123",
        vloga: "urednik",
      },
      user: admin,
      overrideAccess: false,
    });
    kategorijaId = (
      await payload.find({ collection: "kategorije", where: { slug: { equals: "zacimbe" } } })
    ).docs[0].id;
  });

  const ustvari = (data: Partial<Izdelki>) =>
    payload.create({
      collection: "izdelki",
      data: {
        ime: "Testni izdelek",
        kategorija: kategorijaId,
        nacinProdaje: "posta-in-prevzem",
        stopnjaDDV: "9.5",
        velikosti: [{ oznaka: "100 g", cenaCenti: 500, zaloga: 3 }],
        ...data,
      } as Izdelki,
      user: urednik,
      overrideAccess: false,
    });

  it("urednik ustvari izdelek; slug se ustvari iz imena, privzeto neobjavljen", async () => {
    const izdelek = await ustvari({ ime: "Čebulna sol" });
    expect(izdelek.slug).toBe("cebulna-sol");
    expect(izdelek.objavljen).toBe(false);
    expect(izdelek.skupnaZaloga).toBe(3);
  });

  it("slug je unikaten", async () => {
    await expect(ustvari({ ime: "Čebulna sol" })).rejects.toThrow();
  });

  it("izdelek potrebuje vsaj eno velikost", async () => {
    await expect(ustvari({ ime: "Brez velikosti", velikosti: [] })).rejects.toThrow(/Velikosti/);
  });

  it("naročljiv izdelek potrebuje ceno in zalogo, samo-prikaz ne (Z11)", async () => {
    expect(
      await napaka(ustvari({ ime: "Brez cene", velikosti: [{ oznaka: "1 kos", zaloga: 1 }] })),
    ).toMatch(/ceno v centih/);
    expect(
      await napaka(ustvari({ ime: "Brez zaloge", velikosti: [{ oznaka: "1 kos", cenaCenti: 100 }] })),
    ).toMatch(/zalogo/);
    expect(
      await napaka(
        ustvari({
          ime: "Decimalna cena",
          velikosti: [{ oznaka: "1 kos", cenaCenti: 5.5, zaloga: 1 }],
        }),
      ),
    ).toMatch(/celo število centov/);

    const prikaz = await ustvari({
      ime: "Sveže maline",
      nacinProdaje: "samo-prikaz",
      velikosti: [{ oznaka: "sveže" }],
    });
    expect(prikaz.velikosti[0]).toMatchObject({ cenaCenti: null, zaloga: null });

    // Sprememba načina prodaje se preveri z obstoječimi velikostmi.
    expect(
      await napaka(
        payload.update({
          collection: "izdelki",
          id: prikaz.id,
          data: { nacinProdaje: "samo-prevzem" },
          user: urednik,
          overrideAccess: false,
        }),
      ),
    ).toMatch(/ceno v centih/);
  });

  it("primernoZaDarilo je dovoljeno le pri pošti in prevzemu (Z52)", async () => {
    expect(
      await napaka(
        ustvari({ ime: "Jajca darilo", nacinProdaje: "samo-prevzem", primernoZaDarilo: true }),
      ),
    ).toMatch(/Pošta in prevzem/);
    const ok = await ustvari({ ime: "Darilni čaj", primernoZaDarilo: true });
    expect(ok.primernoZaDarilo).toBe(true);
    expect(
      await napaka(
        payload.update({
          collection: "izdelki",
          id: ok.id,
          data: { nacinProdaje: "samo-prevzem" },
          user: urednik,
          overrideAccess: false,
        }),
      ),
    ).toMatch(/Pošta in prevzem/);
  });

  it("sezona potrebuje oba meseca (Z12)", async () => {
    expect(await napaka(ustvari({ ime: "Pol sezone", sezona: { od: "4" } }))).toMatch(
      /oba meseca/,
    );
    const zima = await ustvari({ ime: "Zimski čaj", sezona: { od: "11", do: "2" } });
    expect(zima.sezona).toEqual({ od: "11", do: "2" });
  });

  it("kratek opis ima največ 160 znakov", async () => {
    await expect(ustvari({ ime: "Dolg opis", kratekOpis: "x".repeat(161) })).rejects.toThrow();
  });

  it("kategorije z izdelki ni mogoče izbrisati", async () => {
    await expect(
      payload.delete({
        collection: "kategorije",
        id: kategorijaId,
        user: urednik,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/premaknite v drugo kategorijo/);
    const prazna = await payload.create({
      collection: "kategorije",
      data: { ime: "Prazna kategorija", vrstniRed: 0 },
      user: urednik,
      overrideAccess: false,
    });
    expect(prazna.slug).toBe("prazna-kategorija");
    await payload.delete({
      collection: "kategorije",
      id: prazna.id,
      user: urednik,
      overrideAccess: false,
    });
  });
});

describe("dostop do kataloga in nastavitev (Z14, Z80)", () => {
  it("javnost vidi le objavljene izdelke, urednik vse", async () => {
    const javno = await payload.find({
      collection: "izdelki",
      overrideAccess: false,
      pagination: false,
    });
    expect(javno.docs.every((d) => d.objavljen)).toBe(true);
    expect(javno.totalDocs).toBe(IZDELKI.length);

    const vse = await payload.find({
      collection: "izdelki",
      user: urednik,
      overrideAccess: false,
      pagination: false,
    });
    expect(vse.totalDocs).toBeGreaterThan(IZDELKI.length);

    const neobjavljen = vse.docs.find((d) => !d.objavljen);
    await expect(
      payload.findByID({ collection: "izdelki", id: neobjavljen!.id, overrideAccess: false }),
    ).rejects.toThrow();
  });

  it("javnost izdelkov in kategorij ne more spreminjati", async () => {
    await expect(
      payload.create({
        collection: "kategorije",
        data: { ime: "Vsiljena", vrstniRed: 0 },
        overrideAccess: false,
      }),
    ).rejects.toThrow();
  });

  it("nastavitve trgovine bere in ureja samo admin", async () => {
    await expect(
      payload.findGlobal({ slug: "nastavitve-trgovine", user: urednik, overrideAccess: false }),
    ).rejects.toThrow();
    await expect(
      payload.findGlobal({ slug: "nastavitve-trgovine", overrideAccess: false }),
    ).rejects.toThrow();
    await expect(
      payload.updateGlobal({
        slug: "nastavitve-trgovine",
        data: { trgovinaOdprta: false },
        user: urednik,
        overrideAccess: false,
      }),
    ).rejects.toThrow();

    const posodobljeno = await payload.updateGlobal({
      slug: "nastavitve-trgovine",
      data: { postninaCenti: 450 },
      user: admin,
      overrideAccess: false,
    });
    expect(posodobljeno.postninaCenti).toBe(450);
    expect(posodobljeno.trgovinaOdprta).toBe(true);

    expect(
      await napaka(
        payload.updateGlobal({
          slug: "nastavitve-trgovine",
          data: { postninaCenti: 4.5 },
          user: admin,
          overrideAccess: false,
        }),
      ),
    ).toMatch(/celo število centov/);
  });
});
