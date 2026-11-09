import { expect, test } from "@playwright/test";

// Dimni test temeljev (K1): obstoječe strani se zgradijo in odzovejo.
// Podrobni tokovi (S9–S17) pridejo s koraki, ki jih uvedejo.

const strani = [
  { pot: "/", naslov: /Domačija Tešlan/ },
  { pot: "/products", naslov: /Naši izdelki/ },
  { pot: "/about", naslov: /Tešlan/ },
  { pot: "/privacyPolicy", naslov: /Tešlan/ },
];

for (const { pot, naslov } of strani) {
  test(`stran ${pot} se naloži`, async ({ page }) => {
    const odziv = await page.goto(pot);
    expect(odziv?.status()).toBe(200);
    await expect(page).toHaveTitle(naslov);
    await expect(page.locator("h1").first()).toBeVisible();
  });
}

test("neobstoječa pot vrne 404", async ({ request }) => {
  const odziv = await request.get("/ta-stran-ne-obstaja");
  expect(odziv.status()).toBe(404);
});

test("cenik prikazuje izdelke iz CMS (seed)", async ({ page }) => {
  await page.goto("/products");
  const seznam = page.locator("main");
  await expect(seznam.getByRole("heading", { name: "Česen v prahu" }).first()).toBeVisible();
  await expect(seznam.getByRole("heading", { name: "Bučno olje" }).first()).toBeVisible();
  // Sveži pridelki so samo za prikaz: brez cene, z oznako.
  const jagode = seznam.locator("article", {
    has: page.getByRole("heading", { name: "Jagode", exact: true }),
  });
  await expect(jagode.getByText("Na voljo na kmetiji")).toBeVisible();
  await expect(jagode.getByText("€")).toHaveCount(0);
});

test("domača stran prikazuje skupine ponudbe iz CMS", async ({ page }) => {
  await page.goto("/");
  for (const skupina of ["Sveže z njive", "Začimbe in posušeno", "Sladko", "Iz domače kuhinje"]) {
    await expect(page.getByRole("heading", { name: skupina })).toBeVisible();
  }
  await expect(page.getByText(/Na ceniku je \d+ izdelkov/)).toBeVisible();
});
