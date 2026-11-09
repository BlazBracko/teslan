import { describe, expect, it } from "vitest";
import {
  dodajPostavko,
  kljucPostavke,
  NAJVEC_POSTAVK,
  nastaviKolicino,
  normalizirajKosarico,
  odstraniPostavko,
  preberiIzShrambe,
  steviloKosovVKosarici,
  zapisiZaShrambo,
  type PostavkaKosarice,
} from "./postavke";

const cesen: PostavkaKosarice = { izdelekId: 6, velikostId: "a1", kolicina: 2 };
const olje: PostavkaKosarice = { izdelekId: 22, velikostId: "b2", kolicina: 1 };

describe("košarica v brskalniku (Z20)", () => {
  it("doda novo postavko in združi isto velikost istega izdelka", () => {
    const { kosarica, dodano } = dodajPostavko([], cesen);
    expect(kosarica).toEqual([cesen]);
    expect(dodano).toBe(2);

    const druga = dodajPostavko(kosarica, { ...cesen, kolicina: 3 });
    expect(druga.kosarica).toEqual([{ ...cesen, kolicina: 5 }]);
    expect(druga.dodano).toBe(3);

    // Druga velikost istega izdelka je ločena postavka.
    expect(dodajPostavko(druga.kosarica, { ...cesen, velikostId: "a2" }).kosarica).toHaveLength(2);
  });

  it("količina ne preseže zaloge in 20 kosov", () => {
    expect(dodajPostavko([], { ...cesen, kolicina: 5 }, 3)).toEqual({
      kosarica: [{ ...cesen, kolicina: 3 }],
      dodano: 3,
    });
    const polna = dodajPostavko([], { ...cesen, kolicina: 18 }).kosarica;
    expect(dodajPostavko(polna, { ...cesen, kolicina: 5 })).toEqual({
      kosarica: [{ ...cesen, kolicina: 20 }],
      dodano: 2,
    });
    expect(dodajPostavko([{ ...cesen, kolicina: 20 }], cesen).dodano).toBe(0);
    // Če je v košarici že več, kot je zdaj zaloge, se količina ne zmanjša tiho.
    expect(dodajPostavko([{ ...cesen, kolicina: 4 }], cesen, 2)).toEqual({
      kosarica: [{ ...cesen, kolicina: 4 }],
      dodano: 0,
    });
  });

  it("ne sprejme več kot NAJVEC_POSTAVK različnih postavk", () => {
    const polna = Array.from({ length: NAJVEC_POSTAVK }, (_, i) => ({ izdelekId: i + 1, velikostId: "x", kolicina: 1 }));
    expect(dodajPostavko(polna, { izdelekId: 999, velikostId: "x", kolicina: 1 }).dodano).toBe(0);
  });

  it("nastavi količino, odstrani postavko, prešteje kose", () => {
    const kosarica = [cesen, olje];
    expect(nastaviKolicino(kosarica, kljucPostavke(olje), 7)[1].kolicina).toBe(7);
    expect(nastaviKolicino(kosarica, kljucPostavke(olje), 0)[1].kolicina).toBe(1);
    expect(nastaviKolicino(kosarica, kljucPostavke(olje), 99)[1].kolicina).toBe(20);
    expect(nastaviKolicino(kosarica, "neznan", 5)).toEqual(kosarica);
    expect(odstraniPostavko(kosarica, kljucPostavke(cesen))).toEqual([olje]);
    expect(steviloKosovVKosarici(kosarica)).toBe(3);
    expect(steviloKosovVKosarici([])).toBe(0);
  });

  it("shramba hrani samo id-je, velikosti in količine", () => {
    const niz = zapisiZaShrambo([cesen, olje]);
    expect(JSON.parse(niz)).toEqual({ verzija: 1, postavke: [cesen, olje] });
    expect(preberiIzShrambe(niz)).toEqual([cesen, olje]);
  });

  it("pokvarjena shramba ne zruši strani", () => {
    expect(preberiIzShrambe(null)).toEqual([]);
    expect(preberiIzShrambe("")).toEqual([]);
    expect(preberiIzShrambe("{ni json")).toEqual([]);
    expect(preberiIzShrambe("null")).toEqual([]);
    expect(preberiIzShrambe('{"postavke": 5}')).toEqual([]);
    expect(
      preberiIzShrambe(
        JSON.stringify({
          postavke: [
            cesen,
            { izdelekId: "6", velikostId: "a1", kolicina: 1 },
            { izdelekId: 7, velikostId: "", kolicina: 1 },
            { izdelekId: 8, velikostId: "c", kolicina: 0 },
            { izdelekId: 9, velikostId: "c", kolicina: 21 },
            { izdelekId: 10, velikostId: "c", kolicina: 1.5 },
            { ...cesen, kolicina: 1 },
          ],
        }),
      ),
    ).toEqual([{ ...cesen, kolicina: 3 }]);
  });

  it("normalizacija odreže preveč postavk", () => {
    const vnos = Array.from({ length: NAJVEC_POSTAVK + 10 }, (_, i) => ({ izdelekId: i + 1, velikostId: "x", kolicina: 1 }));
    expect(normalizirajKosarico(vnos)).toHaveLength(NAJVEC_POSTAVK);
    expect(normalizirajKosarico("niz")).toEqual([]);
  });
});
