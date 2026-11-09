import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Varovala identitete (Z1, Z6):
 *  1. pari besedila in ozadja iz tokenov dosegajo kontrast WCAG 2.2 AA,
 *  2. nove komponente in slogovni vodnik ne vsebujejo surovih barv in ne
 *     uporabljajo prehodne palete stare strani.
 */

const koren = join(__dirname, "..", "..", "..");
const css = readFileSync(join(koren, "src/app/globals.css"), "utf8");

function tokeni(): Record<string, string> {
  const theme = css.slice(css.search(/@theme( static)? \{/));
  const izid: Record<string, string> = {};
  for (const m of theme.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    izid[m[1]] = m[2].toLowerCase();
  }
  return izid;
}

function svetlost(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function kontrast(a: string, b: string) {
  const [x, y] = [svetlost(a), svetlost(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const BESEDILO = 4.5;
const KONTROLNIK = 3;

// [ospredje, ozadje, najmanjši kontrast]
const pari: Array<[string, string, number]> = [
  ...["canvas", "surface", "surface-muted"].flatMap((ozadje) =>
    ["ink", "ink-muted", "ink-subtle", "brand", "accent", "danger"].map(
      (b) => [b, ozadje, BESEDILO] as [string, string, number],
    ),
  ),
  ["ink-inverse", "surface-inverse", BESEDILO],
  ["ink-inverse-muted", "surface-inverse", BESEDILO],
  ["on-brand", "brand", BESEDILO],
  ["on-brand", "brand-strong", BESEDILO],
  ["on-accent", "accent", BESEDILO],
  ["on-accent", "accent-strong", BESEDILO],
  ["on-accent", "danger", BESEDILO],
  ["on-accent", "danger-strong", BESEDILO],
  ["brand", "brand-soft", BESEDILO],
  ["ink", "brand-soft", BESEDILO],
  ["accent-strong", "accent-soft", BESEDILO],
  ["success", "success-soft", BESEDILO],
  ["warning", "warning-soft", BESEDILO],
  ["danger", "danger-soft", BESEDILO],
  ["info", "info-soft", BESEDILO],
  ["ink-muted", "surface-muted", BESEDILO],
  // Robovi kontrolnikov in obroč fokusa (WCAG 1.4.11).
  ["line-strong", "surface", KONTROLNIK],
  ["line-strong", "canvas", KONTROLNIK],
  ["focus", "canvas", KONTROLNIK],
  ["focus", "surface", KONTROLNIK],
  ["focus", "surface-muted", KONTROLNIK],
  ["brand", "surface", KONTROLNIK],
];

describe("tokeni identitete", () => {
  const t = tokeni();

  it("so definirani v @theme", () => {
    for (const [a, b] of pari) {
      expect(t[a], `--color-${a}`).toMatch(/^#/);
      expect(t[b], `--color-${b}`).toMatch(/^#/);
    }
  });

  it.each(pari)("%s na %s doseže vsaj %s : 1", (a, b, min) => {
    expect(kontrast(t[a], t[b])).toBeGreaterThanOrEqual(min);
  });

  it("privzeta paleta Tailwind je izklopljena", () => {
    expect(css).toMatch(/--color-\*:\s*initial/);
  });
});

/** Datoteke iz stare strani, ki jih K5 zgradi na novo ali odstrani. */
const PREHODNE = new Set([
  "src/components/ui/PageBackdrop.tsx",
  "src/components/ui/PageHeader.tsx",
  "src/components/ui/Pressable.tsx",
  "src/components/ui/Reveal.tsx",
  "src/components/ui/SectionHeading.tsx",
  "src/components/ui/sectionShell.ts",
]);

function datoteke(mapa: string): string[] {
  return readdirSync(mapa).flatMap((ime) => {
    const pot = join(mapa, ime);
    if (statSync(pot).isDirectory()) return datoteke(pot);
    return /\.tsx?$/.test(ime) && !/\.test\.tsx?$/.test(ime) ? [pot] : [];
  });
}

const pregledane = ["src/components/ui", "src/app/styleguide"]
  .flatMap((m) => datoteke(join(koren, m)))
  .map((p) => relative(koren, p))
  .filter((p) => !PREHODNE.has(p));

const prehodnaPaleta =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|outline|shadow|decoration)-(?:green-(?:deep|mid|light|bright)|cream(?:-dark)?|brown(?:-light)?|ink-(?:mid|light)|white)\b/;

describe("komponente uporabljajo samo tokene", () => {
  it("pregleda vsaj komponente knjižnice", () => {
    expect(pregledane).toContain("src/components/ui/Button.tsx");
  });

  it.each(pregledane)("%s nima surovih barv", (pot) => {
    const vsebina = readFileSync(join(koren, pot), "utf8");
    expect(vsebina).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(vsebina).not.toMatch(/\b(?:rgba?|hsla?|oklch|oklab)\(/i);
    expect(vsebina).not.toMatch(/-\[#/);
    expect(vsebina).not.toMatch(prehodnaPaleta);
  });
});
