import { expect, test } from "@playwright/test";

/**
 * Staging (S16): strežnik `noindex` teče z `NOINDEX=1` in Basic Auth
 * (`e2e/zascita.ts`). Projekt se prijavlja samodejno, zato testi brez gesla
 * uporabijo svoj kontekst zahtev brez poverilnic.
 */

test("robots.txt prepove vse, odgovori imajo X-Robots-Tag: noindex (Z71)", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/^Disallow: \/$/m);
  for (const pot of ["/", "/products", "/robots.txt", "/logo.png", "/sitemap.xml"]) {
    const odziv = await request.get(pot);
    expect(odziv.status(), pot).toBe(200);
    expect(odziv.headers()["x-robots-tag"], pot).toContain("noindex");
  }
});

test("brez gesla vrne 401, webhook Stripa pa ne (Z74)", async ({ playwright, baseURL }) => {
  const brezGesla = await playwright.request.newContext({ baseURL, httpCredentials: undefined });
  try {
    for (const pot of ["/", "/products", "/admin", "/api/izdelki", "/robots.txt", "/logo.png"]) {
      const odziv = await brezGesla.get(pot, { maxRedirects: 0 });
      expect(odziv.status(), pot).toBe(401);
      expect(odziv.headers()["www-authenticate"], pot).toMatch(/^Basic realm=/);
      expect(odziv.headers()["x-robots-tag"], pot).toContain("noindex");
    }

    const napacno = await brezGesla.get("/", {
      headers: { Authorization: `Basic ${Buffer.from("teslan-e2e:napacno").toString("base64")}` },
    });
    expect(napacno.status()).toBe(401);

    // Webhook ni za geslom: brez podpisa ga zavrne sam (400), ne zaščita (401).
    const webhook = await brezGesla.post("/api/stripe/webhook", { data: "{}" });
    expect(webhook.status()).toBe(400);
  } finally {
    await brezGesla.dispose();
  }
});

test("s pravim geslom se stran naloži in je tudi v HTML označena z noindex", async ({ page }) => {
  const odziv = await page.goto("/");
  expect(odziv?.status()).toBe(200);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  // Prijava v admin za geslom: e2e/zaprta/staging-admin.spec.ts (potrebuje administratorja).
});
