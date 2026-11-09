import { describe, expect, it } from "vitest";
import { formatirajCeno } from "./denar";

const NBSP = " ";

describe("formatirajCeno", () => {
  it("izpiše evre s slovensko decimalno vejico", () => {
    expect(formatirajCeno(1250)).toBe(`12,50${NBSP}€`);
    expect(formatirajCeno(500)).toBe(`5,00${NBSP}€`);
    expect(formatirajCeno(0)).toBe(`0,00${NBSP}€`);
  });

  it("loči tisočice s piko šele od petih števk (slovenski CLDR)", () => {
    expect(formatirajCeno(123456)).toBe(`1234,56${NBSP}€`);
    expect(formatirajCeno(1234556)).toBe(`12.345,56${NBSP}€`);
  });

  it("zavrne necele cente", () => {
    expect(() => formatirajCeno(12.5)).toThrow(TypeError);
  });
});
