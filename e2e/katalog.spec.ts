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
    await expect(nav.getByRole("link", { name: "Trgovina" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Trgovina" })).toHaveAttribute("href", "/products?nakup=splet");
    await expect(nav.getByRole("link", { name: "O nas" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Domačija Tešlan, na domačo stran/ })).toBeVisible();
  });

  test("noga ima kontakt iz nastavitev in povezave na pravne strani", async ({ page }) => {
    await page.goto("/");
    const noga = page.locator("footer");
    await expect(noga.getByRole("link", { name: "040 578 512" })).toHaveAttribute("href", "tel:+38640578512");
    await expect(noga.getByRole("link", { name: /Podgora 15/ })).toHaveAttribute(
      "href",
      /google\.com\/maps\/search\/\?api=1&query=Podgora%2015/,
    );
    await expect(noga.getByRole("link", { name: "Splošni pogoji" })).toHaveAttribute("href", "/pogoji");
    await expect(noga.getByRole("link", { name: "Odstop od pogodbe" })).toHaveAttribute("href", "/odstop");
    await expect(noga.getByRole("link", { name: "Politika zasebnosti" })).toHaveAttribute("href", "/privacyPolicy");
  });

  test("mobilni meni je predal z navigacijo", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Odpri meni" }).click();
    const predal = page.getByRole("dialog", { name: "Meni" });
    await expect(predal).toBeVisible();
    await predal.getByRole("link", { name: "Trgovina" }).click();
    await expect(page).toHaveURL(/\/products\?nakup=splet$/);
    await expect(predal).toBeHidden();
  });
});

test.describe("domača stran (Z16)", () => {
  test("prvi gumb vodi v spletno trgovino, pod uvodom je darilni program", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/ekološk/i)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Izpostavljeno" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "V spletno trgovino" })).toHaveAttribute("href", "/products?nakup=splet");

    // Darilni program je prva sekcija za uvodom, s pripravljenimi darili in poslovnimi darili.
    const darila = page.locator("section", { has: page.locator("#darila-naslov") });
    await expect(page.locator("main > section").nth(0)).toHaveAttribute("aria-labelledby", "uvod-naslov");
    await expect(page.locator("main > section").nth(1)).toHaveAttribute("aria-labelledby", "darila-naslov");
    await expect(darila.getByRole("link", { name: "Okusi Dolenjske" })).toHaveAttribute(
      "href",
      "/darila/sestavi?program=okusi-dolenjske",
    );
    await expect(darila.getByRole("heading", { name: "Poslovna darila" })).toBeVisible();
    await expect(darila.getByRole("link", { name: "Izberite darilo" })).toHaveAttribute("href", "/darila");
  });

  test("prikazuje skupine ponudbe s ceno", async ({ page }) => {
    await page.goto("/");
    for (const skupina of ["Sveže z njive", "Začimbe in posušeno", "Sladko", "Iz domače kuhinje"]) {
      await expect(page.getByRole("heading", { name: skupina })).toBeVisible();
    }
    // Začimbe: najcenejša naročljiva velikost je 5,00 € (česen v prahu 41 ml).
    const zacimbe = page.locator("li", { has: page.getByRole("heading", { name: "Začimbe in posušeno" }) });
    await expect(zacimbe.getByText(/od\s*5,00\s€/)).toBeVisible();
    await expect(zacimbe.getByRole("link", { name: "Začimbe" })).toHaveAttribute("href", "/products?kategorija=zacimbe");
    await expect(page.getByText(/Na ceniku je \d+ izdelkov/)).toBeVisible();
  });
});

test.describe("domača stran: uvod in vsebina", () => {
  test("uvod je fotografija čez cel zaslon z dejstvi o nakupu, glava plava nad njim", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const uvod = page.locator("section", { has: page.locator("#uvod-naslov") });
    await expect(uvod.getByRole("heading", { level: 1 })).toHaveText(/Iz naše zemlje\s*na vašo mizo/);
    const okvir = await uvod.boundingBox();
    expect(okvir?.y).toBe(0);
    expect(okvir?.height).toBeGreaterThanOrEqual(800);
    await expect(uvod.locator("img")).toHaveAttribute("alt", "");
    const dejstva = uvod.getByRole("list", { name: "Nakup na kratko" });
    await expect(dejstva.getByText("Brezplačna poštnina")).toBeVisible();
    await expect(dejstva.getByText(/Pri naročilu nad 50,00\s€/)).toBeVisible();
    await expect(dejstva.getByText("Prevzem na kmetiji")).toBeVisible();
    // Glava je `fixed` nad uvodom in ostane vidna na vrhu strani.
    await expect(page.getByRole("banner")).toHaveCSS("position", "fixed");
    await expect(page.getByRole("banner").getByRole("link", { name: "Trgovina" })).toBeVisible();
  });

  test("izbor iz trgovine, koraki naročila, koledar sezone in pogosta vprašanja", async ({ page }) => {
    await page.goto("/");
    const izbor = page.locator("section", { has: page.locator("#izbor-naslov") });
    await expect(izbor.locator("[data-izdelek]")).toHaveCount(4);
    await expect(izbor.getByRole("link", { name: "Vsa spletna trgovina" })).toHaveAttribute("href", "/products?nakup=splet");
    // V izboru so samo izdelki, ki jih je mogoče naročiti (nikoli „Na voljo na kmetiji“).
    await expect(izbor.getByText("Na voljo na kmetiji")).toHaveCount(0);

    await expect(page.getByRole("heading", { name: "Naročilo v treh korakih" })).toBeVisible();
    await expect(page.getByText(/Po pošti za 5,00\s€ \(nad 50,00\s€ brezplačno\)/)).toBeVisible();

    const koledar = page.getByRole("table", { name: "Koledar sezone svežih pridelkov po mesecih" });
    await expect(koledar.getByRole("rowheader", { name: /Šparglji/ })).toBeVisible();
    await expect(koledar.getByRole("row", { name: /Šparglji/ }).getByText("april: v sezoni")).toBeAttached();
    await expect(koledar.getByRole("row", { name: /Šparglji/ }).getByText("november: ni v sezoni")).toBeAttached();

    const vprasanja = page.locator("section", { has: page.locator("#vprasanja-naslov") });
    await vprasanja.getByText("Koliko stane poštnina?").click();
    await expect(vprasanja.getByText(/Poštnina za pošiljko po Sloveniji je 5,00\s€/)).toBeVisible();
    await expect(vprasanja.getByRole("link", { name: "Vsa vprašanja in odgovori" })).toHaveAttribute("href", "/vprasanja");
  });
});

test.describe("pomoč pri nakupu", () => {
  test("dostava in plačilo: zneski iz nastavitev, izdelki samo za prevzem iz kataloga", async ({ page }) => {
    await page.goto("/dostava");
    await expect(page.getByRole("heading", { level: 1, name: "Dostava in plačilo" })).toBeVisible();
    await expect(page.getByText(/5,00\s€ · brezplačno pri naročilu nad 50,00\s€/)).toBeVisible();
    const samoPrevzem = page.locator("#samo-prevzem");
    await expect(samoPrevzem.getByRole("link", { name: "Jajca kokošja" })).toHaveAttribute("href", "/products/jajca-kokosja");
    await expect(samoPrevzem.getByRole("link", { name: "Česen v prahu" })).toHaveCount(0);
    await expect(page.getByText(/ekološk/i)).toHaveCount(0);
    // Osnutek je označen samo na stagingu (NOINDEX=1), ne v produkciji.
    await expect(page.getByText("Osnutek besedila")).toHaveCount(0);
  });

  test("pogosta vprašanja: sklopi, odgovori in strukturirani podatki", async ({ page }) => {
    await page.goto("/vprasanja");
    await expect(page.getByRole("heading", { level: 1, name: "Pogosta vprašanja" })).toBeVisible();
    for (const sklop of ["Naročilo", "Dostava in prevzem", "Plačilo", "Darila", "Izdelki"]) {
      await expect(page.getByRole("heading", { level: 2, name: sklop, exact: true })).toBeVisible();
    }
    await page.getByText("Zakaj nekaterih izdelkov ne pošiljate po pošti?").click();
    await expect(page.getByText(/celotno naročilo prevzamete na kmetiji/).first()).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((x) => JSON.parse(x)["@type"] === "FAQPage")).toBe(true);
    await expect(page.getByText(/ekološk/i)).toHaveCount(0);
  });

  test("noga vodi na pomoč pri nakupu", async ({ page }) => {
    await page.goto("/");
    const pomoc = page.locator("footer").getByRole("navigation", { name: "Pomoč pri nakupu" });
    await expect(pomoc.getByRole("link", { name: "Dostava in plačilo" })).toHaveAttribute("href", "/dostava");
    await expect(pomoc.getByRole("link", { name: "Pogosta vprašanja" })).toHaveAttribute("href", "/vprasanja");
    await expect(pomoc.getByRole("link", { name: "Kontakt" })).toHaveAttribute("href", "/about#kontakt");
  });
});

test.describe("seznam izdelkov (Z14)", () => {
  test("na telefonu sta v vrsti dve kartici, naročljivi izdelki so pred nenaročljivimi", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/products");
    const prva = await kartica(page, "Česen v prahu").boundingBox();
    expect(prva?.width).toBeLessThan(200);
    // Jagode (samo na kmetiji) so za vsemi izdelki, ki jih je mogoče naročiti.
    const imena = await page.locator("main [data-izdelek]").evaluateAll((els) =>
      els.map((e) => e.getAttribute("data-izdelek")),
    );
    expect(imena.indexOf("jagode")).toBeGreaterThan(imena.indexOf("cesen-v-prahu"));
    expect(imena.indexOf("jagode")).toBeGreaterThan(imena.indexOf("aronija-sok"));
  });

  test("izdelek z eno velikostjo gre v košarico neposredno s kartice", async ({ page }) => {
    await page.goto("/products?kategorija=sokovi");
    const sok = kartica(page, "Aronija sok");
    await sok.getByRole("button", { name: "Dodaj v košarico: Aronija sok, 1 L" }).click();
    await expect(page.getByText("Dodano v košarico", { exact: true }).last()).toBeVisible();
    await expect(page).toHaveURL(/\/products\?kategorija=sokovi$/);
    await expect(page.getByRole("banner").getByRole("link", { name: /^Košarica/ })).toHaveAccessibleName("Košarica, 1 kos");

    // Izdelek z več velikostmi gumba nima: velikost se izbere na podstrani.
    await page.goto("/products?kategorija=zacimbe");
    await expect(kartica(page, "Česen v prahu").getByRole("button")).toHaveCount(0);
    await expect(kartica(page, "Česen v prahu").getByText("2 velikosti")).toBeVisible();
  });


  test("prikazuje izdelke s ceno „od“ in oznakami razpoložljivosti", async ({ page }) => {
    await page.goto("/products");
    const cesen = kartica(page, "Česen v prahu");
    await expect(cesen.getByText(/od\s*5,00\s€/)).toBeVisible();
    await expect(cesen.getByText("Na zalogi")).toBeVisible();

    const jajca = kartica(page, "Jajca kokošja");
    await expect(jajca.getByText("Na voljo na kmetiji")).toBeVisible();
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

  test("način nakupa loči spletno trgovino od izdelkov, ki so na voljo na kmetiji", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "V spletno trgovino" }).click();
    await expect(page).toHaveURL(/\/products\?nakup=splet$/);
    const nacin = page.getByRole("navigation", { name: "Način nakupa" });
    await expect(nacin.getByRole("link", { name: /^Spletna trgovina/ })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { level: 1, name: "Naročite na spletu" })).toBeVisible();
    await expect(kartica(page, "Česen v prahu").getByText("Pošljemo po pošti")).toBeVisible();
    // V spletni trgovini ni ničesar, kar ni za pošto (ne jajc za prevzem ne jagod).
    await expect(kartica(page, "Jajca kokošja")).toHaveCount(0);
    await expect(kartica(page, "Jagode")).toHaveCount(0);
    await expect(page.locator("main").getByText("Na voljo na kmetiji")).toHaveCount(0);

    // Izbrana kategorija ostane, filter kategorij ohrani način nakupa.
    const kategorije = page.getByRole("navigation", { name: "Kategorije izdelkov" });
    await kategorije.getByRole("link", { name: /^Začimbe/ }).click();
    await expect(page).toHaveURL(/\?nakup=splet&kategorija=zacimbe$/);

    await nacin.getByRole("link", { name: /^Na kmetiji/ }).click();
    // Začimb na kmetiji ni, zato kategorija pade.
    await expect(page).toHaveURL(/\?nakup=kmetija$/);
    // Izdelki za prevzem in samo za ogled imajo isto oznako.
    await expect(kartica(page, "Jagode").getByText("Na voljo na kmetiji")).toBeVisible();
    await expect(kartica(page, "Jajca kokošja").getByText("Na voljo na kmetiji")).toBeVisible();
    await expect(kartica(page, "Česen v prahu")).toHaveCount(0);

    await nacin.getByRole("link", { name: /^Vsi izdelki/ }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(kartica(page, "Jagode")).toBeVisible();
    await expect(kartica(page, "Česen v prahu")).toBeVisible();
  });

  test("ob odprtju nove strani je pogled na vrhu", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Glavna navigacija" });
    for (const [zamik, povezava, pot] of [
      [0, "Trgovina", /\/products/],
      [40, "Darila", /\/darila$/],
      [0, "O nas", /\/about$/],
    ] as const) {
      await page.evaluate((y) => window.scrollTo(0, y), zamik);
      await nav.getByRole("link", { name: povezava }).click();
      await expect(page).toHaveURL(pot);
      await page.waitForLoadState("networkidle");
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    }
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

    await expect(page.getByRole("button", { name: "V košarico", exact: true })).toBeEnabled();
  });

  test("pove, kako izdelek pride do kupca, in ponudi sorodne izdelke", async ({ page }) => {
    await page.goto("/products/cesen-v-prahu");
    const dostava = page.getByRole("region", { name: "Dostava in prevzem" });
    await expect(dostava).toContainText(/Poštnina 5,00\s€, pri naročilu nad 50,00\s€ brezplačno/);
    await expect(dostava.getByRole("link", { name: "Več o dostavi in plačilu" })).toHaveAttribute("href", "/dostava");
    const sorodni = page.getByRole("region", { name: "Morda vam bo všeč tudi" });
    await expect(sorodni.locator("[data-izdelek]")).toHaveCount(4);
    await expect(sorodni.locator('[data-izdelek="cesen-v-prahu"]')).toHaveCount(0);
    // Najprej izdelki iste kategorije (začimbe).
    await expect(sorodni.locator("[data-izdelek]").first()).toContainText("Začimbe");

    // Izdelek samo za prevzem to pove že tu, ne šele v košarici (T4).
    await page.goto("/products/jajca-kokosja");
    await expect(page.getByRole("region", { name: "Dostava in prevzem" })).toContainText(
      "Tega izdelka ne pošiljamo po pošti. Če ga dodate v košarico, celotno naročilo prevzamete na kmetiji.",
    );
    await page.goto("/products/jagode");
    await expect(page.getByRole("region", { name: "Dostava in prevzem" })).toHaveCount(0);
  });

  test("ima zgodbo izdelka in gumb nazaj na prejšnjo stran", async ({ page }) => {
    await page.goto("/products?nakup=splet&kategorija=zacimbe");
    await page.getByRole("link", { name: "Česen v prahu", exact: true }).click();
    await expect(page).toHaveURL(/\/products\/cesen-v-prahu$/);
    const zgodba = page.getByRole("region", { name: "Česen v prahu z Domačije Tešlan" });
    await expect(zgodba).toContainText("v fin prah");

    // Nazaj vrne na seznam z istim filtrom.
    await page.getByRole("link", { name: "Nazaj", exact: true }).click();
    await expect(page).toHaveURL(/\/products\?nakup=splet&kategorija=zacimbe$/);

    // Brez zgodovine (neposreden obisk) vodi na seznam, kamor izdelek spada.
    await page.goto("/products/jagode");
    await expect(page.getByRole("link", { name: "Nazaj", exact: true })).toHaveAttribute("href", "/products?nakup=kmetija");
  });

  test("izdelek brez slike ima nadomestno ploskev", async ({ page }) => {
    await page.goto("/products/cebula-v-prahu");
    await expect(page.getByRole("img", { name: "Čebula v prahu: slika še ni na voljo" })).toBeVisible();
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
    // Gumbi za hiter nakup pri sorodnih izdelkih ne štejejo: gre za druge izdelke.
    await expect(page.getByRole("button", { name: "V košarico", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Dodaj v košarico: Jagode/ })).toHaveCount(0);
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

// Axe na vseh javnih straneh (namizje in mobilno) je v dostopnost.spec.ts (S17).
