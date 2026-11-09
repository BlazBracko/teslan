import { expect, test } from "@playwright/test";

// Dimni test temeljev (K1): obstoječe strani se zgradijo in odzovejo.
// Podrobni tokovi (S9–S17) pridejo s koraki, ki jih uvedejo.

const strani = [
  { pot: "/", naslov: /Domačija Tešlan/ },
  { pot: "/products", naslov: /Naši izdelki/ },
  { pot: "/about", naslov: /Tešlan/ },
  { pot: "/privacyPolicy", naslov: /Tešlan/ },
  { pot: "/pogoji", naslov: /Splošni pogoji/ },
  { pot: "/odstop", naslov: /Odstop od pogodbe/ },
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
