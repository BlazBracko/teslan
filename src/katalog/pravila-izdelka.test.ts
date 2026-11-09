import { describe, expect, it } from "vitest";
import { odstotekDDV } from "./ddv";
import {
  preveriCeno,
  preveriPrimernoZaDarilo,
  preveriSezono,
  preveriZalogo,
} from "./pravila-izdelka";
import { potSlike } from "./slike";
import { ustvariSlug } from "./slug";

describe("pravila izdelka (Z11, Z12, Z52)", () => {
  it("cena je obvezna pri naročljivih, neobvezna pri samo-prikaz", () => {
    expect(preveriCeno(550, "posta-in-prevzem")).toBe(true);
    expect(preveriCeno(null, "posta-in-prevzem")).toMatch(/ceno/);
    expect(preveriCeno(undefined, "samo-prevzem")).toMatch(/ceno/);
    expect(preveriCeno(null, "samo-prikaz")).toBe(true);
    expect(preveriCeno(0, "posta-in-prevzem")).toMatch(/večja od 0/);
    expect(preveriCeno(5.5, "posta-in-prevzem")).toMatch(/celo število centov/);
    expect(preveriCeno(-1, "samo-prikaz")).toMatch(/večja od 0/);
  });

  it("zaloga je obvezna pri naročljivih, 0 je dovoljena", () => {
    expect(preveriZalogo(0, "posta-in-prevzem")).toBe(true);
    expect(preveriZalogo(null, "posta-in-prevzem")).toMatch(/zalogo/);
    expect(preveriZalogo(null, "samo-prikaz")).toBe(true);
    expect(preveriZalogo(-2, "samo-prevzem")).toMatch(/0 ali več/);
    expect(preveriZalogo(1.5, "samo-prevzem")).toMatch(/celo število/);
  });

  it("za darilo je primeren le izdelek za pošto (Z52)", () => {
    expect(preveriPrimernoZaDarilo(true, "posta-in-prevzem")).toBe(true);
    expect(preveriPrimernoZaDarilo(true, "samo-prevzem")).toMatch(/Pošta in prevzem/);
    expect(preveriPrimernoZaDarilo(true, "samo-prikaz")).toMatch(/Pošta in prevzem/);
    expect(preveriPrimernoZaDarilo(false, "samo-prevzem")).toBe(true);
  });

  it("sezona ima oba meseca ali nobenega", () => {
    expect(preveriSezono(null, null)).toBe(true);
    expect(preveriSezono("4", "6")).toBe(true);
    expect(preveriSezono("11", "2")).toBe(true);
    expect(preveriSezono("4", null)).toMatch(/oba meseca/);
    expect(preveriSezono(undefined, "6")).toMatch(/oba meseca/);
    expect(preveriSezono("0", "6")).toMatch(/januarja do decembra/);
  });
});

describe("pomožne funkcije kataloga", () => {
  it("slug brez šumnikov", () => {
    expect(ustvariSlug("Česen v prahu")).toBe("cesen-v-prahu");
    expect(ustvariSlug("Liofilizirane jagode, breskve")).toBe("liofilizirane-jagode-breskve");
    expect(ustvariSlug("  Žganje & Đuveč  ")).toBe("zganje-duvec");
    expect(ustvariSlug("Bučno olje 0,5 L")).toBe("bucno-olje-0-5-l");
  });

  it("stopnja DDV iz polja", () => {
    expect(odstotekDDV("9.5")).toBe(9.5);
    expect(odstotekDDV("22")).toBe(22);
    expect(() => odstotekDDV("8")).toThrow(/Neznana stopnja DDV/);
  });

  it("slike z lastnega strežnika postanejo relativne, iz R2 ostanejo absolutne", () => {
    expect(potSlike("http://localhost:3100/api/media/file/a.jpg", "http://localhost:3100")).toBe(
      "/api/media/file/a.jpg",
    );
    expect(potSlike("/api/media/file/a.jpg", undefined)).toBe("/api/media/file/a.jpg");
    expect(potSlike("https://slike.teslan.si/media/a.jpg", "https://www.teslan.si")).toBe(
      "https://slike.teslan.si/media/a.jpg",
    );
  });
});
