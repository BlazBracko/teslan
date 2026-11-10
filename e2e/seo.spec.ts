import { expect, test, type Page } from "@playwright/test";

/**
 * SEO v produkciji (brez NOINDEX, Z70–Z73): metapodatki vsake javne strani,
 * robots.txt, zemljevid strani, OG in JSON-LD. Staging (S16) preverja
 * `e2e/noindex/zascita.spec.ts`.
 */

const JAVNE_STRANI = [
  "/",
  "/products",
  "/products/cesen-v-prahu",
  "/darila",
  "/darila/sestavi",
  "/about",
  "/pogoji",
  "/odstop",
  "/privacyPolicy",
  "/kosarica",
  "/blagajna",
];

async function jsonLd(page: Page): Promise<Array<Record<string, unknown>>> {
  const skripte = await page.locator('script[type="application/ld+json"]').allTextContents();
  return skripte.map((s) => JSON.parse(s) as Record<string, unknown>);
}

test("vsaka stran ima naslov, opis in absoluten kanonični URL (Z70)", async ({ page }) => {
  const naslovi = new Set<string>();
  for (const pot of JAVNE_STRANI) {
    const odziv = await page.goto(pot);
    expect(odziv?.status(), pot).toBe(200);
    expect(odziv?.headers()["x-robots-tag"], pot).toBeUndefined();
    const naslov = await page.title();
    expect(naslov, pot).toContain("Domačija Tešlan");
    naslovi.add(naslov);
    await expect(page.locator('meta[name="description"]'), pot).toHaveAttribute("content", /^.{20,}$/);
    const kanonicni = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(kanonicni, pot).toMatch(/^https?:\/\//);
    expect(new URL(kanonicni as string).pathname, pot).toBe(pot);
  }
  expect(naslovi.size).toBe(JAVNE_STRANI.length);
});

test("filter kategorije in pripravljen program imata pravi kanonični URL", async ({ page }) => {
  await page.goto("/products?kategorija=zacimbe");
  expect(new URL((await page.locator('link[rel="canonical"]').getAttribute("href")) as string).search).toBe("");
  await page.goto("/darila/sestavi?program=okusi-dolenjske");
  const kanonicni = new URL((await page.locator('link[rel="canonical"]').getAttribute("href")) as string);
  expect(`${kanonicni.pathname}${kanonicni.search}`).toBe("/darila/sestavi?program=okusi-dolenjske");
});

test("kosarica in blagajna nista indeksirani, javne strani so", async ({ page }) => {
  await page.goto("/kosarica");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.goto("/products");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

test("robots.txt dovoli javne strani in pokaže zemljevid (Z71)", async ({ request }) => {
  const odziv = await request.get("/robots.txt");
  expect(odziv.status()).toBe(200);
  const besedilo = await odziv.text();
  expect(besedilo).toMatch(/^Allow: \/$/m);
  expect(besedilo).toMatch(/^Disallow: \/admin$/m);
  expect(besedilo).not.toMatch(/^Disallow: \/$/m);
  expect(besedilo).toMatch(/^Sitemap: https?:\/\/.+\/sitemap\.xml$/m);
});

test("zemljevid strani vsebuje objavljene izdelke in programe, neobjavljenih ne (Z71)", async ({ request }) => {
  const odziv = await request.get("/sitemap.xml");
  expect(odziv.status()).toBe(200);
  const xml = await odziv.text();
  const naslovi = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].replace(/&amp;/g, "&")));
  const poti = naslovi.map((u) => `${u.pathname}${u.search}`);
  expect(poti).toEqual(
    expect.arrayContaining([
      "/",
      "/products",
      "/darila",
      "/pogoji",
      "/products/cesen-v-prahu",
      "/products/jagode",
      "/darila/sestavi?program=okusi-dolenjske",
    ]),
  );
  expect(poti).not.toContain("/products/skriti-izdelek");
  expect(poti.some((p) => p.startsWith("/kosarica") || p.startsWith("/blagajna"))).toBe(false);
});

test("OG slika: privzeta na domači strani, slika izdelka na podstrani (Z72)", async ({ page }) => {
  await page.goto("/");
  expect(await page.locator('meta[property="og:image"]').first().getAttribute("content")).toMatch(/^https?:\/\/.+\/og\.jpg$/);
  await page.goto("/products/cesen-v-prahu");
  const slika = await page.locator('meta[property="og:image"]').first().getAttribute("content");
  expect(slika).toMatch(/^https?:\/\//);
  expect(slika).not.toMatch(/\/og\.jpg$/);
  const odziv = await page.request.get(slika as string);
  expect(odziv.status()).toBe(200);
});

test("JSON-LD: LocalBusiness na / in /about, Product z ponudbo na izdelku (Z73)", async ({ page }) => {
  for (const pot of ["/", "/about"]) {
    await page.goto(pot);
    const [podjetje] = await jsonLd(page);
    expect(podjetje, pot).toMatchObject({
      "@type": "LocalBusiness",
      name: "Domačija Tešlan",
      telephone: "+38640578512",
      address: { "@type": "PostalAddress", postalCode: "8351", addressCountry: "SI" },
    });
    expect(podjetje.url, pot).toMatch(/^https?:\/\//);
  }

  await page.goto("/products/cesen-v-prahu");
  const [izdelek] = await jsonLd(page);
  expect(izdelek).toMatchObject({ "@type": "Product", name: "Česen v prahu" });
  expect(izdelek.offers).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ price: "5.00", priceCurrency: "EUR", availability: "https://schema.org/InStock" }),
    ]),
  );

  // Izdelek samo za prikaz ni naprodaj, zato nima Product.
  await page.goto("/products/jagode");
  expect(await jsonLd(page)).toEqual([]);
});

test("brez spremenljivk za geslo je stran odprta (Z74)", async ({ request }) => {
  const odziv = await request.get("/");
  expect(odziv.status()).toBe(200);
  expect(odziv.headers()["www-authenticate"]).toBeUndefined();
});
