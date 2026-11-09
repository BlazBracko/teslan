import { describe, expect, it } from "vitest";
import { letoVLjubljani, OBLIKA_STEVILKE, oblikujStevilko, ustvariZeton, zetonaSeUjemata } from "./stevilka";

describe("številka naročila (Z31)", () => {
  it("ima obliko T-<leto>-<vsaj 4 mesta>", () => {
    expect(oblikujStevilko(2026, 1)).toBe("T-2026-0001");
    expect(oblikujStevilko(2026, 123)).toBe("T-2026-0123");
    expect(oblikujStevilko(2027, 12345)).toBe("T-2027-12345");
    expect(OBLIKA_STEVILKE.test("T-2026-0001")).toBe(true);
    expect(() => oblikujStevilko(2026, 0)).toThrow();
  });

  it("leto je leto v Ljubljani", () => {
    expect(letoVLjubljani(new Date("2026-12-31T22:59:00Z"))).toBe(2026);
    expect(letoVLjubljani(new Date("2026-12-31T23:00:00Z"))).toBe(2027);
  });
});

describe("žeton (Z32)", () => {
  it("je naključen in dolg vsaj 32 znakov, primeren za URL", () => {
    const a = ustvariZeton();
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(ustvariZeton()).not.toBe(a);
  });

  it("primerjava zavrne prazen, krajši ali drugačen žeton", () => {
    const z = ustvariZeton();
    expect(zetonaSeUjemata(z, z)).toBe(true);
    expect(zetonaSeUjemata(z, z.slice(1))).toBe(false);
    expect(zetonaSeUjemata(z, `${z.slice(0, -1)}x`)).toBe(z.endsWith("x"));
    expect(zetonaSeUjemata(z, null)).toBe(false);
    expect(zetonaSeUjemata(z, "")).toBe(false);
    expect(zetonaSeUjemata(null, null)).toBe(false);
  });
});
