import { describe, expect, it } from "vitest";
import { preberiOkolje } from "@/env";
import type { Katalog, SlikaPogled } from "./pogled";
import {
  imeLokalneDatoteke,
  katalogSTestnimiSlikami,
  popraviSliko,
  TESTNE_SLIKE,
  testnaSlika,
  testneSlikeVklopljene,
  type Datoteke,
} from "./testne-slike";

const R2 = {
  S3_BUCKET: "b",
  S3_ENDPOINT: "https://r2.example.com",
  S3_ACCESS_KEY_ID: "k",
  S3_SECRET_ACCESS_KEY: "s",
  S3_PUBLIC_URL: "https://slike.example.com",
};
const env = (vir: Record<string, string>) => preberiOkolje(vir, []);

const slika = (url: string): SlikaPogled => ({ url, alt: "Opis", sirina: 800, visina: 600, zarisce: { x: 10, y: 20 } });

/** Disk brez `media/`, v `public/` pa je `cesen.jpg` (kot na Railwayu). */
const railway: Datoteke = { vMediji: () => false, vJavni: (ime) => ime === "cesen.jpg" };

describe("testneSlikeVklopljene", () => {
  it("z R2 nikoli, tudi če je TESTNE_SLIKE=1", () => {
    expect(testneSlikeVklopljene(env({ NODE_ENV: "production", ...R2 }))).toBe(false);
    expect(testneSlikeVklopljene(env({ NODE_ENV: "production", TESTNE_SLIKE: "1", ...R2 }))).toBe(false);
  });

  it("brez R2 privzeto samo na produkcijski gradnji", () => {
    expect(testneSlikeVklopljene(env({ NODE_ENV: "production" }))).toBe(true);
    expect(testneSlikeVklopljene(env({ NODE_ENV: "development" }))).toBe(false);
  });

  it("TESTNE_SLIKE preglasi privzeto", () => {
    expect(testneSlikeVklopljene(env({ NODE_ENV: "production", TESTNE_SLIKE: "0" }))).toBe(false);
    expect(testneSlikeVklopljene(env({ NODE_ENV: "development", TESTNE_SLIKE: "1" }))).toBe(true);
  });

  it("zavrne neveljavno vrednost", () => {
    expect(() => env({ TESTNE_SLIKE: "da" })).toThrow(/TESTNE_SLIKE/);
  });
});

describe("imeLokalneDatoteke", () => {
  it("prepozna relativne in absolutne naslove lokalnih slik", () => {
    expect(imeLokalneDatoteke("/api/media/file/cesen.jpg")).toBe("cesen.jpg");
    expect(imeLokalneDatoteke("https://teslan.si/api/media/file/%C4%8Desen%20b.jpg")).toBe("česen b.jpg");
  });

  it("slik iz R2 in drugih poti ne obravnava", () => {
    expect(imeLokalneDatoteke("https://slike.example.com/media/cesen.jpg")).toBeNull();
    expect(imeLokalneDatoteke("/cesen.jpg")).toBeNull();
    expect(imeLokalneDatoteke("/api/media/file/../x.jpg")).toBeNull();
  });
});

describe("popraviSliko", () => {
  it("pusti sliko, ki je na disku, ali sliko iz R2", () => {
    const naDisku: Datoteke = { vMediji: () => true, vJavni: () => false };
    expect(popraviSliko(slika("/api/media/file/x.jpg"), "k", naDisku)).toEqual(slika("/api/media/file/x.jpg"));
    expect(popraviSliko(slika("https://slike.example.com/media/x.jpg"), "k", railway)).toEqual(
      slika("https://slike.example.com/media/x.jpg"),
    );
  });

  it("manjkajočo datoteko vzame iz public/, tudi s pripono Payloada", () => {
    expect(popraviSliko(slika("/api/media/file/cesen.jpg"), "k", railway)).toEqual({ ...slika("/cesen.jpg") });
    expect(popraviSliko(slika("/api/media/file/cesen-2.jpg"), "k", railway).url).toBe("/cesen.jpg");
  });

  it("sicer in brez slike vrne testno sliko, za isti ključ vedno isto", () => {
    expect(popraviSliko(slika("/api/media/file/nalozena.webp"), "a", railway)).toEqual(testnaSlika("a"));
    expect(popraviSliko(null, "b", railway)).toEqual(testnaSlika("b"));
    expect(testnaSlika("b")).toBe(testnaSlika("b"));
    expect(TESTNE_SLIKE).toContain(testnaSlika("c"));
    expect(TESTNE_SLIKE.every((s) => s.alt.endsWith("(testna slika)"))).toBe(true);
  });
});

describe("katalogSTestnimiSlikami", () => {
  it("vsak izdelek in skupina dobita sliko", () => {
    const katalog = {
      kategorije: [],
      izdelki: [
        { slug: "brez", slike: [] },
        { slug: "z", slike: [slika("/api/media/file/cesen.jpg")] },
      ],
      skupine: [{ id: 1, slika: null }],
    } as unknown as Katalog;
    const rezultat = katalogSTestnimiSlikami(katalog, railway);
    expect(rezultat.izdelki[0].slike).toEqual([testnaSlika("izdelek:brez")]);
    expect(rezultat.izdelki[1].slike[0].url).toBe("/cesen.jpg");
    expect(rezultat.skupine[0].slika).toEqual(testnaSlika("skupina:1"));
  });
});
