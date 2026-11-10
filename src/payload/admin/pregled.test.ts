import { describe, expect, it } from "vitest";
import { nizkaZaloga, pozdrav, steviloNarocil, uraVSloveniji } from "./pregled";

describe("nizkaZaloga", () => {
  const izdelki = [
    {
      id: 1,
      ime: "Česen v prahu",
      objavljen: true,
      nacinProdaje: "posta-in-prevzem" as const,
      velikosti: [
        { oznaka: "41 ml", zaloga: 2 },
        { oznaka: "106 ml", zaloga: 15 },
      ],
    },
    { id: 2, ime: "Jajca", objavljen: true, nacinProdaje: "samo-prevzem" as const, velikosti: [{ oznaka: "", zaloga: 0 }] },
    { id: 3, ime: "Jagode", objavljen: true, nacinProdaje: "samo-prikaz" as const, velikosti: [{ zaloga: null }] },
    { id: 4, ime: "Skriti", objavljen: false, nacinProdaje: "posta-in-prevzem" as const, velikosti: [{ zaloga: 0 }] },
  ];

  it("vrne le objavljene, naročljive velikosti z malo zaloge, najprej pošle", () => {
    expect(nizkaZaloga(izdelki)).toEqual([
      { vrsta: "izdelek", id: 2, ime: "Jajca", velikost: null, zaloga: 0 },
      { vrsta: "izdelek", id: 1, ime: "Česen v prahu", velikost: "41 ml", zaloga: 2 },
    ]);
  });

  it("doda aktivne škatle z malo zaloge, neaktivnih ne", () => {
    const skatle = [
      { id: 7, ime: "Mala škatla", aktiven: true, zaloga: 1 },
      { id: 8, ime: "Velika škatla", aktiven: false, zaloga: 0 },
      { id: 9, ime: "Srednja škatla", aktiven: true, zaloga: 10 },
    ];
    expect(nizkaZaloga([], skatle)).toEqual([{ vrsta: "skatla", id: 7, ime: "Mala škatla", velikost: null, zaloga: 1 }]);
  });

  it("upošteva podano mejo", () => {
    expect(nizkaZaloga(izdelki, [], 0).map((v) => v.ime)).toEqual(["Jajca"]);
  });
});

describe("pozdrav", () => {
  it("izbere pozdrav po uri in uporabi krstno ime", () => {
    expect(pozdrav("Sandi Derčar", 7)).toBe("Dobro jutro, Sandi");
    expect(pozdrav("Sandi Derčar", 12)).toBe("Dober dan, Sandi");
    expect(pozdrav("Sandi Derčar", 21)).toBe("Dober večer, Sandi");
    expect(pozdrav("Sandi", 2)).toBe("Dober večer, Sandi");
  });

  it("brez imena pozdravi brez vejice", () => {
    expect(pozdrav("", 12)).toBe("Dober dan");
    expect(pozdrav(undefined, 12)).toBe("Dober dan");
  });
});

describe("uraVSloveniji", () => {
  it("pretvori UTC v lokalni čas (zima +1, poletje +2)", () => {
    expect(uraVSloveniji(new Date("2026-01-15T06:30:00Z"))).toBe(7);
    expect(uraVSloveniji(new Date("2026-07-15T06:30:00Z"))).toBe(8);
    expect(uraVSloveniji(new Date("2026-07-15T22:30:00Z"))).toBe(0);
  });
});

describe("steviloNarocil", () => {
  it("uporabi pravilno slovnično število", () => {
    expect(steviloNarocil(0)).toBe("0 naročil");
    expect(steviloNarocil(1)).toBe("1 naročilo");
    expect(steviloNarocil(2)).toBe("2 naročili");
    expect(steviloNarocil(3)).toBe("3 naročila");
    expect(steviloNarocil(4)).toBe("4 naročila");
    expect(steviloNarocil(5)).toBe("5 naročil");
    expect(steviloNarocil(101)).toBe("101 naročilo");
    expect(steviloNarocil(111)).toBe("111 naročil");
  });
});
