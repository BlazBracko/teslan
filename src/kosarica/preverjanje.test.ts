import { describe, expect, it } from "vitest";
import type { IzdelekPogled } from "@/katalog/podatki";
import type { PostavkaKosarice, PostavkaSkatle } from "./postavke";
import { imePostavke, preveriKosarico, type PostavkaIzdelkaPregled, type PostavkaSkatlePregled } from "./preverjanje";

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
    const vrstice = pregled.postavke as PostavkaIzdelkaPregled[];
    expect(vrstice.map((x) => [x.izdelek?.ime, x.velikost, x.cenaCenti, x.skupajCenti, x.tezava])).toEqual([
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

describe("darilna škatla v košarici (K10: Z53, P6–P8)", () => {
  const tipi = [
    { id: 1, ime: "Mala darilna škatla", opis: null, slika: null, steviloMest: 3, cenaCenti: 500, zaloga: 2, aktiven: true },
    { id: 2, ime: "Stara škatla", opis: null, slika: null, steviloMest: 6, cenaCenti: 800, zaloga: 5, aktiven: false },
  ];
  const darila = { tipi, programi: [{ slug: "okusi-dolenjske", ime: "Okusi Dolenjske" }] };
  const skatla = (vsebina: Array<[number, string, number]>, del: Partial<PostavkaSkatle> = {}): PostavkaSkatle => ({
    vrsta: "skatla",
    id: "s1",
    tipSkatleId: 1,
    vsebina: vsebina.map(([izdelekId, velikostId, kolicina]) => ({ izdelekId, velikostId, kolicina })),
    kolicina: 1,
    ...del,
  });
  const prva = (pregled: ReturnType<typeof preveriKosarico>) => pregled.postavke[0] as PostavkaSkatlePregled;

  it("cena je škatla + izdelki, DDV škatle 22 %, izdelkov po njihovi stopnji (P5, P8)", () => {
    const pregled = preveriKosarico(
      [skatla([[1, "c41", 1], [5, "b1", 1]], { program: "okusi-dolenjske", sporocilo: "Vse najboljše!" })],
      katalog,
      nastavitve,
      JANUAR,
      darila,
    );
    const s = prva(pregled);
    expect(s.tezava).toBeNull();
    expect(s.cenaCenti).toBe(500);
    expect(s.cenaSkatleCenti).toBe(500 + 500 + 2000);
    expect(s.skupajCenti).toBe(3000);
    expect(s.program).toEqual({ slug: "okusi-dolenjske", ime: "Okusi Dolenjske" });
    expect(imePostavke(s)).toBe("Mala darilna škatla: Okusi Dolenjske");
    expect(s.sporocilo).toBe("Vse najboljše!");
    expect(s.vsebina.map((v) => [v.ime, v.velikost, v.cenaCenti])).toEqual([
      ["Česen v prahu", "41 ml", 500],
      ["Bučno olje", "1 L", 2000],
    ]);
    expect(pregled.vmesniSestevekCenti).toBe(3000);
    expect(pregled.ddv).toEqual([
      { stopnja: 9.5, osnovaCenti: 2283, ddvCenti: 217 },
      { stopnja: 22, osnovaCenti: 410, ddvCenti: 90 },
    ]);
    expect(pregled.imaSkatlo).toBe(true);
    // Škatla je vedno primerna za pošto (P6).
    expect(pregled.dostava.postaDovoljena).toBe(true);
    expect(pregled.lahkoNaBlagajno).toBe(true);
  });

  it("več enakih škatel: zaloga škatle in vsebine se množi s količino", () => {
    const s = prva(preveriKosarico([skatla([[1, "c106", 1]], { kolicina: 3 })], katalog, nastavitve, JANUAR, darila));
    // Škatel je 2, česna 106 ml tudi 2.
    expect(s.tezava).toEqual({ vrsta: "kolicina", razlog: "Na zalogi je dovolj samo za 2 škatli.", najvecKosov: 2 });
    expect(s.skupajCenti).toBe(3 * (500 + 1200));
  });

  it("ista velikost samostojno in v škatli si deli zalogo", () => {
    const pregled = preveriKosarico([skatla([[1, "c106", 2]]), p(1, "c106", 1)], katalog, nastavitve, JANUAR, darila);
    expect(pregled.postavke[0].tezava).toBeNull();
    expect(pregled.postavke[1].tezava).toEqual({
      vrsta: "nedosegljivo",
      razlog: "Vse kose, ki so na zalogi, ste že dali v darilno škatlo v košarici.",
    });
  });

  it("škatla z neprimernim, izdelkom izven sezone ali brez zaloge se mora urediti (Z53)", () => {
    const jajca = prva(preveriKosarico([skatla([[2, "j10", 1]])], katalog, nastavitve, JANUAR, darila));
    expect(jajca.tezava?.vrsta).toBe("nedosegljivo");
    expect(jajca.vsebina[0].tezava).toBe("Izdelka ni več mogoče dati v darilno škatlo.");
    expect(jajca.skupajCenti).toBeNull();

    const brezZaloge = prva(preveriKosarico([skatla([[1, "c0", 1]])], katalog, nastavitve, JANUAR, darila));
    expect(brezZaloge.vsebina[0].tezava).toBe("Izdelka ni več na zalogi.");
    expect(brezZaloge.tezava?.razlog).toBe("Česen v prahu ni več mogoče naročiti. Uredite škatlo ali jo odstranite.");

    const neznan = prva(preveriKosarico([skatla([[99, "x", 1]])], katalog, nastavitve, JANUAR, darila));
    expect(neznan.vsebina[0]).toMatchObject({ ime: null, tezava: "Izdelka ni več v ponudbi." });
  });

  it("več kosov, kot ima škatla mest, ali neaktivna škatla: postavke ni mogoče oddati (P7)", () => {
    const polna = prva(preveriKosarico([skatla([[1, "c41", 2], [5, "b1", 2]])], katalog, nastavitve, JANUAR, darila));
    expect(polna.tezava).toEqual({ vrsta: "nedosegljivo", razlog: "V škatli je več izdelkov, kot ima mest. Uredite škatlo." });

    const stara = preveriKosarico([skatla([[1, "c41", 1]], { tipSkatleId: 2 })], katalog, nastavitve, JANUAR, darila);
    expect(prva(stara).tezava?.razlog).toBe("Te darilne škatle ni več v ponudbi.");
    expect(stara.imaSkatlo).toBe(false);
    expect(stara.lahkoNaBlagajno).toBe(false);
  });

  it("škatla brez zaloge škatel", () => {
    const pregled = preveriKosarico(
      [skatla([[1, "c41", 1]], { kolicina: 2 }), skatla([[1, "c41", 1]], { id: "s2" })],
      katalog,
      nastavitve,
      JANUAR,
      darila,
    );
    expect(pregled.postavke[0].tezava).toBeNull();
    expect(pregled.postavke[1].tezava).toEqual({ vrsta: "nedosegljivo", razlog: "Te darilne škatle ni več na zalogi." });
  });
});
