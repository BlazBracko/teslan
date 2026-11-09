import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { dostava, ikona, izpolniKontakt, placilo, soglasje } from "./blagajna-pomocniki";
import { prebranaEposta } from "./eposta";
import { PRAVI_STRIPE } from "./stripe";

/**
 * Darila (K10: T5, Z50–Z55, S12). Naročila oddajata dva testa, vsak s
 * svojo škatlo in izdelki: „Okusi Dolenjske“ v mali škatli (česen v prahu
 * 41 ml, šparglji v prahu, borovničeva marmelada) in lastna sestava v
 * veliki škatli (liofilizirane maline, bučno olje). Test konfiguratorja
 * samo polni košarico.
 */

async function zalogaSkatle(request: APIRequestContext, ime: string): Promise<number> {
  const odziv = await request.get(`/api/tipi-skatel?where[ime][equals]=${encodeURIComponent(ime)}&depth=0`);
  expect(odziv.ok()).toBe(true);
  const { docs } = (await odziv.json()) as { docs: Array<{ zaloga: number }> };
  return docs[0].zaloga;
}

const mesta = (page: Page) => page.getByTestId("mesta");
const dodajVSkatlo = (page: Page, opis: string | RegExp) =>
  page.getByRole("button", { name: typeof opis === "string" ? `Dodaj v škatlo: ${opis}` : opis });

test.describe("darila (T5)", () => {
  test("S12: program „Okusi Dolenjske“ v košarico, sporočilo je vidno v naročilu", async ({ page, request }) => {
    const prej = await zalogaSkatle(request, "Mala darilna škatla");
    await page.goto("/");
    await page.getByRole("banner").getByRole("link", { name: "Darila" }).first().click();
    await expect(page).toHaveURL(/\/darila$/);
    await expect(page.getByRole("heading", { level: 1, name: "Podarite domače" })).toBeVisible();

    await page.getByRole("link", { name: "Okusi Dolenjske" }).click();
    await expect(page).toHaveURL(/\/darila\/sestavi\?program=okusi-dolenjske$/);
    await expect(page.getByRole("heading", { level: 1, name: "Okusi Dolenjske" })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Mala darilna škatla/ })).toBeChecked();
    await expect(mesta(page)).toHaveText("Zasedena mesta: 3 od 3");
    const vSkatli = page.getByRole("list", { name: "V škatli" });
    await expect(vSkatli.getByRole("listitem")).toHaveCount(3);
    await expect(vSkatli).toContainText("Česen v prahu");
    await expect(vSkatli).toContainText("Šparglji v prahu");
    await expect(vSkatli).toContainText("Marmelada borovnica");
    // Mala škatla 5,00 + česen 5,00 + šparglji 5,00 + marmelada 8,00.
    await expect(page.getByTestId("cena-darila")).toHaveText(/23,00\s€/);

    await page.getByRole("textbox", { name: "Sporočilo na kartici" }).fill("Vse najboljše, babi!");
    await page.getByRole("button", { name: "V košarico" }).click();

    await expect(page).toHaveURL(/\/kosarica$/);
    await expect(ikona(page)).toHaveAccessibleName(/1 kos/);
    await expect(page.getByRole("heading", { name: "Mala darilna škatla: Okusi Dolenjske" })).toBeVisible();
    await expect(page.getByText("„Vse najboljše, babi!“")).toBeVisible();
    await expect(page.getByTestId("vmesni-sestevek")).toHaveText(/23,00\s€/);

    await page.getByRole("link", { name: "Na blagajno" }).click();
    await izpolniKontakt(page, "Darja");
    await expect(dostava(page).getByRole("radio", { name: /Pošta/ })).toBeEnabled();
    await soglasje(page).click();
    await page.getByRole("button", { name: "Oddaj naročilo" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Hvala za vaše naročilo" })).toBeVisible();
    await expect(page.getByText("Mala darilna škatla: Okusi Dolenjske")).toBeVisible();
    await expect(page.getByText(/V škatli: 1 × Česen v prahu, 41 ml/)).toBeVisible();
    await expect(page.getByText("„Vse najboljše, babi!“")).toBeVisible();
    expect(await zalogaSkatle(request, "Mala darilna škatla")).toBe(prej - 1);

    // E2 prodajalcu vsebuje sporočilo na kartici (Z54).
    const stevilka = (await page.getByTestId("stevilka-narocila").textContent())!.trim();
    const e2 = prebranaEposta().find((e) => e.zadeva.includes(stevilka) && e.za === "sandi.dercar@gmail.com");
    expect(e2?.besedilo).toContain("Sporočilo na kartici: „Vse najboljše, babi!“");
    expect(e2?.besedilo).toContain("1 × Šparglji v prahu");
  });

  test("konfigurator ne dovoli več kosov kot mest, neprimeren izdelek ni na izbiro; škatlo uredite iz košarice", async ({
    page,
  }) => {
    await page.goto("/darila/sestavi");
    await expect(page.getByRole("heading", { level: 1, name: "Sestavite svoje darilo" })).toBeVisible();
    await page.getByRole("radio", { name: /Mala darilna škatla/ }).click();
    await expect(mesta(page)).toHaveText("Zasedena mesta: 0 od 3");
    await expect(page.getByRole("button", { name: "V košarico" })).toBeDisabled();

    // Jajca in šparglji niso primerni za darilo (samo prevzem): jih ni na izbiro.
    await expect(dodajVSkatlo(page, /Jajca/)).toHaveCount(0);
    await expect(dodajVSkatlo(page, /^Dodaj v škatlo: Šparglji, /)).toHaveCount(0);

    const cips = dodajVSkatlo(page, "Čebulni čips, 45 g");
    await cips.click();
    await dodajVSkatlo(page, "Aronija sok, 1 L").click();
    await cips.click();
    await expect(mesta(page)).toHaveText("Zasedena mesta: 3 od 3");
    await expect(page.getByText("Škatla je polna. Za drug izdelek najprej enega odstranite.")).toBeVisible();
    await expect(cips).toBeDisabled();
    await expect(dodajVSkatlo(page, "Bučno olje, 1 L")).toBeDisabled();
    await expect(
      page.getByRole("list", { name: "V škatli" }).getByRole("button", { name: "Povečaj količino" }).first(),
    ).toBeDisabled();

    // Manjša škatla ni mogoča, dokler je v škatli preveč: večja jo reši.
    await page.getByRole("radio", { name: /Velika darilna škatla/ }).click();
    await expect(mesta(page)).toHaveText("Zasedena mesta: 3 od 6");
    await expect(cips).toBeEnabled();

    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);

    await page.getByRole("button", { name: "V košarico" }).click();
    await expect(page).toHaveURL(/\/kosarica$/);
    await expect(page.getByRole("heading", { name: "Velika darilna škatla" })).toBeVisible();

    // Urejanje: konfigurator z vsebino škatle, spremembe zamenjajo isto postavko.
    await page.getByRole("link", { name: "Uredi škatlo: Velika darilna škatla" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Uredite darilo" })).toBeVisible();
    await expect(mesta(page)).toHaveText("Zasedena mesta: 3 od 6");
    await page.getByRole("button", { name: "Odstrani iz škatle: Aronija sok, 1 L" }).click();
    await page.getByRole("button", { name: "Shrani spremembe" }).click();
    await expect(page).toHaveURL(/\/kosarica$/);
    const vsebina = page.getByRole("list", { name: "Vsebina: Velika darilna škatla" });
    await expect(vsebina).toHaveText("2 × Čebulni čips, 45 g");
    await expect(page.getByRole("heading", { name: "Velika darilna škatla" })).toHaveCount(1);
  });

  test("Z55: darilo po pošti na naslov prejemnika, plačano s kartico", async ({ page }) => {
    test.skip(PRAVI_STRIPE, "S pravimi ključi Stripe teče samo stripe-pravi.spec.ts.");
    await page.goto("/darila");
    await page.getByRole("link", { name: "Velika darilna škatla" }).click();
    await expect(page.getByRole("radio", { name: /Velika darilna škatla/ })).toBeChecked();
    await dodajVSkatlo(page, /^Dodaj v škatlo: Liofilizirane maline/).click();
    await dodajVSkatlo(page, "Bučno olje, 0,5 L").click();
    await page.getByRole("button", { name: "V košarico" }).click();
    await expect(page).toHaveURL(/\/kosarica$/);

    await page.getByRole("link", { name: "Na blagajno" }).click();
    await izpolniKontakt(page, "Branka");
    await dostava(page).getByRole("radio", { name: /Pošta/ }).click();
    await page.getByRole("checkbox", { name: "Pošlji na naslov prejemnika" }).click();
    await page.getByRole("textbox", { name: "Ime in priimek prejemnika", exact: true }).fill("Marija Kovač");
    await page.getByRole("textbox", { name: "Ulica in hišna številka", exact: true }).fill("Prešernova 5");
    await page.getByRole("textbox", { name: "Poštna številka", exact: true }).fill("1000");
    await page.getByRole("textbox", { name: "Kraj", exact: true }).fill("Ljubljana");
    await expect(placilo(page).getByRole("radio", { name: /S kartico/ })).toBeChecked();
    await soglasje(page).click();
    await page.getByRole("button", { name: "Na plačilo" }).click();

    await expect(page.getByRole("heading", { name: "Nadomestni Stripe" })).toBeVisible();
    // Velika škatla 8,00 + maline 8,00 + olje 12,00 + poštnina 5,00.
    await expect(page.getByTestId("znesek")).toHaveText("33,00 €");
    await page.getByRole("button", { name: "Plačaj", exact: true }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Hvala za vaše naročilo" })).toBeVisible();
    await expect(page.getByText("Darilo na naslov prejemnika:")).toBeVisible();
    await expect(page.getByText("Marija Kovač")).toBeVisible();
    await expect(page.getByText("Prešernova 5")).toBeVisible();

    const stevilka = (await page.getByTestId("stevilka-narocila").textContent())!.trim();
    const e2 = prebranaEposta().find((e) => e.zadeva.includes(stevilka) && e.za === "sandi.dercar@gmail.com");
    expect(e2?.besedilo).toContain("DARILO – potrdila in cen ne prilagajte paketu.");
    expect(e2?.besedilo).toContain("Marija Kovač, Prešernova 5, 1000 Ljubljana");
  });
});
