import { describe, expect, it } from "vitest";
import { preberiOkolje } from "../env";
import { javniUrlSlike, nastavitveR2 } from "./shramba";

const r2 = {
  S3_BUCKET: "teslan-staging",
  S3_ENDPOINT: "https://abc.r2.cloudflarestorage.com",
  S3_ACCESS_KEY_ID: "kljuc",
  S3_SECRET_ACCESS_KEY: "skrivnost",
  S3_PUBLIC_URL: "https://slike.teslan.si/",
};

describe("shramba slik (Z83)", () => {
  it("brez S3 spremenljivk uporabi lokalni disk", () => {
    expect(nastavitveR2(preberiOkolje({ NODE_ENV: "test" }))).toBeUndefined();
  });

  it("z vsemi S3 spremenljivkami uporabi R2", () => {
    const nastavitve = nastavitveR2(preberiOkolje({ NODE_ENV: "test", ...r2 }));
    expect(nastavitve).toMatchObject({
      bucket: "teslan-staging",
      endpoint: "https://abc.r2.cloudflarestorage.com",
      publicUrl: "https://slike.teslan.si",
    });
  });

  it("sestavi javni naslov slike s predpono in kodiranim imenom", () => {
    expect(
      javniUrlSlike("https://slike.teslan.si", "media", "bučno olje.jpg"),
    ).toBe("https://slike.teslan.si/media/bu%C4%8Dno%20olje.jpg");
    expect(javniUrlSlike("https://slike.teslan.si", undefined, "a.jpg")).toBe(
      "https://slike.teslan.si/a.jpg",
    );
  });
});
