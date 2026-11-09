/**
 * Testna baza (Vitest integracija, Playwright e2e). Testi vedno tečejo na
 * ločeni bazi, ki jo sami počistijo; razvojna baza ostane nedotaknjena.
 * Privzeto je to `teslan_test` v lokalnem Dockerju (`docker compose up -d`)
 * oz. Postgres servis v CI.
 */
export const TESTNA_BAZA_URL =
  process.env.TEST_DATABASE_URL ||
  "postgres://teslan:teslan@localhost:5432/teslan_test";

/** Skrivnost Payloada samo za teste (ni skrivnost nobenega okolja). */
export const TESTNA_SKRIVNOST = "testna-skrivnost-payload-0123456789abcdef";

/**
 * Varovalo pred brisanjem napačne baze: čistiti smemo le bazo, katere ime se
 * konča s `_test`.
 */
export function preveriTestnoBazo(url: string): void {
  const ime = new URL(url).pathname.replace(/^\//, "");
  if (!ime.endsWith("_test")) {
    throw new Error(
      `Testi smejo čistiti samo bazo z imenom *_test, ne "${ime}". Nastavite TEST_DATABASE_URL.`,
    );
  }
}

/** Okolje za procese, ki tečejo na testni bazi (strežnik, Payload CLI). */
export function testnoOkolje(): Record<string, string> {
  preveriTestnoBazo(TESTNA_BAZA_URL);
  return { DATABASE_URL: TESTNA_BAZA_URL, PAYLOAD_SECRET: TESTNA_SKRIVNOST };
}
