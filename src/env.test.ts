import { describe, expect, it } from "vitest";
import { NapakaOkolja, OBVEZNE_V_PRODUKCIJI, preberiOkolje } from "./env";

describe("preberiOkolje", () => {
  it("sprejme prazno razvojno okolje", () => {
    const env = preberiOkolje({ NODE_ENV: "development" });
    expect(env.NODE_ENV).toBe("development");
    expect(env.DATABASE_URL).toBeUndefined();
  });

  it("prazen niz šteje kot nenastavljeno", () => {
    const env = preberiOkolje({ NODE_ENV: "test", NOINDEX: "", STRIPE_SECRET_KEY: "  " });
    expect(env.NOINDEX).toBeUndefined();
    expect(env.STRIPE_SECRET_KEY).toBeUndefined();
  });

  it("sprejme veljavne vrednosti", () => {
    const env = preberiOkolje({
      NODE_ENV: "production",
      DATABASE_URL: "postgres://u:p@localhost:5432/teslan",
      PAYLOAD_SECRET: "x".repeat(32),
      NEXT_PUBLIC_SITE_URL: "https://www.teslan.si",
      NOINDEX: "1",
      EMAIL_REDIRECT_TO: "test@example.com",
      STRIPE_SECRET_KEY: "sk_test_abc",
      STRIPE_WEBHOOK_SECRET: "whsec_abc",
    });
    expect(env.NOINDEX).toBe("1");
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://www.teslan.si");
  });

  it("zavrne napačne oblike in navede imena spremenljivk", () => {
    expect(() =>
      preberiOkolje({
        NODE_ENV: "development",
        DATABASE_URL: "mysql://x",
        NOINDEX: "da",
        NEXT_PUBLIC_SITE_URL: "ni-url",
      }),
    ).toThrowError(/DATABASE_URL[\s\S]*NEXT_PUBLIC_SITE_URL[\s\S]*NOINDEX/);
  });

  it("v sporočilu o napaki ne izpiše vrednosti skrivnosti", () => {
    const skrivnost = "sk_napacna_skrivnost_123456";
    try {
      preberiOkolje({ NODE_ENV: "production", STRIPE_SECRET_KEY: skrivnost });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(NapakaOkolja);
      expect((e as Error).message).toContain("STRIPE_SECRET_KEY");
      expect((e as Error).message).not.toContain(skrivnost);
    }
  });

  it("zahteva celotno skupino (S3, Stripe, seed)", () => {
    expect(() =>
      preberiOkolje({ NODE_ENV: "development", S3_BUCKET: "teslan-staging" }),
    ).toThrowError(/S3_ENDPOINT[\s\S]*S3_PUBLIC_URL/);
  });

  it("nepopoln basic auth ne ustavi zagona (geslo se izklopi z opozorilom, K12)", () => {
    expect(preberiOkolje({ NODE_ENV: "development", BASIC_AUTH_USER: "staging" }).BASIC_AUTH_USER).toBe(
      "staging",
    );
  });

  it("v produkciji ustavi zagon, ko manjka obvezna spremenljivka", () => {
    expect(() =>
      preberiOkolje({ NODE_ENV: "production" }, ["DATABASE_URL", "PAYLOAD_SECRET"]),
    ).toThrowError(/DATABASE_URL: obvezna v produkciji[\s\S]*PAYLOAD_SECRET/);
    // v razvoju iste spremenljivke niso obvezne
    expect(() =>
      preberiOkolje({ NODE_ENV: "development" }, ["DATABASE_URL"]),
    ).not.toThrow();
  });

  it("v produkciji privzeto zahteva bazo in skrivnost Payloada", () => {
    expect(OBVEZNE_V_PRODUKCIJI).toEqual(["DATABASE_URL", "PAYLOAD_SECRET"]);
    expect(() => preberiOkolje({ NODE_ENV: "production" })).toThrowError(
      /DATABASE_URL: obvezna v produkciji[\s\S]*PAYLOAD_SECRET: obvezna v produkciji/,
    );
    expect(() =>
      preberiOkolje({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://u:p@localhost:5432/teslan",
        PAYLOAD_SECRET: "x".repeat(32),
      }),
    ).not.toThrow();
  });
});
