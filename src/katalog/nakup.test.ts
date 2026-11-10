import { describe, expect, it } from "vitest";
import { nacinNakupaIzParametra, potSeznama, potSeznamaZaIzdelek, ustrezaNacinuNakupa } from "./nakup";

describe("način nakupa", () => {
  it("prebere vrednost iz URL, neznana pomeni vse", () => {
    expect(nacinNakupaIzParametra("splet")).toBe("splet");
    expect(nacinNakupaIzParametra(["kmetija", "splet"])).toBe("kmetija");
    expect(nacinNakupaIzParametra(undefined)).toBe("vse");
    expect(nacinNakupaIzParametra("posta")).toBe("vse");
  });

  it("spletna trgovina ima vse naročljivo na spletu, kmetija samo prikaz", () => {
    const posta = { nacinProdaje: "posta-in-prevzem" as const };
    const prevzem = { nacinProdaje: "samo-prevzem" as const };
    const prikaz = { nacinProdaje: "samo-prikaz" as const };
    expect([posta, prevzem, prikaz].map((i) => ustrezaNacinuNakupa(i, "splet"))).toEqual([true, true, false]);
    expect([posta, prevzem, prikaz].map((i) => ustrezaNacinuNakupa(i, "kmetija"))).toEqual([false, false, true]);
    expect([posta, prevzem, prikaz].every((i) => ustrezaNacinuNakupa(i, "vse"))).toBe(true);
  });

  it("sestavi povezave na seznam", () => {
    expect(potSeznama({})).toBe("/products");
    expect(potSeznama({ nakup: "vse", kategorija: "olja" })).toBe("/products?kategorija=olja");
    expect(potSeznama({ nakup: "splet", kategorija: "olja" })).toBe("/products?nakup=splet&kategorija=olja");
    expect(potSeznamaZaIzdelek({ nacinProdaje: "samo-prikaz" })).toBe("/products?nakup=kmetija");
    expect(potSeznamaZaIzdelek({ nacinProdaje: "samo-prevzem" })).toBe("/products?nakup=splet");
  });
});
