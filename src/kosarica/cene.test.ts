import { describe, expect, it } from "vitest";
import { PRIVZETE_NASTAVITVE } from "@/payload/globali/NastavitveTrgovine";
import {
  doBrezplacnePostnine,
  izracunajPostnino,
  izracunajZnesek,
  oznakaStopnje,
  razclenitevDDV,
  vkljuceniDDV,
} from "./cene";

const privzete = {
  postninaCenti: PRIVZETE_NASTAVITVE.postninaCenti,
  pragBrezplacnePostnineCenti: PRIVZETE_NASTAVITVE.pragBrezplacnePostnineCenti,
};

describe("S2: poštnina (Z23)", () => {
  it("49,99 € → 5,00 €; 50,00 € → 0 €", () => {
    expect(izracunajPostnino("posta", 4999, privzete)).toBe(500);
    expect(izracunajPostnino("posta", 5000, privzete)).toBe(0);
    expect(izracunajPostnino("posta", 12_000, privzete)).toBe(0);
  });

  it("pri prevzemu je poštnina 0", () => {
    expect(izracunajPostnino("prevzem", 100, privzete)).toBe(0);
    expect(izracunajPostnino("prevzem", 4999, privzete)).toBe(0);
  });

  it("vrednosti se berejo iz nastavitev", () => {
    const drugacne = { postninaCenti: 390, pragBrezplacnePostnineCenti: 3000 };
    expect(izracunajPostnino("posta", 2999, drugacne)).toBe(390);
    expect(izracunajPostnino("posta", 3000, drugacne)).toBe(0);
    // Prag 0: poštnina je vedno brezplačna.
    expect(izracunajPostnino("posta", 0, { postninaCenti: 500, pragBrezplacnePostnineCenti: 0 })).toBe(0);
  });

  it("izračuna, koliko manjka do brezplačne poštnine", () => {
    expect(doBrezplacnePostnine(4999, privzete)).toBe(1);
    expect(doBrezplacnePostnine(1200, privzete)).toBe(3800);
    expect(doBrezplacnePostnine(6000, privzete)).toBe(0);
  });
});

describe("S3: DDV po stopnjah (Z24)", () => {
  it("DDV, vključen v bruto, po formuli bruto − round(bruto / (1 + stopnja))", () => {
    // 10,95 € pri 9,5 % = 10,00 € osnove + 0,95 € DDV.
    expect(vkljuceniDDV(1095, 9.5)).toBe(95);
    // 12,20 € pri 22 % = 10,00 € + 2,20 €.
    expect(vkljuceniDDV(1220, 22)).toBe(220);
    // 5,00 € pri 9,5 %: 500 / 1,095 = 456,62 → 457, DDV 43.
    expect(vkljuceniDDV(500, 9.5)).toBe(43);
    // 5,00 € pri 22 %: 500 / 1,22 = 409,84 → 410, DDV 90.
    expect(vkljuceniDDV(500, 22)).toBe(90);
    expect(vkljuceniDDV(0, 22)).toBe(0);
  });

  it("postavke 9,5 % in 22 % dajo pravilno razčlenitev", () => {
    const ddv = razclenitevDDV([
      { brutoCenti: 1200, stopnja: 9.5 },
      { brutoCenti: 800, stopnja: 22 },
      { brutoCenti: 1300, stopnja: 9.5 },
    ]);
    // 9,5 %: 2500 → 2500 / 1,095 = 2283,1 → 2283, DDV 217.
    // 22 %: 800 → 800 / 1,22 = 655,7 → 656, DDV 144.
    expect(ddv).toEqual([
      { stopnja: 9.5, osnovaCenti: 2283, ddvCenti: 217 },
      { stopnja: 22, osnovaCenti: 656, ddvCenti: 144 },
    ]);
  });

  it("DDV se računa na vsoto stopnje, ne na posamezne postavke", () => {
    // Trije kosi po 0,05 €: posamično 3 × round(0,05 / 1,095) bi dalo
    // 3 × 5 = 15 osnove in 0 DDV; na vsoti 15 → 14 osnove, 1 cent DDV.
    expect(razclenitevDDV([1, 2, 3].map(() => ({ brutoCenti: 5, stopnja: 9.5 })))).toEqual([
      { stopnja: 9.5, osnovaCenti: 14, ddvCenti: 1 },
    ]);
  });

  it("vsota osnov in DDV je skupaj na cent, za mnogo naključnih košaric", () => {
    let seme = 42;
    const nakljucno = (n: number) => {
      seme = (seme * 1_103_515_245 + 12_345) % 2 ** 31;
      return seme % n;
    };
    for (let i = 0; i < 2000; i++) {
      const postavke = Array.from({ length: 1 + nakljucno(6) }, () => ({
        cenaCenti: 1 + nakljucno(5000),
        kolicina: 1 + nakljucno(20),
        stopnjaDDV: nakljucno(2) ? 9.5 : 22,
      }));
      const znesek = izracunajZnesek(postavke, nakljucno(2) ? "posta" : "prevzem", privzete);
      const vsota = znesek.ddv.reduce((s, d) => s + d.osnovaCenti + d.ddvCenti, 0);
      expect(vsota).toBe(znesek.skupajCenti);
      for (const d of znesek.ddv) {
        expect(Number.isInteger(d.osnovaCenti) && Number.isInteger(d.ddvCenti)).toBe(true);
      }
    }
  });

  it("izpusti stopnje z ničelnim zneskom", () => {
    expect(razclenitevDDV([{ brutoCenti: 1000, stopnja: 9.5 }, { brutoCenti: 0, stopnja: 22 }])).toHaveLength(1);
    expect(razclenitevDDV([])).toEqual([]);
  });
});

describe("znesek naročila", () => {
  const postavke = [
    { cenaCenti: 500, kolicina: 2, stopnjaDDV: 9.5 },
    { cenaCenti: 1200, kolicina: 1, stopnjaDDV: 9.5 },
  ];

  it("pri pošti pod pragom prišteje poštnino z DDV 22 %", () => {
    expect(izracunajZnesek(postavke, "posta", privzete)).toEqual({
      vmesniSestevekCenti: 2200,
      postninaCenti: 500,
      skupajCenti: 2700,
      ddv: [
        { stopnja: 9.5, osnovaCenti: 2009, ddvCenti: 191 },
        { stopnja: 22, osnovaCenti: 410, ddvCenti: 90 },
      ],
    });
  });

  it("pri prevzemu brez poštnine", () => {
    const znesek = izracunajZnesek(postavke, "prevzem", privzete);
    expect(znesek.postninaCenti).toBe(0);
    expect(znesek.skupajCenti).toBe(2200);
    expect(znesek.ddv.map((d) => d.stopnja)).toEqual([9.5]);
  });

  it("prazna košarica", () => {
    expect(izracunajZnesek([], "prevzem", privzete)).toEqual({
      vmesniSestevekCenti: 0,
      postninaCenti: 0,
      skupajCenti: 0,
      ddv: [],
    });
  });
});

describe("oznaka stopnje", () => {
  it("uporablja slovensko decimalno vejico", () => {
    expect(oznakaStopnje(9.5)).toBe("9,5 %");
    expect(oznakaStopnje(22)).toBe("22 %");
  });
});
