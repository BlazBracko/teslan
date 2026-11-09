import { describe, expect, it } from "vitest";
import { kotBesedilo, obrazecZaOdstop, pravniPodatkiProdajalca } from "./prodajalec";

const POLNI = {
  naziv: "Sandi Derčar, nosilec kmetije",
  naslov: "Podgora 15, 8351 Straža pri Novem mestu",
  davcnaStevilka: "SI12345678",
  maticnaStevilka: "",
  kmgMid: "100123456",
  telefon: "040 578 512",
  email: "sandi.dercar@gmail.com",
};

describe("pravniPodatkiProdajalca", () => {
  it("vpisane vrednosti obreže in ne javi manjkajočih", () => {
    const p = pravniPodatkiProdajalca({ ...POLNI, naziv: "  Sandi Derčar, nosilec kmetije " });
    expect(p.naziv).toEqual({ vpisano: true, besedilo: "Sandi Derčar, nosilec kmetije" });
    expect(p.manjka).toEqual([]);
  });

  it("prazna obvezna polja označi z imenom (§7: [manjka: …])", () => {
    const p = pravniPodatkiProdajalca({ naslov: "Podgora 15", telefon: " ", email: null });
    expect(p.naziv).toEqual({ vpisano: false, manjka: "naziv prodajalca" });
    expect(kotBesedilo(p.davcnaStevilka)).toBe("[manjka: davčna številka]");
    expect(p.manjka).toEqual(["naziv prodajalca", "davčna številka", "KMG-MID", "telefon", "e-pošta"]);
  });

  it("matična številka ni obvezna", () => {
    expect(pravniPodatkiProdajalca(POLNI).maticnaStevilka).toBeNull();
    expect(pravniPodatkiProdajalca({ ...POLNI, maticnaStevilka: "1234567000" }).maticnaStevilka).toBe("1234567000");
  });

  it("brez nastavitev so vsa obvezna polja manjkajoča", () => {
    expect(pravniPodatkiProdajalca(null).manjka).toHaveLength(6);
  });
});

describe("obrazecZaOdstop", () => {
  it("je naslovljen na prodajalca in ima polja za kupca", () => {
    const besedilo = obrazecZaOdstop(pravniPodatkiProdajalca(POLNI));
    expect(besedilo.split("\n")[0]).toBe(
      "Za: Sandi Derčar, nosilec kmetije, Podgora 15, 8351 Straža pri Novem mestu, e-pošta: sandi.dercar@gmail.com",
    );
    expect(besedilo).toContain("odstopam od pogodbe");
    expect(besedilo).toContain("Številka naročila:");
  });

  it("manjkajoče podatke prodajalca pusti vidne", () => {
    expect(obrazecZaOdstop(pravniPodatkiProdajalca({}))).toContain("[manjka: naziv prodajalca]");
  });
});
