import { defineConfig, devices } from "@playwright/test";
import { DNEVNIK_EPOSTE } from "./e2e/eposta";
import { testnoOkolje } from "./src/test/testna-baza";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const PORT_NOINDEX = PORT + 1;
const baseURL = `http://localhost:${PORT}`;
const baseURLNoindex = `http://localhost:${PORT_NOINDEX}`;

/**
 * E2E testi tečejo na produkcijski gradnji (`next build && next start`).
 * PLAYWRIGHT_CHROMIUM_EXECUTABLE omogoča uporabo že nameščenega Chromiuma
 * (npr. v peskovniku), sicer se uporabi brskalnik iz `npx playwright install`.
 *
 * Ista gradnja teče dvakrat: kot produkcija (brez NOINDEX) in kot staging
 * (`NOINDEX=1`). Testi v `e2e/noindex/` tečejo samo proti drugi. Strežnika
 * se zaženeta po vrsti, zato drugi počaka na gradnjo prvega.
 *
 * Oba uporabljata testno bazo (`teslan_test`), ki jo `e2e/priprava.ts` pred
 * testi izprazni, migrira in napolni s seedom. Strežnika Playwright zažene
 * pred `globalSetup`, zato preverjanje pripravljenosti ne sme seči v bazo
 * (statična datoteka): sicer bi se Payload povezal na bazo, ki jo priprava
 * nato izbriše, strežnik pa bi lahko predpomnil prazen katalog.
 *
 * E-pošta se brez Resenda zapisuje v `DNEVNIK_EPOSTE` (testi jo preberejo,
 * S9). Omejitev naročil na IP (Z26) je za teste dvignjena, ker vsa
 * naročila pridejo z istega naslova; omejitev preverja enotni test.
 *
 * Projekt `zaprta-trgovina` (S15) zapre trgovino v nastavitvah, zato teče
 * šele, ko so ostali testi končani, in jo na koncu spet odpre.
 */
const okoljeStreznika = {
  ...testnoOkolje(),
  EPOSTA_DNEVNIK: DNEVNIK_EPOSTE,
  OMEJITEV_NAROCIL_NA_IP: "1000",
};
const pripravljen = (izvor: string) => `${izvor}/logo.png`;
const chromium = {
  ...devices["Desktop Chrome"],
  launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {},
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  globalSetup: "./e2e/priprava.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: [/noindex\//, /zaprta\//],
      use: { ...chromium, baseURL },
    },
    {
      name: "noindex",
      testMatch: /noindex\/.*\.spec\.ts/,
      use: { ...chromium, baseURL: baseURLNoindex },
    },
    {
      name: "zaprta-trgovina",
      testMatch: /zaprta\/.*\.spec\.ts/,
      dependencies: ["chromium", "noindex"],
      use: { ...chromium, baseURL },
    },
  ],
  webServer: [
    {
      command: process.env.E2E_SKIP_BUILD
        ? `npm run start -- --port ${PORT}`
        : `npm run build && npm run start -- --port ${PORT}`,
      url: pripravljen(baseURL),
      env: { ...okoljeStreznika, NOINDEX: "" },
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
    {
      command: `npm run start -- --port ${PORT_NOINDEX}`,
      url: pripravljen(baseURLNoindex),
      env: { ...okoljeStreznika, NOINDEX: "1" },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
