import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { dodaj } from "./blagajna-pomocniki";

/**
 * Dostopnost (K13: Z6, S17). Axe z vsemi pravili (WCAG 2.2 AA in dobre
 * prakse) na vseh javnih straneh, na namizju in na mobilnem zaslonu; S17
 * zahteva 0 kršitev stopnje „serious“ ali „critical“. Košarica in blagajna
 * se preverita polni (česen v prahu, ne vpliva na zalogo, ker ne oddamo
 * naročila). Stanja z napakami in odprtimi dialogi preverjajo še
 * `blagajna.spec.ts`, `kosarica.spec.ts`, `darila.spec.ts` in slogovni vodnik.
 */

async function brezResnihKrsitev(page: Page) {
  const rezultat = await new AxeBuilder({ page }).analyze();
  const resne = rezultat.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(resne.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

const STRANI = [
  "/",
  "/products",
  "/products?nakup=splet",
  "/products/cesen-v-prahu",
  "/products/jagode",
  "/darila",
  "/darila/sestavi",
  "/about",
  "/privacyPolicy",
  "/pogoji",
  "/odstop",
];

const ZASLONI = [
  { ime: "namizje", viewport: { width: 1280, height: 900 }, hasTouch: false },
  { ime: "mobilno", viewport: { width: 390, height: 844 }, hasTouch: true },
];

for (const zaslon of ZASLONI) {
  test.describe(`axe (${zaslon.ime})`, () => {
    test.use({ viewport: zaslon.viewport, hasTouch: zaslon.hasTouch });

    for (const pot of STRANI) {
      test(`${pot} nima resnih ali kritičnih kršitev`, async ({ page }) => {
        const odziv = await page.goto(pot);
        expect(odziv?.status()).toBe(200);
        await brezResnihKrsitev(page);
      });
    }

    test("polna košarica in blagajna nimata resnih ali kritičnih kršitev", async ({ page }) => {
      await dodaj(page, "cesen-v-prahu", /41 ml/);
      await page.goto("/kosarica");
      await expect(page.getByRole("region", { name: "Povzetek" })).toBeVisible();
      await brezResnihKrsitev(page);
      await page.goto("/blagajna");
      await expect(page.getByRole("button", { name: "Oddaj naročilo" })).toBeVisible();
      await brezResnihKrsitev(page);
    });

    test("neobstoječa pot: 404 v slovenščini, z glavno regijo in brez kršitev", async ({ page }) => {
      const odziv = await page.goto("/ta-stran-ne-obstaja");
      expect(odziv?.status()).toBe(404);
      await expect(page.locator("html")).toHaveAttribute("lang", "sl");
      await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText("Strani ni mogoče najti");
      await brezResnihKrsitev(page);
      await page.getByRole("link", { name: "Na seznam izdelkov" }).click();
      await expect(page).toHaveURL(/\/products$/);
    });
  });
}

test.describe("mobilni meni (Z7)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("odprt meni nima kršitev, upravlja se s tipkovnico", async ({ page }) => {
    await page.goto("/");
    const gumb = page.getByRole("button", { name: "Odpri meni" });
    await gumb.focus();
    await page.keyboard.press("Enter");
    const meni = page.getByRole("dialog");
    await expect(meni).toBeVisible();
    await expect(meni.getByRole("link", { name: "Trgovina" })).toBeVisible();
    await brezResnihKrsitev(page);
    await page.keyboard.press("Escape");
    await expect(meni).toBeHidden();
    await expect(gumb).toBeFocused();
  });
});

test.describe("tipkovnica (Z6)", () => {
  test("prvi Tab pokaže povezavo „Skoči na vsebino“, ki premakne fokus na vsebino", async ({ page }) => {
    await page.goto("/products");
    await page.keyboard.press("Tab");
    const preskok = page.getByRole("link", { name: "Skoči na vsebino" });
    await expect(preskok).toBeFocused();
    await expect(preskok).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#vsebina$/);
    // Naslednji Tab ne gre več v glavo, ampak na prvi element vsebine.
    await page.keyboard.press("Tab");
    const vGlavi = await page.evaluate(() => !!document.activeElement?.closest("header"));
    expect(vGlavi).toBe(false);
  });

  test("vsak interaktiven element na domači strani ima viden fokus", async ({ page }) => {
    await page.goto("/");
    // Prvih 25 korakov s tabulatorjem: fokus mora biti vedno viden (obroba
    // ali obroč na elementu), nikoli `outline: none` brez nadomestka.
    // Raztegnjene povezave na karticah izdelkov obrobo prenesejo na kartico
    // (`has-[a:focus-visible]`), zato šteje tudi obroba bližnjega prednika.
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const fokus = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const obroba = (e: Element) => {
          const s = getComputedStyle(e);
          return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
        };
        let prednik: Element | null = el.parentElement;
        let obrobaPrednika = false;
        for (let n = 0; prednik && n < 4 && !obrobaPrednika; n++, prednik = prednik.parentElement) {
          obrobaPrednika = obroba(prednik);
        }
        const viden = obroba(el) || getComputedStyle(el).boxShadow !== "none" || obrobaPrednika;
        return { oznaka: el.outerHTML.slice(0, 80), viden };
      });
      if (!fokus) continue;
      expect(fokus.viden, fokus.oznaka).toBe(true);
    }
  });
});

test.describe("zmanjšano gibanje (Z6)", () => {
  test.use({ reducedMotion: "reduce" });

  test("vsebina, ki se ob drsenju razkrije, je vidna", async ({ page }) => {
    await page.goto("/");
    const obisk = page.locator("#obisk");
    await obisk.scrollIntoViewIfNeeded();
    await expect(obisk.getByRole("heading").first()).toBeVisible();
    await expect
      .poll(() => obisk.locator("[style*='opacity']").evaluateAll((els) => els.every((e) => getComputedStyle(e).opacity === "1")))
      .toBe(true);
  });
});
