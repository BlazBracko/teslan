/**
 * Testno uporabniško ime in geslo za Basic Auth strežnika `noindex`
 * (posnema staging, Z74). Nista skrivnost nobenega okolja.
 */
export const TESTNA_ZASCITA = { username: "teslan-e2e", password: "e2e-geslo:ni-skrivnost" } as const;

/** Izvor strežnika `noindex` (gl. playwright.config.ts). */
export const IZVOR_STAGING = `http://localhost:${Number(process.env.E2E_PORT ?? 3100) + 1}`;
