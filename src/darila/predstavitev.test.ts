import { describe, expect, it } from "vitest";
import { prazniskiCas } from "./predstavitev";

describe("praznični čas", () => {
  it("velja v novembru in decembru", () => {
    expect(prazniskiCas(new Date(2026, 10, 1))).toBe(true);
    expect(prazniskiCas(new Date(2026, 11, 31))).toBe(true);
    expect(prazniskiCas(new Date(2027, 0, 2))).toBe(false);
    expect(prazniskiCas(new Date(2026, 6, 15))).toBe(false);
  });
});
