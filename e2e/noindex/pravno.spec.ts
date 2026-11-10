import { expect, test } from "@playwright/test";

/** Na stagingu (`NOINDEX=1`) je na vrhu vsake pravne strani obvestilo o osnutku (Z61). */
for (const pot of ["/pogoji", "/odstop", "/privacyPolicy"]) {
  test(`${pot} ima obvestilo „Osnutek – v pregledu“ pred besedilom`, async ({ page }) => {
    await page.goto(pot);
    const obvestilo = page.getByRole("note").filter({ hasText: "Osnutek – v pregledu." });
    await expect(obvestilo).toBeVisible();
    const predPoglavji = await obvestilo.evaluate((el) => {
      const prvo = document.querySelector("main section");
      return !!prvo && !!(el.compareDocumentPosition(prvo) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(predPoglavji).toBe(true);
  });
}

/** Besedila, ki jih je napisal agent, so na stagingu označena za lastnikov pregled. */
for (const pot of ["/dostava", "/vprasanja", "/about"]) {
  test(`${pot} ima na stagingu oznako osnutka besedila`, async ({ page }) => {
    await page.goto(pot);
    await expect(page.getByRole("note").filter({ hasText: "Osnutek besedila – za pregled." })).toBeVisible();
  });
}
