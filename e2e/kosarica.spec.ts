import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Košarica (K6: Z7, Z20–Z23, T2 koraka 1–2, T4). Testi uporabljajo izdelke
 * brez sezone (česen v prahu, kokošja jajca, bučno olje), `samo-prikaz`
 * (jagode) in testni izdelek `malo-zaloge` (zaloga 2, `e2e/testni-podatki.ts`),
 * zato niso odvisni od meseca. Vloženih jurčkov ne uporabljajo (admin.spec).
 *
 * Vsak test ima svoj kontekst brskalnika, zato tudi svoj `localStorage`.
 */

const ikona = (page: Page) => page.getByRole("banner").getByRole("link", { name: /^Košarica/ });
const povzetek = (page: Page) => page.getByRole("region", { name: "Povzetek" });
const postavka = (page: Page, ime: string, velikost: string) =>
  page.locator("main li", { has: page.getByRole("heading", { name: ime }) }).filter({ hasText: velikost });

async function dodaj(page: Page, slug: string, velikost: RegExp | null, kolicina = 1) {
  await page.goto(`/products/${slug}`);
  if (velikost) await page.getByRole("radiogroup").getByRole("radio", { name: velikost }).click();
  for (let i = 1; i < kolicina; i++) await page.getByRole("button", { name: "Povečaj količino" }).click();
  await page.getByRole("button", { name: "V košarico", exact: true }).click();
  await expect(page.getByText("Dodano v košarico", { exact: true }).last()).toBeVisible();
}

/** Id izdelka in velikosti prek javnega REST (bere samo objavljene). */
async function idIzdelka(request: APIRequestContext, slug: string) {
  const odziv = await request.get(`/api/izdelki?where[slug][equals]=${slug}&depth=0`);
  expect(odziv.ok()).toBe(true);
  const { docs } = (await odziv.json()) as { docs: Array<{ id: number; velikosti: Array<{ id: string }> }> };
  expect(docs).toHaveLength(1);
  return { izdelekId: docs[0].id, velikostId: docs[0].velikosti[0].id };
}

async function nastaviKosarico(page: Page, postavke: unknown[]) {
  await page.goto("/");
  await page.evaluate((p) => localStorage.setItem("teslan-kosarica", JSON.stringify({ verzija: 1, postavke: p })), postavke);
  await page.goto("/kosarica");
}

test.describe("košarica (Z20, Z21, T2)", () => {
  test("dodajanje s podstrani, ikona v glavi, spremembe in odstranjevanje", async ({ page }) => {
    await page.goto("/products/cesen-v-prahu");
    await expect(ikona(page)).toHaveAccessibleName("Košarica je prazna");

    await dodaj(page, "cesen-v-prahu", /106 ml/, 2);
    await expect(ikona(page)).toHaveAccessibleName("Košarica, 2 kosa");
    await dodaj(page, "cesen-v-prahu", /41 ml/);
    await expect(ikona(page)).toHaveAccessibleName("Košarica, 3 kosi");

    await ikona(page).click();
    await expect(page).toHaveURL(/\/kosarica$/);
    await expect(page.getByRole("heading", { level: 1, name: "Košarica" })).toBeVisible();
    await expect(postavka(page, "Česen v prahu", "106 ml")).toContainText(/24,00\s€/);
    await expect(postavka(page, "Česen v prahu", "41 ml")).toContainText(/5,00\s€/);
    await expect(povzetek(page).getByTestId("vmesni-sestevek")).toHaveText(/29,00\s€/);
    await expect(povzetek(page).getByTestId("posta")).toContainText(/5,00\s€.*Do brezplačne poštnine vam manjka 21,00\s€/);
    await expect(povzetek(page)).toContainText("Vključen DDV 9,5 %");

    // Sprememba količine: cene izračuna strežnik.
    await page.getByRole("spinbutton", { name: "Količina: Česen v prahu, 41 ml" }).fill("3");
    await page.getByRole("spinbutton", { name: "Količina: Česen v prahu, 41 ml" }).blur();
    await expect(povzetek(page).getByTestId("vmesni-sestevek")).toHaveText(/39,00\s€/);
    await expect(ikona(page)).toHaveAccessibleName("Košarica, 5 kosov");

    // Košarica ostane po osvežitvi (localStorage).
    await page.reload();
    await expect(povzetek(page).getByTestId("vmesni-sestevek")).toHaveText(/39,00\s€/);

    await page.getByRole("button", { name: "Odstrani iz košarice: Česen v prahu, 106 ml" }).click();
    await expect(postavka(page, "Česen v prahu", "106 ml")).toHaveCount(0);
    await expect(povzetek(page).getByTestId("vmesni-sestevek")).toHaveText(/15,00\s€/);
    await expect(ikona(page)).toHaveAccessibleName("Košarica, 3 kosi");

    await page.getByRole("button", { name: "Odstrani iz košarice: Česen v prahu, 41 ml" }).click();
    await expect(page.getByRole("heading", { name: "Vaša košarica je prazna" })).toBeVisible();
    await expect(ikona(page)).toHaveAccessibleName("Košarica je prazna");
    await page.getByRole("link", { name: "Na izdelke" }).click();
    await expect(page).toHaveURL(/\/products$/);
  });

  test("količina iste velikosti ne preseže zaloge", async ({ page }) => {
    await dodaj(page, "malo-zaloge", null, 2);
    await page.getByRole("button", { name: "V košarico", exact: true }).click();
    await expect(page.getByText("Več kosov ni mogoče dodati", { exact: true })).toBeVisible();
    await expect(ikona(page)).toHaveAccessibleName("Košarica, 2 kosa");
  });

  test("nad pragom je poštnina brezplačna (Z23)", async ({ page }) => {
    await dodaj(page, "bucno-olje", /1 L/, 3);
    await page.goto("/kosarica");
    await expect(povzetek(page).getByTestId("vmesni-sestevek")).toHaveText(/60,00\s€/);
    await expect(povzetek(page).getByTestId("posta")).toHaveText("Pošta: brezplačno.");
  });

  test("T4: izdelek samo za prevzem onemogoči pošto z razlago", async ({ page }) => {
    await dodaj(page, "cesen-v-prahu", /41 ml/);
    await dodaj(page, "jajca-kokosja", null);
    await page.goto("/kosarica");
    await expect(povzetek(page).getByTestId("posta")).toHaveText(
      "Pošta: za to naročilo ni na voljo, ker so v košarici izdelki samo za prevzem na kmetiji: Jajca kokošja.",
    );

    // Mešana košarica ni napaka: naročilo se v celoti prevzame na kmetiji in ga je mogoče oddati.
    const obvestilo = page.getByTestId("samo-prevzem");
    await expect(obvestilo).toContainText("To naročilo prevzamete na kmetiji");
    await expect(obvestilo).toContainText("Jajca kokošja");
    await expect(page.getByText("Nekaterih izdelkov ni mogoče naročiti")).toHaveCount(0);
    await expect(postavka(page, "Jajca kokošja", "10 kos").getByText("Samo prevzem na kmetiji")).toBeVisible();
    await expect(postavka(page, "Česen v prahu", "41 ml").getByText("Samo prevzem na kmetiji")).toHaveCount(0);
    await expect(povzetek(page).getByRole("link", { name: "Na blagajno" })).toHaveAttribute("href", "/blagajna");
    await expect(povzetek(page)).toContainText("Naročilo oddate za prevzem na kmetiji.");

    // Kupec, ki želi paket po pošti, izdelek samo za prevzem odstrani z enim gumbom.
    await obvestilo.getByRole("button", { name: "Odstrani izdelek samo za prevzem" }).click();
    await expect(postavka(page, "Jajca kokošja", "10 kos")).toHaveCount(0);
    await expect(page.getByTestId("samo-prevzem")).toHaveCount(0);
    await expect(povzetek(page).getByTestId("posta")).toContainText(/Pošta: 5,00\s€/);
  });

  test("T4: košarica samo z izdelki za prevzem ne ponuja odstranjevanja", async ({ page }) => {
    await dodaj(page, "jajca-kokosja", null);
    await page.goto("/kosarica");
    const obvestilo = page.getByTestId("samo-prevzem");
    await expect(obvestilo).toContainText("To naročilo prevzamete na kmetiji");
    await expect(obvestilo.getByRole("button")).toHaveCount(0);
    await expect(povzetek(page).getByRole("link", { name: "Na blagajno" })).toBeVisible();
  });

  test("Z21: nedosegljive in prevelike postavke so označene z razlogom", async ({ page, request }) => {
    const jagode = await idIzdelka(request, "jagode");
    const malo = await idIzdelka(request, "malo-zaloge");
    await nastaviKosarico(page, [
      { ...malo, kolicina: 5 },
      { ...jagode, kolicina: 1 },
      { izdelekId: 999_999, velikostId: "ne-obstaja", kolicina: 1 },
      // Neveljavna postavka (količina 0) se tiho izpusti.
      { izdelekId: 1, velikostId: "x", kolicina: 0 },
    ]);

    await expect(page.getByText("Nekaterih izdelkov ni mogoče naročiti")).toBeVisible();
    const malaZaloga = postavka(page, "Testni izdelek z malo zaloge", "1 kos");
    await expect(malaZaloga).toContainText("Na zalogi sta samo še 2 kosa.");
    await expect(postavka(page, "Jagode", "sveže")).toContainText("Tega izdelka ni mogoče naročiti prek spleta.");
    await expect(page.getByRole("heading", { name: "Izdelek, ki ga ni več v ponudbi" })).toBeVisible();
    await expect(page.getByText("Izdelka ni več v ponudbi.")).toBeVisible();
    await expect(povzetek(page).getByText("Pred nadaljevanjem uredite označene postavke.")).toBeVisible();
    await expect(povzetek(page).getByRole("button", { name: "Na blagajno" })).toBeDisabled();
    // Postavke s težavo se ne štejejo v seštevek.
    await expect(povzetek(page).getByTestId("vmesni-sestevek")).toHaveText(/0,00\s€/);

    await malaZaloga.getByRole("button", { name: "Zmanjšaj na 2" }).click();
    await expect(malaZaloga).not.toContainText("Na zalogi sta samo še");
    await expect(povzetek(page).getByTestId("vmesni-sestevek")).toHaveText(/18,00\s€/);

    await page.getByRole("button", { name: "Odstrani iz košarice: Jagode, sveže" }).click();
    await page.getByRole("button", { name: "Odstrani iz košarice: Izdelek, ki ga ni več v ponudbi" }).click();
    await expect(page.getByText("Nekaterih izdelkov ni mogoče naročiti")).toHaveCount(0);
    await expect(povzetek(page).getByRole("link", { name: "Na blagajno" })).toHaveAttribute("href", "/blagajna");
  });

  test("ikona košarice je vidna tudi na mobilnem", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await dodaj(page, "cesen-v-prahu", /41 ml/);
    await expect(ikona(page)).toBeVisible();
    await expect(page.getByTestId("stevilo-v-kosarici")).toHaveText("1");
  });

  test("polna košarica nima resnih ali kritičnih kršitev (axe)", async ({ page, request }) => {
    const malo = await idIzdelka(request, "malo-zaloge");
    await dodaj(page, "cesen-v-prahu", /41 ml/);
    await dodaj(page, "jajca-kokosja", null);
    await page.evaluate((m) => {
      const k = JSON.parse(localStorage.getItem("teslan-kosarica") ?? "{}");
      k.postavke.push({ ...m, kolicina: 5 });
      localStorage.setItem("teslan-kosarica", JSON.stringify(k));
    }, malo);
    await page.goto("/kosarica");
    await expect(povzetek(page)).toBeVisible();
    await expect(page.getByText("Na zalogi sta samo še 2 kosa.")).toBeVisible();
    const rezultat = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const resne = rezultat.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(resne.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
