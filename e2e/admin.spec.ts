import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/**
 * Admin (K3: Z80, Z81, Z83) na prazni testni bazi: prvi uporabnik, vloge,
 * slovenski vmesnik in nalaganje slik. Testi si delijo stanje baze, zato
 * tečejo po vrsti.
 */
test.describe.configure({ mode: "serial" });

const admin = {
  ime: "Prvi Admin",
  email: "admin@teslan.test",
  geslo: "geslo-admina-123",
};
const urednik = {
  ime: "Sandi Urednik",
  email: "urednik@teslan.test",
  geslo: "geslo-urednika-123",
};

async function prijava(page: Page, uporabnik: { email: string; geslo: string }) {
  await page.goto("/admin/login");
  await page.locator("#field-email").fill(uporabnik.email);
  await page.locator("#field-password").fill(uporabnik.geslo);
  await page.getByRole("button", { name: "Prijava" }).click();
  await page.waitForURL(/\/admin$/);
}

const navigacija = (page: Page) => page.locator("nav");

test("prvi zagon ustvari administratorja v slovenskem vmesniku", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/create-first-user/);
  await expect(page.locator("html")).toHaveAttribute("lang", "sl");
  await expect(page.getByRole("heading", { name: "Dobrodošli" })).toBeVisible();
  // Prvi uporabnik je vedno admin, zato vloge ni mogoče izbrati.
  await expect(page.locator("#field-vloga")).toHaveCount(0);
  await expect(page.getByText("Prikazano v adminu")).toBeVisible();

  await page.locator("#field-email").fill(admin.email);
  await page.locator("#field-password").fill(admin.geslo);
  await page.locator("#field-confirm-password").fill(admin.geslo);
  await page.locator("#field-ime").fill(admin.ime);
  await page.getByRole("button", { name: "Ustvari" }).click();
  await page.waitForURL(/\/admin$/);

  await expect(navigacija(page).getByRole("link", { name: "Uporabniki" })).toBeVisible();
  await expect(navigacija(page).getByRole("link", { name: "Mediji" })).toBeVisible();

  const jaz = await (await page.request.get("/api/users/me")).json();
  expect(jaz.user).toMatchObject({ email: admin.email, vloga: "admin" });

  // Admin doda urednika (privzeta vloga).
  const odziv = await page.request.post("/api/users", {
    data: { ime: urednik.ime, email: urednik.email, password: urednik.geslo },
  });
  expect(odziv.status()).toBe(201);
  expect((await odziv.json()).doc.vloga).toBe("urednik");
});

test("urednik ne vidi drugih uporabnikov in si ne more spremeniti vloge", async ({ page }) => {
  await prijava(page, urednik);

  await expect(navigacija(page).getByRole("link", { name: "Mediji" })).toBeVisible();
  await expect(navigacija(page).getByRole("link", { name: "Uporabniki" })).toHaveCount(0);

  const seznam = await (await page.request.get("/api/users")).json();
  expect(seznam.totalDocs).toBe(1);
  expect(seznam.docs[0].email).toBe(urednik.email);

  const id = seznam.docs[0].id;
  const odziv = await page.request.patch(`/api/users/${id}`, {
    data: { vloga: "admin" },
  });
  expect(odziv.ok()).toBe(true);
  expect((await odziv.json()).doc.vloga).toBe("urednik");

  const ustvari = await page.request.post("/api/users", {
    data: { ime: "Vsiljivec", email: "x@teslan.test", password: "geslo-vsiljivca-1" },
  });
  expect(ustvari.status()).toBe(403);
});

test("slika brez opisa (alt) se zavrne, z opisom se shrani na lokalni disk", async ({ page }) => {
  await prijava(page, urednik);
  const png = readFileSync("public/logo.png");
  const datoteka = { name: "e2e-logo.png", mimeType: "image/png", buffer: png };

  const brezAlt = await page.request.post("/api/media", {
    multipart: { file: datoteka, _payload: JSON.stringify({}) },
  });
  expect(brezAlt.status()).toBe(400);

  const zAlt = await page.request.post("/api/media", {
    multipart: {
      file: datoteka,
      _payload: JSON.stringify({ alt: "Logotip Domačije Tešlan" }),
    },
  });
  expect(zAlt.status()).toBe(201);
  const { doc } = await zAlt.json();
  expect(doc.url).toMatch(/^\/api\/media\/file\/e2e-logo/);

  // Slika je javno dostopna tudi brez prijave.
  const slika = await page.context().request.fetch(doc.url, { headers: { cookie: "" } });
  expect(slika.status()).toBe(200);
  expect(slika.headers()["content-type"]).toBe("image/png");

  const izbris = await page.request.delete(`/api/media/${doc.id}`);
  expect(izbris.ok()).toBe(true);
});
