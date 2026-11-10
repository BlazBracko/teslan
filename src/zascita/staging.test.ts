import { describe, expect, it } from "vitest";
import {
  dovoljeno,
  nastavitveZascite,
  opozorilaZascite,
  POT_WEBHOOKA_STRIPE,
  preberiOsnovnoAvtentikacijo,
} from "./staging";

const basic = (besedilo: string) => `Basic ${Buffer.from(besedilo, "utf8").toString("base64")}`;
const zascita = nastavitveZascite({ BASIC_AUTH_USER: "teslan", BASIC_AUTH_PASSWORD: "gesló:z-dvopičjem" });

describe("nastavitveZascite", () => {
  it("geslo vklopi samo, ko sta nastavljena oba podatka", () => {
    expect(zascita.geslo).toEqual({ uporabnik: "teslan", geslo: "gesló:z-dvopičjem" });
    expect(nastavitveZascite({}).geslo).toBeNull();
    expect(nastavitveZascite({ BASIC_AUTH_USER: "teslan" }).geslo).toBeNull();
    expect(nastavitveZascite({ BASIC_AUTH_USER: "teslan", BASIC_AUTH_PASSWORD: "  " }).geslo).toBeNull();
  });

  it("noindex samo pri NOINDEX=1", () => {
    expect(nastavitveZascite({ NOINDEX: "1" }).noindex).toBe(true);
    expect(nastavitveZascite({ NOINDEX: "" }).noindex).toBe(false);
  });
});

describe("preberiOsnovnoAvtentikacijo", () => {
  it("prebere UTF-8 uporabnika in geslo, ki sme vsebovati dvopičje", () => {
    expect(preberiOsnovnoAvtentikacijo(basic("teslan:gesló:z-dvopičjem"))).toEqual({
      uporabnik: "teslan",
      geslo: "gesló:z-dvopičjem",
    });
  });

  it("zavrne manjkajočo, drugačno ali pokvarjeno glavo", () => {
    expect(preberiOsnovnoAvtentikacijo(null)).toBeNull();
    expect(preberiOsnovnoAvtentikacijo("Bearer abc")).toBeNull();
    expect(preberiOsnovnoAvtentikacijo("Basic !!!")).toBeNull();
    expect(preberiOsnovnoAvtentikacijo(basic("brez-dvopicja"))).toBeNull();
  });
});

describe("dovoljeno (Z74)", () => {
  it("brez zaščite prepusti vse", async () => {
    expect(await dovoljeno("/", null, nastavitveZascite({ NOINDEX: "1" }))).toBe(true);
  });

  it("z zaščito zahteva pravo geslo na vseh poteh", async () => {
    expect(await dovoljeno("/", null, zascita)).toBe(false);
    expect(await dovoljeno("/admin", basic("teslan:napacno"), zascita)).toBe(false);
    expect(await dovoljeno("/robots.txt", basic("drug:gesló:z-dvopičjem"), zascita)).toBe(false);
    expect(await dovoljeno("/_next/static/x.js", basic("teslan:gesló:z-dvopičjem"), zascita)).toBe(true);
  });

  it("webhook Stripa je izvzet, podobne poti pa ne", async () => {
    expect(await dovoljeno(POT_WEBHOOKA_STRIPE, null, zascita)).toBe(true);
    expect(await dovoljeno(`${POT_WEBHOOKA_STRIPE}x`, null, zascita)).toBe(false);
    expect(await dovoljeno("/api/stripe", null, zascita)).toBe(false);
  });
});

describe("opozorilaZascite", () => {
  it("opozori na nepopolno nastavitev in na staging brez gesla, brez vrednosti", () => {
    const [opozorilo] = opozorilaZascite({ BASIC_AUTH_PASSWORD: "skrivno-geslo" });
    expect(opozorilo).toContain("samo BASIC_AUTH_PASSWORD");
    expect(opozorilo).not.toContain("skrivno-geslo");
    expect(opozorilaZascite({ NODE_ENV: "production", NOINDEX: "1" })).toEqual([
      expect.stringContaining("brez gesla dostopen vsem"),
    ]);
    expect(
      opozorilaZascite({ NODE_ENV: "production", BASIC_AUTH_USER: "a", BASIC_AUTH_PASSWORD: "b" }),
    ).toEqual([expect.stringContaining("brez NOINDEX=1")]);
    expect(opozorilaZascite({ NODE_ENV: "production" })).toEqual([]);
    expect(
      opozorilaZascite({ NODE_ENV: "production", NOINDEX: "1", BASIC_AUTH_USER: "a", BASIC_AUTH_PASSWORD: "b" }),
    ).toEqual([]);
  });
});
