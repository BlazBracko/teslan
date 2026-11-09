import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Javne strani kataloga (K5: Z5, Z7, Z8, Z13–Z16, S14) na seedani testni
 * bazi. Testi ne smejo biti odvisni od trenutnega meseca, zato preverjajo
 * izdelke brez sezone (česen v prahu, kokošja jajca) in `samo-prikaz`
 * (jagode, ki so vedno „Na voljo na kmetiji“). Vloženih jurčkov ne
 * uporabljajo, ker jim `admin.spec.ts` spreminja zalogo.
 */

const kartica = (page: Page, ime: string) =>
  page.locator("main li", { has: page.getByRole("heading", { name: ime, exact: true }) });

test.describe("glava in noga (Z7, Z8)", () => {
  test("glava ima navigacijo, aktivna stran je označena", async ({ page }) => {
    await page.goto("/products");
    const nav = page.getByRole("navigation", { name: "Glavna navigacija" });
    await expect(nav.getByRole("link", { name: "Domov" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Izdelki" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "O nas" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Domačija Tešlan, na domačo stran/ })).toBeVisible();
  });

  test("noga ima kontakt iz nastavitev in povezavo na zasebnost", async ({ page }) => {
    await page.goto("/");
    const noga = page.locator("footer");
    await expect(noga.getByRole("link", { name: "040 578 512" })).toHaveAttribute("href", "tel:+38640578512");
    await expect(noga.getByRole("link", { name: /Podgora 15/ })).toHaveAttribute(
      "href",
      /google\.com\/maps\/search\/\?api=1&query=Podgora%2015/,
    );
    await expect(noga.getByRole("link", { name: "Politika zasebnosti" })).toHaveAttribute("href", "/privacyPolicy");
  });

  test("mobilni meni je predal z navigacijo", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Odpri meni" }).click();
    const predal = page.getByRole("dialog", { name: "Meni" });
    await expect(predal).toBeVisible();
    await predal.getByRole("link", { name: "Izdelki" }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(predal).toBeHidden();
  });
});

test.describe("domača stran (Z16)", () => {
  test("prikazuje skupine ponudbe s ceno in izpostavljene izdelke", async ({ page }) => {
    await page.goto("/");
    for (const skupina of ["Sveže z njive", "Začimbe in posušeno", "Sladko", "Iz domače kuhinje"]) {
      await expect(page.getByRole("heading", { name: skupina })).toBeVisible();
    }
    // Začimbe: najcenejša naročljiva velikost je 5,00 € (česen v prahu 41 ml).
    const zacimbe = page.locator("li", { has: page.getByRole("heading", { name: "Začimbe in posušeno" }) });
    await expect(zacimbe.getByText(/od\s*5,00\s€/)).toBeVisible();
    await expect(zacimbe.getByRole("link", { name: "Začimbe" })).toHaveAttribute("href", "/products?kategorija=zacimbe");
    // Izpostavljena sta šparglji in jagode (seed).
    await expect(page.getByRole("link", { name: "Šparglji", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Jagode", exact: true })).toBeVisible();
    await expect(page.getByText(/Na ceniku je \d+ izdelkov/)).toBeVisible();
  });
});

test.describe("seznam izdelkov (Z14)", () => {
  test("prikazuje izdelke s ceno „od“ in oznakami razpoložljivosti", async ({ page }) => {
    await page.goto("/products");
    const cesen = kartica(page, "Česen v prahu");
    await expect(cesen.getByText(/od\s*5,00\s€/)).toBeVisible();
    await expect(cesen.getByText("Na zalogi")).toBeVisible();

    const jajca = kartica(page, "Jajca kokošja");
    await expect(jajca.getByText("Samo prevzem na kmetiji")).toBeVisible();
  });

  test("filter po kategoriji je v URL in ga je mogoče deliti", async ({ page }) => {
    await page.goto("/products");
    const filter = page.getByRole("navigation", { name: "Kategorije izdelkov" });
    await filter.getByRole("link", { name: /^Začimbe/ }).click();
    await expect(page).toHaveURL(/\?kategorija=zacimbe$/);
    await expect(filter.getByRole("link", { name: /^Začimbe/ })).toHaveAttribute("aria-current", "page");
    await expect(kartica(page, "Česen v prahu")).toBeVisible();
    await expect(kartica(page, "Bučno olje")).toHaveCount(0);

    // Neposreden obisk z istim URL da isti rezultat; neznana kategorija pokaže vse.
    await page.goto("/products?kategorija=olja");
    await expect(kartica(page, "Bučno olje")).toBeVisible();
    await expect(kartica(page, "Česen v prahu")).toHaveCount(0);
    await page.goto("/products?kategorija=ne-obstaja");
    await expect(kartica(page, "Bučno olje")).toBeVisible();
    await expect(kartica(page, "Česen v prahu")).toBeVisible();
  });

  test("kartica vodi na podstran izdelka", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("link", { name: "Česen v prahu", exact: true }).click();
    await expect(page).toHaveURL(/\/products\/cesen-v-prahu$/);
    await expect(page.getByRole("heading", { level: 1, name: "Česen v prahu" })).toBeVisible();
  });
});

test.describe("podstran izdelka (Z13, Z15)", () => {
  test("izbira velikosti in količine", async ({ page }) => {
    await page.goto("/products/cesen-v-prahu");
    await expect(page).toHaveTitle(/Česen v prahu/);
    await expect(page.getByRole("navigation", { name: "Drobtinice" }).getByRole("link", { name: "Začimbe" })).toBeVisible();

    const velikosti = page.getByRole("radiogroup");
    await expect(velikosti.getByRole("radio")).toHaveCount(2);
    await expect(velikosti.getByRole("radio", { name: /41 ml/ })).toBeChecked();
    await velikosti.getByRole("radio", { name: /106 ml/ }).click();
    await expect(page.getByText(/Skupaj\s*12,00\s€/)).toBeVisible();

    const kolicina = page.getByRole("spinbutton");
    await expect(kolicina).toHaveAttribute("max", "20");
    await page.getByRole("button", { name: "Povečaj količino" }).click();
    await expect(kolicina).toHaveValue("2");
    await expect(page.getByText(/Skupaj\s*24,00\s€/)).toBeVisible();

    await expect(page.getByRole("button", { name: "V košarico" })).toBeEnabled();
  });

  test("izdelek brez slike ima nadomestno ploskev", async ({ page }) => {
    await page.goto("/products/cebula-v-prahu");
    await expect(page.getByRole("img", { name: /slika še ni na voljo/ })).toBeVisible();
  });
});

test.describe("S14: samo prikaz in neobjavljeni izdelki", () => {
  test("izdelek samo-prikaz je na seznamu, a brez gumba „V košarico“", async ({ page }) => {
    await page.goto("/products");
    const jagode = kartica(page, "Jagode");
    await expect(jagode).toBeVisible();
    await expect(jagode.getByText("Na voljo na kmetiji")).toBeVisible();
    await expect(jagode.getByText("€")).toHaveCount(0);

    await page.goto("/products/jagode");
    await expect(page.getByRole("heading", { level: 1, name: "Jagode" })).toBeVisible();
    await expect(page.getByText("Na voljo na kmetiji").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "V košarico" })).toHaveCount(0);
    await expect(page.getByRole("radio")).toHaveCount(0);
  });

  test("neobjavljen izdelek ni na seznamu in njegova podstran vrne 404", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByText("Skriti testni izdelek")).toHaveCount(0);

    const odziv = await page.goto("/products/skriti-izdelek");
    expect(odziv?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Strani ni mogoče najti" })).toBeVisible();
  });

  test("neobstoječ izdelek vrne 404", async ({ request }) => {
    const odziv = await request.get("/products/ta-izdelek-ne-obstaja");
    expect(odziv.status()).toBe(404);
  });
});

test.describe("dostopnost javnih strani (Z6)", () => {
  for (const pot of [
    "/",
    "/products",
    "/products/cesen-v-prahu",
    "/products/jagode",
    "/kosarica",
    "/blagajna",
    "/pogoji",
    "/about",
    "/privacyPolicy",
  ]) {
    test(`${pot} nima resnih ali kritičnih kršitev (axe)`, async ({ page }) => {
      await page.goto(pot);
      const rezultat = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const resne = rezultat.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(resne.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
