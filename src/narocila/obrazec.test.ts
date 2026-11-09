import { describe, expect, it } from "vitest";
import { preveriBlagajno } from "./obrazec";

const veljaven = {
  ime: " Ana ",
  priimek: "Novak",
  email: "ana@primer.si",
  telefon: "+386 40 123-456",
  nacinDostave: "prevzem",
  nacinPlacila: "ob-prevzemu",
  soglasje: true,
};

describe("obrazec blagajne (Z25)", () => {
  it("sprejme prevzem brez naslova in počisti presledke", () => {
    const r = preveriBlagajno(veljaven);
    expect(r).toMatchObject({ success: true, data: { ime: "Ana", nacinDostave: "prevzem" } });
  });

  it("pri pošti zahteva ulico s hišno številko, 4-mestno poštno številko in kraj", () => {
    expect(preveriBlagajno({ ...veljaven, nacinDostave: "posta", nacinPlacila: "kartica" })).toEqual({
      success: false,
      napake: {
        ulica: "Vpišite ulico in hišno številko.",
        postnaStevilka: "Poštna številka ima 4 števke, npr. 8351.",
        kraj: "Vpišite kraj.",
      },
    });
    expect(
      preveriBlagajno({ ...veljaven, nacinDostave: "posta", ulica: "Glavna cesta", postnaStevilka: "8351", kraj: "Straža" }),
    ).toMatchObject({ success: false, napake: { ulica: "Dodajte še hišno številko." } });
    expect(
      preveriBlagajno({ ...veljaven, nacinDostave: "posta", ulica: "Podgora 15", postnaStevilka: "8351", kraj: "Straža" }),
    ).toMatchObject({ success: true });
  });

  it("zahteva obvezna polja, veljaven e-naslov in telefon, soglasje in opombo do 500 znakov", () => {
    const r = preveriBlagajno({ email: "ana", telefon: "abc", opomba: "x".repeat(501), nacinDostave: "posta" });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(Object.keys(r.napake).sort()).toEqual(
      ["email", "ime", "kraj", "nacinPlacila", "opomba", "postnaStevilka", "priimek", "soglasje", "telefon", "ulica"].sort(),
    );
    expect(r.napake.soglasje).toBe("Za oddajo naročila se morate strinjati s splošnimi pogoji.");
    expect(r.napake.opomba).toMatch(/500 znakov/);
  });
});
