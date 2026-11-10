import { expect, test } from "@playwright/test";
import { IZVOR_STAGING, TESTNA_ZASCITA } from "../zascita";

/**
 * Admin za Basic Auth (Z74): brskalnik pošilja glavo `Authorization: Basic`
 * tudi zahtevam admina, Payload pa mora prijavo še vedno brati iz piškotka.
 * Teče v projektu `zaprta-trgovina`, ker potrebuje administratorja iz
 * `admin.spec.ts`; uporabi strežnik `noindex` (staging z geslom).
 */
test("prijava v admin deluje za geslom staginga", async ({ browser }) => {
  const kontekst = await browser.newContext({ baseURL: IZVOR_STAGING, httpCredentials: TESTNA_ZASCITA });
  const page = await kontekst.newPage();
  try {
    await page.goto("/admin/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#field-email").fill("admin@teslan.test");
    await page.locator("#field-password").fill("geslo-admina-123");
    await page.getByRole("button", { name: "Prijava" }).click();
    await page.waitForURL(/\/admin$/);
    await expect(page.locator("nav").getByRole("link", { name: "Izdelki" })).toBeVisible();
  } finally {
    await kontekst.close();
  }
});
