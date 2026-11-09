import { expect, test } from "@playwright/test";
import { dodaj } from "./blagajna-pomocniki";

/**
 * Pravne strani (K11, Z60, Z61). Seed vpiše samo naslov, telefon in
 * e-pošto prodajalca, zato morajo biti ostali podatki označeni z
 * `[manjka: …]` (načrt §7). Brez `NOINDEX` obvestila o osnutku ni.
 */

test.describe("pravne strani", () => {
  for (const pot of ["/pogoji", "/odstop", "/privacyPolicy"]) {
    test(`${pot} kaže podatke prodajalca iz nastavitev in manjkajoče označi`, async ({ page }) => {
      await page.goto(pot);
      const prodajalec = page.getByLabel("Podatki prodajalca", { exact: true }).first();
      await expect(prodajalec).toContainText("Podgora 15, 8351 Straža pri Novem mestu");
      await expect(prodajalec.getByRole("link", { name: "040 578 512" })).toHaveAttribute("href", "tel:+38640578512");
      await expect(prodajalec.getByRole("link", { name: "sandi.dercar@gmail.com" })).toBeVisible();
      await expect(prodajalec).toContainText("[manjka: naziv prodajalca]");
      await expect(prodajalec).toContainText("[manjka: davčna številka]");
      await expect(prodajalec).toContainText("[manjka: KMG-MID]");
      await expect(page.getByText("Osnutek – v pregledu.")).toHaveCount(0);
    });
  }

  test("splošni pogoji: poštnina iz nastavitev, povezave na odstop in zasebnost, kazalo", async ({ page }) => {
    await page.goto("/pogoji");
    await expect(page.getByRole("heading", { level: 1, name: "Splošni pogoji poslovanja" })).toBeVisible();
    const dostava = page.locator("#dostava");
    await expect(dostava).toContainText("Poštnina znaša 5,00 €");
    await expect(dostava).toContainText("vsaj 50,00 €");
    await expect(page.locator("#darila")).toContainText("sporočilom na kartici");
    await expect(page.locator("#odstop").getByRole("link", { name: "Odstop od pogodbe" })).toHaveAttribute(
      "href",
      "/odstop",
    );
    await expect(page.locator("#zasebnost").getByRole("link", { name: "politiki zasebnosti" })).toHaveAttribute(
      "href",
      "/privacyPolicy",
    );
    await page.getByRole("navigation", { name: "Kazalo" }).getByRole("link", { name: "9. Odstop od pogodbe" }).click();
    await expect(page).toHaveURL(/#odstop$/);
  });

  test("odstop: izjeme vključujejo darilne škatle s sporočilom, obrazec se kopira", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/odstop");
    const izjeme = page.locator("#izjeme");
    await expect(izjeme).toContainText("hitro pokvarljivo blago");
    await expect(izjeme).toContainText("sestavljene darilne škatle s sporočilom na kartici");

    const obrazec = page.getByRole("textbox", { name: "Obrazec za odstop od pogodbe" });
    await expect(obrazec).toHaveValue(/^Za: \[manjka: naziv prodajalca\], Podgora 15/);
    await expect(obrazec).toHaveValue(/odstopam od pogodbe/);

    await page.getByRole("button", { name: "Kopiraj besedilo" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Besedilo je kopirano." })).toBeVisible();
    const odlozisce = await page.evaluate(() => navigator.clipboard.readText());
    expect(odlozisce).toBe(await obrazec.inputValue());
  });

  test("zasebnost: obdelovalci in samo nujni piškotki (Z60)", async ({ page }) => {
    await page.goto("/privacyPolicy");
    const obdelovalci = page.locator("#obdelovalci");
    for (const ime of ["Stripe", "Resend", "Cloudflare", "Railway"]) await expect(obdelovalci).toContainText(ime);
    const piskotki = page.locator("#piskotki");
    await expect(piskotki).toContainText("samo nujne piškotke");
    await expect(piskotki.getByRole("table")).toContainText("teslan-kosarica");
    await expect(piskotki.getByRole("table")).toContainText("payload-token");
  });

  test("blagajna ima povezave na pogoje, zasebnost in odstop", async ({ page }) => {
    await dodaj(page, "liofilizirane-borovnice");
    await page.goto("/blagajna");
    await expect(page.getByRole("link", { name: "splošnimi pogoji poslovanja" })).toHaveAttribute("href", "/pogoji");
    await expect(page.getByRole("link", { name: "politiko zasebnosti" })).toHaveAttribute("href", "/privacyPolicy");
    await expect(page.getByRole("link", { name: "odstopu od pogodbe" })).toHaveAttribute("href", "/odstop");
  });
});
