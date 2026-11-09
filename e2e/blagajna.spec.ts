import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { prebranaEposta } from "./eposta";

/**
 * Blagajna in naročila (K7: Z22, Z25, Z30–Z32, Z43, T2, T4, S9, S10).
 * Naročila oddajajo samo testi v tej datoteki, vsak na svojem izdelku, da
 * vzporedni testi ne vplivajo na zalogo: aronija sok (S9), suhi peteršilj
 * (Z30), testenine s šparglji (past za robote). Ostali testi le polnijo
 * košarico.
 */

const ikona = (page: Page) => page.getByRole("banner").getByRole("link", { name: /^Košarica/ });

async function dodaj(page: Page, slug: string, velikost: RegExp | null = null) {
  await page.goto(`/products/${slug}`);
  if (velikost) await page.getByRole("radiogroup").getByRole("radio", { name: velikost }).click();
  await page.getByRole("button", { name: "V košarico" }).click();
  await expect(page.getByText("Dodano v košarico", { exact: true }).last()).toBeVisible();
}

/** Id izdelka, prve velikosti in njena zaloga prek javnega REST. */
async function velikost(request: APIRequestContext, slug: string) {
  const odziv = await request.get(`/api/izdelki?where[slug][equals]=${slug}&depth=0`);
  expect(odziv.ok()).toBe(true);
  const { docs } = (await odziv.json()) as {
    docs: Array<{ id: number; velikosti: Array<{ id: string; zaloga: number }> }>;
  };
  return { izdelekId: docs[0].id, velikostId: docs[0].velikosti[0].id, zaloga: docs[0].velikosti[0].zaloga };
}

const zalogaIzdelka = async (request: APIRequestContext, slug: string) => (await velikost(request, slug)).zaloga;

async function izpolniKontakt(page: Page, ime = "Ana") {
  await page.getByRole("textbox", { name: "Ime", exact: true }).fill(ime);
  await page.getByRole("textbox", { name: "Priimek", exact: true }).fill("Novak");
  await page.getByRole("textbox", { name: "E-pošta", exact: true }).fill("ana.novak@primer.si");
  await page.getByRole("textbox", { name: "Telefon", exact: true }).fill("040 123 456");
}

const soglasje = (page: Page) => page.getByRole("checkbox", { name: /Strinjam se s splošnimi pogoji/ });
const dostava = (page: Page) => page.getByRole("radiogroup", { name: "Način dostave" });
const placilo = (page: Page) => page.getByRole("radiogroup", { name: "Način plačila" });

test.describe("blagajna (Z25, T2, T4)", () => {
  test("S9: naročilo za prevzem s plačilom ob prevzemu od košarice do potrdila", async ({ page, request }) => {
    const zalogaPrej = await zalogaIzdelka(request, "aronija-sok");
    await dodaj(page, "aronija-sok");
    await page.goto("/kosarica");
    await page.getByRole("link", { name: "Na blagajno" }).click();
    await expect(page).toHaveURL(/\/blagajna$/);
    await expect(page.getByRole("heading", { level: 1, name: "Blagajna" })).toBeVisible();

    await izpolniKontakt(page);
    await expect(dostava(page).getByRole("radio", { name: /Prevzem na kmetiji/ })).toBeChecked();
    await expect(placilo(page).getByRole("radio", { name: /Ob prevzemu/ })).toBeChecked();
    await expect(page.getByTestId("skupaj")).toHaveText(/10,00\s€/);
    await page.getByLabel("Opomba k naročilu").fill("Prevzem v soboto dopoldne.");
    await soglasje(page).click();
    await page.getByRole("button", { name: "Oddaj naročilo" }).click();

    await expect(page).toHaveURL(/\/narocilo\/T-\d{4}-\d{4,}\?k=[\w-]{32,}$/);
    await expect(page.getByRole("heading", { level: 1, name: "Hvala za vaše naročilo" })).toBeVisible();
    const stevilka = (await page.getByTestId("stevilka-narocila").textContent())!.trim();
    expect(stevilka).toMatch(/^T-\d{4}-\d{4,}$/);
    await expect(page.getByText("Aronija sok")).toBeVisible();
    await expect(page.getByText(/^Ob prevzemu: 10,00\s€$/)).toBeVisible();
    await expect(page.getByText("Prevzem v soboto dopoldne.")).toBeVisible();
    await expect(page.getByText("To ni račun.")).toBeVisible();
    await expect(page.getByText("Novo", { exact: true })).toBeVisible();
    // Košarica je po oddaji prazna.
    await expect(ikona(page)).toHaveAccessibleName("Košarica je prazna");

    // Zaloga −1.
    expect(await zalogaIzdelka(request, "aronija-sok")).toBe(zalogaPrej - 1);

    // E1 kupcu in E2 prodajalcu v dnevniku (Z43, Z58).
    const eposta = prebranaEposta().filter((e) => e.zadeva.includes(stevilka));
    expect(eposta.map((e) => e.za).sort()).toEqual(["ana.novak@primer.si", "sandi.dercar@gmail.com"]);
    const e1 = eposta.find((e) => e.za === "ana.novak@primer.si")!;
    expect(e1.besedilo).toContain("To ni račun.");
    expect(e1.besedilo).toContain(new URL(page.url()).search);

    // Brez pravilnega žetona je stran 404 (Z32).
    const pot = new URL(page.url());
    expect((await request.get(pot.pathname)).status()).toBe(404);
    expect((await request.get(`${pot.pathname}?k=napacen-zeton-${"x".repeat(32)}`)).status()).toBe(404);
    expect((await request.get(`${pot.pathname}${pot.search}`)).status()).toBe(200);
    expect((await request.get(`/narocilo/T-2026-9999${pot.search}`)).status()).toBe(404);
  });

  test("S10: košarica z jajci ne ponudi pošte; brez jajc pošta ponudi samo kartico (T4, Z22)", async ({ page }) => {
    await dodaj(page, "cesen-v-prahu", /41 ml/);
    await dodaj(page, "jajca-kokosja");
    await page.goto("/blagajna");
    const posta = dostava(page).getByRole("radio", { name: /Pošta/ });
    await expect(posta).toBeDisabled();
    await expect(dostava(page)).toContainText(
      "Ni mogoče, ker so v košarici izdelki samo za prevzem na kmetiji: Jajca kokošja.",
    );
    await expect(placilo(page).getByRole("radio")).toHaveCount(2);

    // Brez jajc je pošta mogoča, plačilo pa samo s kartico.
    await page.goto("/kosarica");
    await page.getByRole("button", { name: "Odstrani iz košarice: Jajca kokošja, 10 kos" }).click();
    await page.getByRole("link", { name: "Na blagajno" }).click();
    await dostava(page).getByRole("radio", { name: /Pošta/ }).click();
    await expect(placilo(page).getByRole("radio")).toHaveCount(1);
    await expect(placilo(page).getByRole("radio", { name: /S kartico/ })).toBeVisible();
    await expect(page.getByLabel("Ulica in hišna številka")).toBeVisible();
    await expect(page.getByTestId("postnina")).toHaveText(/5,00\s€/);
    await expect(page.getByTestId("skupaj")).toHaveText(/10,00\s€/);
    // Kartica bo na voljo s K8; do takrat pošte ni mogoče oddati.
    await expect(page.getByText("Pošiljanje po pošti ta čas ni mogoče")).toBeVisible();
    await expect(page.getByRole("button", { name: "Oddaj naročilo" })).toBeDisabled();

    // Nazaj na prevzem: obe plačili, naslova ni več.
    await dostava(page).getByRole("radio", { name: /Prevzem na kmetiji/ }).click();
    await expect(placilo(page).getByRole("radio")).toHaveCount(2);
    await expect(page.getByLabel("Ulica in hišna številka")).toHaveCount(0);
  });

  test("Z25: napake obrazca so ob poljih, fokus gre na prvo", async ({ page }) => {
    await dodaj(page, "cesen-v-prahu", /41 ml/);
    await page.goto("/blagajna");
    await page.getByRole("button", { name: "Oddaj naročilo" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Preverite označena polja." })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Ime", exact: true })).toBeFocused();
    await expect(page.getByRole("textbox", { name: "Ime", exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Vpišite ime.")).toBeVisible();
    await expect(page.getByText("Za oddajo naročila se morate strinjati s splošnimi pogoji.")).toBeVisible();

    await izpolniKontakt(page);
    await page.getByRole("textbox", { name: "E-pošta", exact: true }).fill("ana@");
    await page.getByRole("button", { name: "Oddaj naročilo" }).click();
    await expect(page.getByRole("textbox", { name: "E-pošta", exact: true })).toBeFocused();
    await expect(page.getByText("Vpišite veljaven e-poštni naslov, npr. ime@primer.si.")).toBeVisible();
    await expect(page.getByText("Vpišite ime.")).toHaveCount(0);
    await expect(page).toHaveURL(/\/blagajna$/);
  });

  test("Z30: zaloga, ki jo medtem kupi drug kupec, ustavi oddajo s seznamom težav", async ({ page, request, browser }) => {
    const { izdelekId, velikostId, zaloga } = await velikost(request, "suhi-petersilj");
    // Seed: 20 kosov, kar je tudi največ v eni postavki.
    expect(zaloga).toBeGreaterThan(1);
    expect(zaloga).toBeLessThanOrEqual(20);
    const kolicina = zaloga;
    await page.goto("/");
    await page.evaluate(
      (p) => localStorage.setItem("teslan-kosarica", JSON.stringify({ verzija: 1, postavke: [p] })),
      { izdelekId, velikostId, kolicina },
    );
    await page.goto("/blagajna");
    await izpolniKontakt(page);
    await soglasje(page).click();

    // Medtem drug kupec kupi en kos, zato ga ni več dovolj.
    const drugi = await browser.newContext({ baseURL: test.info().project.use.baseURL });
    const drugaStran = await drugi.newPage();
    await dodaj(drugaStran, "suhi-petersilj");
    await drugaStran.goto("/blagajna");
    await izpolniKontakt(drugaStran, "Drugi");
    await soglasje(drugaStran).click();
    await drugaStran.getByRole("button", { name: "Oddaj naročilo" }).click();
    await expect(drugaStran).toHaveURL(/\/narocilo\//);
    await drugi.close();

    await page.getByRole("button", { name: "Oddaj naročilo" }).click();
    const opozorilo = page.getByRole("alert").filter({ hasText: "Naročilo ni bilo oddano." });
    await expect(opozorilo).toBeVisible();
    await expect(opozorilo).toContainText(new RegExp(`Suhi peteršilj, [^:]+: Na zalogi (je|sta|so) samo še ${zaloga - 1}`));
    await expect(opozorilo.getByRole("link", { name: "Uredite košarico" })).toBeVisible();
    await expect(page).toHaveURL(/\/blagajna$/);
    expect((await velikost(request, "suhi-petersilj")).zaloga).toBe(zaloga - 1);
  });

  test("Z26: izpolnjeno skrito polje zavrne naročilo", async ({ page, request }) => {
    const prej = await zalogaIzdelka(request, "testenine-s-sparglji");
    await dodaj(page, "testenine-s-sparglji");
    await page.goto("/blagajna");
    await izpolniKontakt(page);
    await soglasje(page).click();
    await page.locator("#spletnaStran").fill("https://robot.example", { force: true });
    await page.getByRole("button", { name: "Oddaj naročilo" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Naročila ni bilo mogoče oddati." })).toBeVisible();
    await expect(page).toHaveURL(/\/blagajna$/);
    expect(await zalogaIzdelka(request, "testenine-s-sparglji")).toBe(prej);
  });

  test("prazna košarica na blagajni vodi na izdelke", async ({ page }) => {
    await page.goto("/blagajna");
    await expect(page.getByRole("heading", { name: "Vaša košarica je prazna" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Na izdelke" })).toHaveAttribute("href", "/products");
  });

  test("blagajna s pošto in napakami nima resnih ali kritičnih kršitev (axe)", async ({ page }) => {
    await dodaj(page, "cesen-v-prahu", /41 ml/);
    await page.goto("/blagajna");
    await page.getByRole("button", { name: "Oddaj naročilo" }).click();
    await expect(page.getByText("Vpišite ime.")).toBeVisible();
    await dostava(page).getByRole("radio", { name: /Pošta/ }).click();
    const rezultat = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const resne = rezultat.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(resne.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
