import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Slogovni vodnik na stagingu (NOINDEX=1): Z1–Z4 in Z6.
 * Preverja, da se stran odzove, da nima kršitev dostopnosti in da so
 * interaktivne komponente upravljive s tipkovnico.
 */

async function odpri(page: Page) {
  const odziv = await page.goto("/styleguide");
  expect(odziv?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Slogovni vodnik" })).toBeVisible();
}

test("se odzove in ni indeksiran", async ({ page }) => {
  await odpri(page);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("nima resnih ali kritičnih kršitev dostopnosti (axe, WCAG 2.2 AA)", async ({ page }) => {
  await odpri(page);
  const rezultat = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const resne = rezultat.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    resne.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
});

test("uporablja pisavi identitete in tokene", async ({ page }) => {
  await odpri(page);
  const h1 = await page.locator("h1").first().evaluate((el) => getComputedStyle(el).fontFamily);
  const body = await page.locator("body").evaluate((el) => getComputedStyle(el).fontFamily);
  expect(h1).toMatch(/Fraunces/i);
  expect(body).toMatch(/Inter/i);
});

test("dialog: odpre se s tipkovnico, Esc ga zapre, fokus se vrne", async ({ page }) => {
  await odpri(page);
  const sprozilec = page.getByRole("button", { name: "Odstrani iz košarice" });
  await sprozilec.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Odstranim darilno škatlo?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Prekliči" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(sprozilec).toBeFocused();
});

test("predal: odpre se in zapre z gumbom Zapri", async ({ page }) => {
  await odpri(page);
  await page.getByRole("button", { name: "Predal desno" }).click();
  const predal = page.getByRole("dialog", { name: "Košarica" });
  await expect(predal).toBeVisible();
  await predal.getByRole("button", { name: "Zapri" }).click();
  await expect(predal).toBeHidden();
});

test("izbirni gumbi: puščica premakne izbiro", async ({ page }) => {
  await odpri(page);
  const skupina = page.getByRole("radiogroup", { name: "Plačilo" });
  await skupina.getByRole("radio", { name: "Kartica" }).focus();
  // Radix premakne fokus v naslednjem opravilu in izbere, dokler je
  // puščica pritisnjena; spust zato pride šele po izbiri, kot pri človeku.
  await page.keyboard.down("ArrowRight");
  await expect(skupina.getByRole("radio", { name: "Ob prevzemu" })).toBeChecked();
  await page.keyboard.up("ArrowRight");
  await expect(skupina.getByRole("radio", { name: "Ob prevzemu" })).toBeFocused();
});

test("izbirni seznam: izbira s tipkovnico", async ({ page }) => {
  await odpri(page);
  const sprozilec = page.getByRole("combobox", { name: "Kategorija" });
  await expect(sprozilec).toHaveText("Začimbe");
  await sprozilec.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("option", { name: "Olja" }).click();
  await expect(sprozilec).toHaveText("Olja");
});

test("količina ostane v mejah", async ({ page }) => {
  await odpri(page);
  const manj = page.getByRole("button", { name: "Zmanjšaj količino" });
  const vec = page.getByRole("button", { name: "Povečaj količino" });
  const polje = page.getByRole("spinbutton", { name: "Količina" });
  await expect(manj).toBeDisabled();
  for (let i = 0; i < 4; i++) await vec.click();
  await expect(polje).toHaveValue("5");
  await expect(vec).toBeDisabled();
});

test("obvestilo se prikaže in ga je mogoče zapreti", async ({ page }) => {
  await odpri(page);
  await page.getByRole("button", { name: "Uspeh" }).click();
  const obvestilo = page.getByRole("status").filter({ hasText: "Dodano v košarico" });
  await expect(obvestilo).toBeVisible();
  await page.getByRole("button", { name: "Zapri obvestilo" }).click();
  await expect(obvestilo).toBeHidden();
});

test("polje z napako je označeno in povezano z opisom napake", async ({ page }) => {
  await odpri(page);
  const polje = page.getByRole("textbox", { name: "Poštna številka" });
  await expect(polje).toHaveAttribute("aria-invalid", "true");
  await expect(polje).toHaveAccessibleDescription("Vpišite štirimestno poštno številko.");
});
