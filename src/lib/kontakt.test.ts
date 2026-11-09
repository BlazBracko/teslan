import { describe, expect, it } from "vitest";
import { kontaktIzNastavitev, telefonskaPovezava } from "./kontakt";
import { stevilo, IZDELEK, KOS } from "./sklanjanje";

describe("telefonskaPovezava", () => {
  it("slovensko številko pretvori v mednarodno obliko", () => {
    expect(telefonskaPovezava("040 578 512")).toBe("tel:+38640578512");
  });

  it("mednarodno obliko pusti", () => {
    expect(telefonskaPovezava("+386 40 578 512")).toBe("tel:+38640578512");
    expect(telefonskaPovezava("00386 40-578-512")).toBe("tel:+38640578512");
  });
});

describe("kontaktIzNastavitev", () => {
  it("iz podatkov prodajalca sestavi povezave", () => {
    const k = kontaktIzNastavitev({
      naslov: "Podgora 15, 8351 Straža pri Novem mestu",
      telefon: "040 578 512",
      email: "sandi@example.com",
    });
    expect(k.naslovVrstice).toEqual(["Podgora 15", "8351 Straža pri Novem mestu"]);
    expect(k.telefonPovezava).toBe("tel:+38640578512");
    expect(k.zemljevid).toBe(
      "https://www.google.com/maps/search/?api=1&query=Podgora%2015%2C%208351%20Stra%C5%BEa%20pri%20Novem%20mestu",
    );
    expect(k.pot).toContain("/maps/dir/?api=1&destination=Podgora%2015");
  });

  it("prazna polja ostanejo prazna (vrstica se ne prikaže)", () => {
    const k = kontaktIzNastavitev({ naslov: "  ", telefon: null });
    expect(k).toMatchObject({
      naslov: null,
      naslovVrstice: [],
      telefon: null,
      telefonPovezava: null,
      email: null,
      zemljevid: null,
      pot: null,
    });
    expect(kontaktIzNastavitev(undefined).ime).toBe("Domačija Tešlan");
  });
});

describe("stevilo", () => {
  it.each([
    [1, "1 izdelek"],
    [2, "2 izdelka"],
    [3, "3 izdelki"],
    [4, "4 izdelki"],
    [5, "5 izdelkov"],
    [25, "25 izdelkov"],
    [101, "101 izdelek"],
    [102, "102 izdelka"],
    [111, "111 izdelkov"],
  ])("%i → %s", (n, pricakovano) => {
    expect(stevilo(n, IZDELEK)).toBe(pricakovano);
  });

  it("kosi", () => {
    expect(stevilo(3, KOS)).toBe("3 kosi");
  });
});
