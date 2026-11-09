import { describe, expect, it } from "vitest";
import type { IzdelekPogled } from "@/katalog/pogled";
import {
  cenaSkatle,
  dodajKos,
  izdelkiZaSkatlo,
  najvecKosa,
  nastaviKolicinoKosa,
  prilagodiVsebino,
  vsebinaZaPrikaz,
} from "./konfigurator";
import { poisciVelikost, preveriProgram, zdruziVsebino, type IzdelekZaDarilo } from "./pravila";

function izdelek(del: Partial<IzdelekPogled> & Pick<IzdelekPogled, "id" | "ime">): IzdelekPogled {
  return {
    slug: del.ime.toLowerCase(),
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
    velikosti: [{ id: `v${del.id}`, oznaka: "1 kos", cenaCenti: 500, zaloga: 20 }],
    ...del,
  };
}

const katalog = [
  izdelek({
    id: 1,
    ime: "Česen v prahu",
    velikosti: [
      { id: "c41", oznaka: "41 ml (15 g)", cenaCenti: 500, zaloga: 2 },
      { id: "c106", oznaka: "106 ml (40 g)", cenaCenti: 1200, zaloga: 0 },
    ],
  }),
  izdelek({ id: 2, ime: "Jajca", nacinProdaje: "samo-prevzem", primernoZaDarilo: false }),
  izdelek({ id: 3, ime: "Jagodna marmelada", sezona: { od: 5, do: 7 } }),
  izdelek({ id: 4, ime: "Bučno olje", velikosti: [{ id: "b05", oznaka: "0,5 L", cenaCenti: 1200, zaloga: 20 }] }),
];
const JANUAR = 1;
const izdelki = izdelkiZaSkatlo(katalog, JANUAR);

describe("izbira izdelkov v konfiguratorju (Z52, Z53, S12)", () => {
  it("neprimerni izdelki niso na izbiro; izven sezone in brez zaloge so vidni, a jih ni mogoče dodati", () => {
    expect(izdelki.map((i) => i.ime)).toEqual(["Česen v prahu", "Jagodna marmelada", "Bučno olje"]);
    expect(izdelki[0].velikosti.map((v) => [v.oznaka, v.narocljiva, v.oznakaRazpolozljivosti])).toEqual([
      ["41 ml (15 g)", true, "Še 2 kosa"],
      ["106 ml (40 g)", false, "Ni na zalogi"],
    ]);
    expect(izdelki[1].velikosti[0]).toMatchObject({ narocljiva: false, oznakaRazpolozljivosti: "Sezona Maj — julij" });
  });

  it("ne doda več kosov, kot ima škatla mest ali kot je zaloge (P7)", () => {
    let v = dodajKos([], { izdelekId: 4, velikostId: "b05" }, 3, 20);
    v = dodajKos(v, { izdelekId: 1, velikostId: "c41" }, 3, 2);
    v = dodajKos(v, { izdelekId: 1, velikostId: "c41" }, 3, 2);
    expect(v).toEqual([
      { izdelekId: 4, velikostId: "b05", kolicina: 1 },
      { izdelekId: 1, velikostId: "c41", kolicina: 2 },
    ]);
    // Škatla je polna.
    expect(dodajKos(v, { izdelekId: 4, velikostId: "b05" }, 3, 20)).toEqual(v);
    // Zaloga česna je porabljena, čeprav je prostora še dovolj.
    expect(dodajKos(v, { izdelekId: 1, velikostId: "c41" }, 6, 2)).toEqual(v);

    expect(najvecKosa(v, v[0], 3, 20)).toBe(1);
    expect(najvecKosa(v, v[0], 6, 20)).toBe(4);
    expect(nastaviKolicinoKosa(v, "4:b05", 10, 6, 20)).toEqual([
      { izdelekId: 4, velikostId: "b05", kolicina: 4 },
      v[1],
    ]);
    expect(nastaviKolicinoKosa(v, "4:b05", 0, 6, 20)).toEqual([v[1]]);
  });

  it("cena škatle je cena škatle in izdelkov (P8)", () => {
    const v = vsebinaZaPrikaz(
      [
        { izdelekId: 1, velikostId: "c41", kolicina: 2 },
        { izdelekId: 4, velikostId: "b05", kolicina: 1 },
        { izdelekId: 99, velikostId: "x", kolicina: 1 },
      ],
      izdelki,
    );
    expect(v.map((x) => [x.ime, x.velikost, x.cenaCenti])).toEqual([
      ["Česen v prahu", "41 ml (15 g)", 500],
      ["Bučno olje", "0,5 L", 1200],
    ]);
    expect(cenaSkatle(500, v)).toBe(500 + 1000 + 1200);
  });
});

describe("program z nedosegljivo postavko (Z53)", () => {
  it("odstrani izdelke izven sezone, brez zaloge ali neprimerne, zmanjša količino na zalogo", () => {
    const { vsebina, spremenjeni } = prilagodiVsebino(
      [
        { izdelekId: 1, velikostId: "c41", kolicina: 3 },
        { izdelekId: 1, velikostId: "c106", kolicina: 1 },
        { izdelekId: 2, velikostId: "v2", kolicina: 1 },
        { izdelekId: 3, velikostId: "v3", kolicina: 1 },
        { izdelekId: null, velikostId: null, kolicina: 1 },
        { izdelekId: 4, velikostId: null, kolicina: 1 },
      ],
      izdelki,
      6,
    );
    expect(vsebina).toEqual([
      { izdelekId: 1, velikostId: "c41", kolicina: 2 },
      { izdelekId: 4, velikostId: "b05", kolicina: 1 },
    ]);
    expect(spremenjeni).toEqual(["Česen v prahu", "izdelek, ki ga ni več v ponudbi", "Jagodna marmelada"]);
  });

  it("odreže presežek mest, če ima škatla zdaj manj mest", () => {
    const { vsebina, spremenjeni } = prilagodiVsebino([{ izdelekId: 4, velikostId: "b05", kolicina: 5 }], izdelki, 3);
    expect(vsebina).toEqual([{ izdelekId: 4, velikostId: "b05", kolicina: 3 }]);
    expect(spremenjeni).toEqual(["Bučno olje"]);
  });
});

describe("validacija programa v adminu (Z51)", () => {
  const zaDarilo = new Map<number, IzdelekZaDarilo>(
    katalog.map((i) => [i.id, { id: i.id, ime: i.ime, nacinProdaje: i.nacinProdaje, primernoZaDarilo: i.primernoZaDarilo, velikosti: i.velikosti }]),
  );

  it("sprejme veljaven program; velikost najde po id-ju, oznaki ali prvo", () => {
    expect(preveriProgram([{ izdelekId: 1, velikost: "41 ML (15 g)", kolicina: 2 }, { izdelekId: 4, velikost: null, kolicina: 1 }], 3, zaDarilo)).toEqual([]);
    expect(poisciVelikost(katalog[0], "c106")?.oznaka).toBe("106 ml (40 g)");
    expect(poisciVelikost(katalog[0], " 106 ml (40 g) ")?.id).toBe("c106");
    expect(poisciVelikost(katalog[0], "")?.id).toBe("c41");
    expect(poisciVelikost(katalog[0], "1 kg")).toBeNull();
  });

  it("zavrne preveč kosov, neprimeren izdelek, neznano velikost in prazen program", () => {
    expect(preveriProgram([], 3, zaDarilo).map((n) => n.pot)).toEqual(["vsebina"]);
    expect(
      preveriProgram(
        [
          { izdelekId: 2, velikost: null, kolicina: 1 },
          { izdelekId: 1, velikost: "1 kg", kolicina: 3 },
          { izdelekId: null, velikost: null, kolicina: 1 },
          { izdelekId: 4, velikost: null, kolicina: 0 },
        ],
        3,
        zaDarilo,
      ).map((n) => n.pot),
    ).toEqual(["vsebina.0.izdelek", "vsebina.1.velikostId", "vsebina.2.izdelek", "vsebina.3.kolicina", "vsebina"]);
  });

  it("združi enake velikosti in omeji število mest", () => {
    expect(
      zdruziVsebino([
        { izdelekId: 1, velikostId: "a", kolicina: 2 },
        { izdelekId: 1, velikostId: "a", kolicina: 1 },
        { izdelekId: 2, velikostId: "b", kolicina: 0 },
        { izdelekId: 3, velikostId: "c", kolicina: 30 },
      ]),
    ).toEqual([
      { izdelekId: 1, velikostId: "a", kolicina: 3 },
      { izdelekId: 3, velikostId: "c", kolicina: 21 },
    ]);
  });
});
