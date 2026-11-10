import { expect, test, type Page } from "@playwright/test";
import { prebranaEposta } from "../eposta";

/**
 * Stikalo trgovine (Z27, S15), seznam naročil v adminu (T7) in obvestilo
 * kupcu ob spremembi statusa (Z57, K9). Teče v
 * projektu `zaprta-trgovina` šele po ostalih testih (zapre trgovino za vse)
 * in uporabi administratorja, ki ga ustvari `admin.spec.ts`, ter naročila
 * iz `blagajna.spec.ts`. Na koncu trgovino spet odpre.
 */
test.describe.configure({ mode: "serial" });

const admin = { email: "admin@teslan.test", password: "geslo-admina-123" };

/** Glava Origin za REST s piškotkom seje (gl. admin.spec.ts). */
const izvor = (page: Page) => ({ origin: new URL(page.url()).origin });

async function prijava(page: Page) {
  await page.goto("/");
  const odziv = await page.request.post("/api/users/login", { headers: izvor(page), data: admin });
  expect(odziv.ok()).toBe(true);
}

async function nastaviTrgovino(page: Page, trgovinaOdprta: boolean) {
  const odziv = await page.request.post("/api/globals/nastavitve-trgovine", {
    headers: izvor(page),
    data: { trgovinaOdprta },
  });
  expect(odziv.ok()).toBe(true);
}

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage({ baseURL: test.info().project.use.baseURL });
  await prijava(page);
  await nastaviTrgovino(page, true);
  await page.close();
});

test("S15: zaprta trgovina skrije nakupne gumbe, blagajna zavrne oddajo", async ({ page, browser }) => {
  // Kupec ima košarico in izpolnjeno blagajno, ko trgovina še deluje.
  await page.goto("/products/cesen-v-prahu");
  await page.getByRole("button", { name: "V košarico", exact: true }).click();
  await expect(page.getByText("Dodano v košarico", { exact: true }).last()).toBeVisible();
  await page.goto("/blagajna");
  await page.getByRole("textbox", { name: "Ime", exact: true }).fill("Ana");
  await page.getByRole("textbox", { name: "Priimek", exact: true }).fill("Novak");
  await page.getByRole("textbox", { name: "E-pošta", exact: true }).fill("ana@primer.si");
  await page.getByRole("textbox", { name: "Telefon", exact: true }).fill("040 123 456");
  await page.getByRole("checkbox", { name: /Strinjam se/ }).click();

  // Administrator medtem zapre trgovino (v drugem brskalniku).
  const adminStran = await browser.newPage({ baseURL: test.info().project.use.baseURL });
  await prijava(adminStran);
  await nastaviTrgovino(adminStran, false);

  await page.getByRole("button", { name: "Oddaj naročilo" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Spletna trgovina je trenutno zaprta, zato naročila ni mogoče oddati." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/blagajna$/);

  // Katalog je viden, nakupnih gumbov ni.
  await page.goto("/products/cesen-v-prahu");
  await expect(page.getByRole("heading", { level: 1, name: "Česen v prahu" })).toBeVisible();
  await expect(page.getByText("Spletna trgovina je trenutno zaprta")).toBeVisible();
  // Tudi gumbov za hiter nakup pri sorodnih izdelkih in na seznamu ni (ime vsebuje „v košarico“).
  await expect(page.getByRole("button", { name: "V košarico" })).toHaveCount(0);
  await page.goto("/products?kategorija=sokovi");
  await expect(page.getByRole("heading", { name: "Aronija sok" })).toBeVisible();
  await expect(page.getByRole("button", { name: /v košarico/i })).toHaveCount(0);
  await page.goto("/kosarica");
  await expect(page.getByText("Spletna trgovina je trenutno zaprta")).toBeVisible();
  await expect(page.getByRole("link", { name: "Na blagajno" })).toHaveCount(0);
  await page.goto("/blagajna");
  await expect(page.getByText("Spletna trgovina je trenutno zaprta")).toBeVisible();
  await expect(page.getByRole("button", { name: "Oddaj naročilo" })).toHaveCount(0);

  await nastaviTrgovino(adminStran, true);
  await page.goto("/products/cesen-v-prahu");
  await expect(page.getByRole("button", { name: "V košarico", exact: true })).toBeVisible();
  await adminStran.close();
});

test("T7: admin vidi seznam naročil s stolpci, najnovejše zgoraj; brisanja ni", async ({ page }) => {
  await prijava(page);
  await page.goto("/admin/collections/narocila");
  await expect(page.getByRole("heading", { name: "Naročila" }).first()).toBeVisible();
  for (const stolpec of ["Številka", "Kupec", "Dostava", "Plačilo", "Plačano", "Skupaj", "Status"]) {
    await expect(page.locator("thead").getByText(stolpec, { exact: true })).toBeVisible();
  }
  // Naročila iz blagajna.spec: najnovejše je prvo, številke so zaporedne.
  const stevilke = await page.locator("tbody tr").evaluateAll((vrstice) =>
    vrstice.map((v) => v.textContent?.match(/T-\d{4}-\d{4,}/)?.[0] ?? ""),
  );
  expect(stevilke.length).toBeGreaterThan(0);
  expect([...stevilke].sort().reverse()).toEqual(stevilke);
  await expect(page.locator("tbody")).toContainText("Ana Novak");
  // Ustvarjanje in brisanje nista mogoča niti administratorju (Z35).
  expect(
    (await page.request.post("/api/narocila", { headers: izvor(page), data: { stevilka: "T-2026-9999" } })).status(),
  ).toBe(403);
  const prvo = await page.request.get("/api/narocila?limit=1", { headers: izvor(page) });
  const id = (await prvo.json()).docs[0].id;
  expect((await page.request.delete(`/api/narocila/${id}`, { headers: izvor(page) })).status()).toBe(403);
});

test("Z57: sprememba statusa v „Pripravljeno za prevzem“ pošlje kupcu E3 (HTML in besedilo)", async ({ page }) => {
  await prijava(page);
  // Naročilo za prevzem iz blagajna.spec (S9), ki je še „Novo“.
  const odziv = await page.request.get(
    "/api/narocila?where[status][equals]=novo&where[nacinDostave][equals]=prevzem&limit=1&depth=0",
    { headers: izvor(page) },
  );
  expect(odziv.ok()).toBe(true);
  const [narocilo] = (await odziv.json()).docs as Array<{ id: number; stevilka: string }>;
  expect(narocilo).toBeTruthy();

  const sprememba = await page.request.patch(`/api/narocila/${narocilo.id}`, {
    headers: izvor(page),
    data: { status: "pripravljeno" },
  });
  expect(sprememba.ok()).toBe(true);

  const e3 = prebranaEposta().filter((e) => e.zadeva.includes(`${narocilo.stevilka} je pripravljeno za prevzem`));
  expect(e3).toHaveLength(1);
  expect(e3[0].za).toBe("ana.novak@primer.si");
  expect(e3[0].odgovorNa).toBe("sandi.dercar@gmail.com");
  expect(e3[0].besedilo).toContain(`/narocilo/${narocilo.stevilka}?k=`);
  expect(e3[0].besedilo).toContain("https://www.google.com/maps/dir/");
  expect(e3[0].html).toContain('<html lang="sl">');

  // Ponovno shranjevanje ne pošlje še enega obvestila.
  await page.request.patch(`/api/narocila/${narocilo.id}`, { headers: izvor(page), data: { internaOpomba: "E2E" } });
  expect(prebranaEposta().filter((e) => e.zadeva.includes(`${narocilo.stevilka} je pripravljeno`))).toHaveLength(1);
});
