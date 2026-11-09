import { expect, test, type Page } from "@playwright/test";
import { dodaj, dostava, ikona, izpolniKontakt, placilo, soglasje, zalogaIzdelka } from "./blagajna-pomocniki";
import { prebranaEposta } from "./eposta";
import { PRAVI_STRIPE } from "./stripe";

/**
 * Plačilo s kartico prek nadomestnega Stripa (K8: T3, Z40–Z42, S11 brez
 * pravih ključev). Nadomestek (`stripe-nadomestek.ts`) sprejme sejo, prikaže
 * stran za plačilo in pošlje podpisan dogodek webhooka, tako da teče celoten
 * tok: blagajna → Checkout → webhook → potrdilo. S pravimi ključi namesto
 * tega teče `stripe-pravi.spec.ts`.
 *
 * Vsak test naroča svoj izdelek (zaloga): čebulni čips (plačilo), olivno
 * olje (prekinitev), fižol liofiliziran (plačilo brez webhooka).
 */

test.skip(PRAVI_STRIPE, "Nastavljeni so pravi ključi Stripe: tok s kartico preverja stripe-pravi.spec.ts.");

/** Košarica z izdelkom → blagajna s pošto in kartico → „Na plačilo“ → stran nadomestka. */
async function naPlacilo(page: Page, slug: string) {
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
  await expect(page.getByRole("heading", { name: "Nadomestni Stripe" })).toBeVisible();
  return new URL(page.url()).pathname.split("/").pop() as string;
}

test.describe("plačilo s kartico (T3, Z40–Z42)", () => {
  test("S11: pošta s kartico — plačilo potrdi webhook, naročilo je novo in plačano", async ({ page, request }) => {
    const prej = await zalogaIzdelka(request, "cebulni-cips");
    await naPlacilo(page, "cebulni-cips");
    // Čebulni čips 10,00 € + poštnina 5,00 €.
    await expect(page.getByTestId("znesek")).toHaveText("15,00 €");
    // Zaloga je rezervirana že med plačilom.
    expect(await zalogaIzdelka(request, "cebulni-cips")).toBe(prej - 1);

    await page.getByRole("button", { name: "Plačaj", exact: true }).click();
    await expect(page).toHaveURL(/\/narocilo\/T-\d{4}-\d{4,}\?k=[\w-]{32,}&placilo=1$/);
    await expect(page.getByRole("heading", { level: 1, name: "Hvala za vaše naročilo" })).toBeVisible();
    await expect(page.getByText("Novo", { exact: true })).toBeVisible();
    await expect(page.getByText("S kartico (plačano)")).toBeVisible();
    await expect(page.getByText("Glavna cesta 12")).toBeVisible();
    // Košarica se izprazni šele po plačilu.
    await expect(ikona(page)).toHaveAccessibleName("Košarica je prazna");
    expect(await zalogaIzdelka(request, "cebulni-cips")).toBe(prej - 1);

    // E1 in E2 ob plačilu (Z41), vsak natanko enkrat.
    const stevilka = (await page.getByTestId("stevilka-narocila").textContent())!.trim();
    const eposta = prebranaEposta().filter((e) => e.zadeva.includes(stevilka));
    expect(eposta.map((e) => e.za).sort()).toEqual(["ana.novak@primer.si", "sandi.dercar@gmail.com"]);
  });

  test("S11: prekinitev na Stripu vrne na blagajno, naročilo prekliče in vrne zalogo; košarica ostane", async ({
    page,
    request,
  }) => {
    const prej = await zalogaIzdelka(request, "olivno-olje");
    await naPlacilo(page, "olivno-olje");
    expect(await zalogaIzdelka(request, "olivno-olje")).toBe(prej - 1);

    await page.getByRole("link", { name: "Nazaj" }).click();
    await expect(page).toHaveURL(/\/blagajna\?preklic=1$/);
    await expect(page.getByText("Plačilo je bilo prekinjeno")).toBeVisible();
    await expect(page.getByText("Kartica ni bila bremenjena in naročilo je preklicano.")).toBeVisible();
    // Košarica ostane, zaloga je vrnjena (Z42).
    await expect(page.getByRole("complementary", { name: "Vaše naročilo" })).toContainText("Olivno olje");
    await expect(ikona(page)).not.toHaveAccessibleName("Košarica je prazna");
    expect(await zalogaIzdelka(request, "olivno-olje")).toBe(prej);
    // Pozni dogodek expired (nadomestek ga pošlje po izteku) ne vrne zaloge še enkrat.
    await page.waitForTimeout(1_000);
    expect(await zalogaIzdelka(request, "olivno-olje")).toBe(prej);
    expect(prebranaEposta().filter((e) => e.besedilo.includes("Olivno olje") && e.za === "ana.novak@primer.si")).toEqual([]);
  });

  test("potrdilo po plačilu preveri stanje pri Stripu, tudi če webhook še ni prispel", async ({ page }) => {
    await naPlacilo(page, "fizol-liofiliziran");
    await page.getByRole("button", { name: "Plačaj brez webhooka" }).click();
    await expect(page).toHaveURL(/\/narocilo\/.+&placilo=1$/);
    await expect(page.getByText("Novo", { exact: true })).toBeVisible();
    await expect(page.getByText("S kartico (plačano)")).toBeVisible();
    await expect(ikona(page)).toHaveAccessibleName("Košarica je prazna");
  });

  test("webhook brez veljavnega podpisa vrne 400", async ({ request }) => {
    const odziv = await request.post("/api/stripe/webhook", {
      headers: { "stripe-signature": "t=1,v1=napacen" },
      data: { id: "evt_x", type: "checkout.session.completed", data: { object: {} } },
    });
    expect(odziv.status()).toBe(400);
    expect((await request.post("/api/stripe/webhook", { data: {} })).status()).toBe(400);
  });

  test("vrnitev s preklicem brez veljavnega žetona samo pokaže obvestilo", async ({ page }) => {
    await dodaj(page, "cesen-v-prahu", /41 ml/);
    await page.goto("/blagajna/preklic?narocilo=T-2026-9999&k=napacen");
    await expect(page).toHaveURL(/\/blagajna\?preklic=1$/);
    await expect(page.getByText("Plačilo je bilo prekinjeno")).toBeVisible();
  });
});
