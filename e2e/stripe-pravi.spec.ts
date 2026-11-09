import { expect, test, type Page } from "@playwright/test";
import { dodaj, dostava, ikona, izpolniKontakt, placilo, soglasje, zalogaIzdelka } from "./blagajna-pomocniki";
import { PRAVI_STRIPE, RAZLOG_BREZ_PRAVEGA_STRIPA } from "./stripe";

/**
 * S11 s pravim Stripom v testnem načinu (T3, Z40–Z42). Teče samo, ko sta
 * v okolju testna ključa (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`),
 * npr. v CI iz GitHub secrets. Webhook ni nujen: potrdilo po vrnitvi stanje
 * preveri pri Stripu, prekinitev sejo izteče sama. Z `stripe listen
 * --forward-to localhost:3100/api/stripe/webhook` se preveri še webhook.
 *
 * Izdelka: paradižnik v prahu (plačilo), čebula v prahu (prekinitev).
 */

test.skip(!PRAVI_STRIPE, RAZLOG_BREZ_PRAVEGA_STRIPA);
test.describe.configure({ timeout: 120_000 });

async function naStripe(page: Page, slug: string) {
  await dodaj(page, slug);
  await page.goto("/blagajna");
  await izpolniKontakt(page);
  await dostava(page).getByRole("radio", { name: /Pošta/ }).click();
  await page.getByRole("textbox", { name: "Ulica in hišna številka", exact: true }).fill("Glavna cesta 12");
  await page.getByRole("textbox", { name: "Poštna številka", exact: true }).fill("8000");
  await page.getByRole("textbox", { name: "Kraj", exact: true }).fill("Novo mesto");
  await placilo(page).getByRole("radio", { name: /S kartico/ }).click();
  await soglasje(page).click();
  await page.getByRole("button", { name: "Na plačilo" }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });
}

test("S11: plačilo s kartico 4242 4242 4242 4242 — naročilo je novo in plačano", async ({ page, request }) => {
  const prej = await zalogaIzdelka(request, "paradiznik-v-prahu");
  await naStripe(page, "paradiznik-v-prahu");

  // Če je v Stripu vklopljenih več načinov plačila, je kartica v harmoniki.
  const harmonika = page.getByTestId("card-accordion-item-button");
  if (await harmonika.isVisible().catch(() => false)) await harmonika.click();
  await page.locator("#cardNumber").fill("4242 4242 4242 4242");
  await page.locator("#cardExpiry").fill("12 / 34");
  await page.locator("#cardCvc").fill("123");
  await page.locator("#billingName").fill("Ana Novak");
  await page.getByTestId("hosted-payment-submit-button").click();

  await page.waitForURL(/\/narocilo\/T-\d{4}-\d{4,}\?k=.+&placilo=1$/, { timeout: 60_000 });
  await expect(page.getByText("Novo", { exact: true })).toBeVisible();
  await expect(page.getByText("S kartico (plačano)")).toBeVisible();
  await expect(ikona(page)).toHaveAccessibleName("Košarica je prazna");
  expect(await zalogaIzdelka(request, "paradiznik-v-prahu")).toBe(prej - 1);
});

test("S11: prekinitev na Stripu vrne zalogo in košarico", async ({ page, request }) => {
  const prej = await zalogaIzdelka(request, "cebula-v-prahu");
  await naStripe(page, "cebula-v-prahu");
  expect(await zalogaIzdelka(request, "cebula-v-prahu")).toBe(prej - 1);

  // Povezava nazaj v glavi Checkouta vodi na cancel_url.
  await page.locator('a[href*="/blagajna/preklic"]').first().click();
  await page.waitForURL(/\/blagajna\?preklic=1$/, { timeout: 30_000 });
  await expect(page.getByText("Plačilo je bilo prekinjeno")).toBeVisible();
  await expect(ikona(page)).not.toHaveAccessibleName("Košarica je prazna");
  expect(await zalogaIzdelka(request, "cebula-v-prahu")).toBe(prej);
});
