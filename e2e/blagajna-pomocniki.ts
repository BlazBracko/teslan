import { expect, type APIRequestContext, type Page } from "@playwright/test";

/** Skupni koraki e2e testov košarice, blagajne in plačila. */

export const ikona = (page: Page) => page.getByRole("banner").getByRole("link", { name: /^Košarica/ });

export async function dodaj(page: Page, slug: string, velikost: RegExp | null = null) {
  await page.goto(`/products/${slug}`);
  if (velikost) await page.getByRole("radiogroup").getByRole("radio", { name: velikost }).click();
  await page.getByRole("button", { name: "V košarico", exact: true }).click();
  await expect(page.getByText("Dodano v košarico", { exact: true }).last()).toBeVisible();
}

/** Id izdelka, prve velikosti in njena zaloga prek javnega REST. */
export async function velikost(request: APIRequestContext, slug: string) {
  const odziv = await request.get(`/api/izdelki?where[slug][equals]=${slug}&depth=0`);
  expect(odziv.ok()).toBe(true);
  const { docs } = (await odziv.json()) as {
    docs: Array<{ id: number; velikosti: Array<{ id: string; zaloga: number }> }>;
  };
  return { izdelekId: docs[0].id, velikostId: docs[0].velikosti[0].id, zaloga: docs[0].velikosti[0].zaloga };
}

export const zalogaIzdelka = async (request: APIRequestContext, slug: string) => (await velikost(request, slug)).zaloga;

export async function izpolniKontakt(page: Page, ime = "Ana") {
  await page.getByRole("textbox", { name: "Ime", exact: true }).fill(ime);
  await page.getByRole("textbox", { name: "Priimek", exact: true }).fill("Novak");
  await page.getByRole("textbox", { name: "E-pošta", exact: true }).fill("ana.novak@primer.si");
  await page.getByRole("textbox", { name: "Telefon", exact: true }).fill("040 123 456");
}

export const soglasje = (page: Page) => page.getByRole("checkbox", { name: /Strinjam se s splošnimi pogoji/ });
export const dostava = (page: Page) => page.getByRole("radiogroup", { name: "Način dostave" });
export const placilo = (page: Page) => page.getByRole("radiogroup", { name: "Način plačila" });
