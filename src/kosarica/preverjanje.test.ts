import { describe, expect, it } from "vitest";
import type { IzdelekPogled } from "@/katalog/podatki";
import type { PostavkaKosarice } from "./postavke";
import { preveriKosarico } from "./preverjanje";

function izdelek(del: Partial<IzdelekPogled> & Pick<IzdelekPogled, "id" | "ime">): IzdelekPogled {
  return {
    slug: del.ime.toLowerCase().replace(/\s+/g, "-"),
    izpostavljen: false,
    kategorija: { id: 1, ime: "Začimbe", slug: "zacimbe" },
    kratekOpis: null,
    opis: null,
    sestavine: null,
    alergeni: null,
    slike: [],
    nacinProdaje: "posta-in-prevzem",
    sezona: null,
    stopnjaDDV: 9.5,
    primernoZaDarilo: true,
    velikosti: [{ id: "v1", oznaka: "1 kos", cenaCenti: 500, zaloga: 20 }],
    ...del,
  };
}

const katalog: IzdelekPogled[] = [
  izdelek({
    id: 1,
    ime: "Česen v prahu",
    velikosti: [
      { id: "c41", oznaka: "41 ml", cenaCenti: 500, zaloga: 20 },
      { id: "c106", oznaka: "106 ml", cenaCenti: 1200, zaloga: 2 },
      { id: "c0", oznaka: "200 ml", cenaCenti: 2000, zaloga: 0 },
    ],
  }),
  izdelek({ id: 2, ime: "Jajca kokošja", nacinProdaje: "samo-prevzem", velikosti: [{ id: "j10", oznaka: "10 kos", cenaCenti: 300, zaloga: 20 }] }),
  izdelek({ id: 3, ime: "Jagode", nacinProdaje: "samo-prikaz", velikosti: [{ id: "jg", oznaka: "1 kg", cenaCenti: null, zaloga: null }] }),
  izdelek({ id: 4, ime: "Šparglji", nacinProdaje: "samo-prevzem", sezona: { od: 4, do: 6 } }),
  izdelek({ id: 5, ime: "Bučno olje", velikosti: [{ id: "b1", oznaka: "1 L", cenaCenti: 2000, zaloga: 20 }] }),
];

const nastavitve = { trgovinaOdprta: true, postninaCenti: 500, pragBrezplacnePostnineCenti: 5000 };
const JANUAR = 1;
const MAJ = 5;

const p = (izdelekId: number, velikostId: string, kolicina = 1): PostavkaKosarice => ({ izdelekId, velikostId, kolicina });

describe("strežniško preverjanje košarice (Z21)", () => {
  it("izračuna cene in vmesni seštevek iz kataloga, ne iz brskalnika", () => {
    const pregled = preveriKosarico([p(1, "c41", 2), p(5, "b1")], katalog, nastavitve, JANUAR);
    expect(pregled.postavke.map((x) => [x.izdelek?.ime, x.velikost, x.cenaCenti, x.skupajCenti, x.tezava])).toEqual([
      ["Česen v prahu", "41 ml", 500, 1000, null],
      ["Bučno olje", "1 L", 2000, 2000, null],
    ]);
    expect(pregled.vmesniSestevekCenti).toBe(3000);
    expect(pregled.steviloKosov).toBe(3);
    expect(pregled.ddv).toEqual([{ stopnja: 9.5, osnovaCenti: 2740, ddvCenti: 260 }]);
    expect(pregled.dostava).toMatchObject({
      postaDovoljena: true,
      postninaCenti: 500,
      doBrezplacnePostnineCenti: 2000,
    });
    expect(pregled.imaTezave).toBe(false);
    expect(pregled.lahkoNaBlagajno).toBe(true);
  });

  it("nad pragom je poštnina 0 (Z23)", () => {
    const pregled = preveriKosarico([p(5, "b1", 3)], katalog, nastavitve, JANUAR);
    expect(pregled.dostava.postninaCenti).toBe(0);
    expect(pregled.dostava.doBrezplacnePostnineCenti).toBe(0);
  });

  it("nedosegljive postavke označi z razlogom in jih ne šteje", () => {
    const pregled = preveriKosarico(
      [p(1, "c41"), p(99, "x"), p(1, "ne-obstaja"), p(1, "c0"), p(3, "jg"), p(4, "v1")],
      katalog,
      nastavitve,
      JANUAR,
    );
    const tezave = pregled.postavke.map((x) => x.tezava && [x.tezava.vrsta, x.tezava.razlog]);
    expect(tezave).toEqual([
      null,
      ["nedosegljivo", "Izdelka ni več v ponudbi."],
      ["nedosegljivo", "Te velikosti ni več v ponudbi."],
      ["nedosegljivo", "Izdelka ni več na zalogi."],
      ["nedosegljivo", "Tega izdelka ni mogoče naročiti prek spleta."],
      ["nedosegljivo", "Izdelek ta čas ni v sezoni (april — junij)."],
    ]);
    expect(pregled.postavke.slice(1).every((x) => x.skupajCenti === null && x.cenaCenti === null)).toBe(true);
    expect(pregled.vmesniSestevekCenti).toBe(500);
    expect(pregled.steviloKosov).toBe(1);
    expect(pregled.imaTezave).toBe(true);
    expect(pregled.lahkoNaBlagajno).toBe(false);
    // Nedosegljivi šparglji ne onemogočijo pošte, ker jih mora kupec odstraniti.
    expect(pregled.dostava.postaDovoljena).toBe(true);
  });

  it("mesec pred sezono pove, da se sezona še ni začela", () => {
    const [sparglji] = preveriKosarico([p(4, "v1")], katalog, nastavitve, 3).postavke;
    expect(sparglji.tezava?.razlog).toBe("Sezona tega izdelka se še ni začela.");
    expect(preveriKosarico([p(4, "v1")], katalog, nastavitve, MAJ).postavke[0].tezava).toBeNull();
  });

  it("količina nad zalogo je težava s predlogom popravka", () => {
    const pregled = preveriKosarico([p(1, "c106", 5)], katalog, nastavitve, JANUAR);
    expect(pregled.postavke[0].tezava).toEqual({
      vrsta: "kolicina",
      razlog: "Na zalogi sta samo še 2 kosa.",
      najvecKosov: 2,
    });
    expect(pregled.postavke[0].cenaCenti).toBe(1200);
    expect(pregled.lahkoNaBlagajno).toBe(false);
    expect(preveriKosarico([p(1, "c106", 2)], katalog, nastavitve, JANUAR).lahkoNaBlagajno).toBe(true);
  });

  it("izdelek samo-prevzem onemogoči pošto (T4)", () => {
    const pregled = preveriKosarico([p(1, "c41"), p(2, "j10")], katalog, nastavitve, JANUAR);
    expect(pregled.dostava.postaDovoljena).toBe(false);
    expect(pregled.dostava.samoPrevzem).toEqual(["Jajca kokošja"]);
    expect(pregled.lahkoNaBlagajno).toBe(true);
  });

  it("zaprta trgovina ne dovoli na blagajno (Z27)", () => {
    const pregled = preveriKosarico([p(1, "c41")], katalog, { ...nastavitve, trgovinaOdprta: false }, JANUAR);
    expect(pregled.trgovinaOdprta).toBe(false);
    expect(pregled.lahkoNaBlagajno).toBe(false);
  });

  it("prazna košarica ne gre na blagajno", () => {
    const pregled = preveriKosarico([], katalog, nastavitve, JANUAR);
    expect(pregled.postavke).toEqual([]);
    expect(pregled.vmesniSestevekCenti).toBe(0);
    expect(pregled.lahkoNaBlagajno).toBe(false);
  });
});
