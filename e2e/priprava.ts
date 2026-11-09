import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { testnoOkolje } from "../src/test/testna-baza";

/**
 * Pred e2e testi: testna baza se izprazni, na novo zgradi z migracijami iz
 * repa (`payload migrate:fresh`) in napolni s seedom (katalog, nastavitve) ter testnimi
 * podatki iz `e2e/testni-podatki.ts` (npr. neobjavljen izdelek).
 * Administratorja seed ne ustvari (SEED_ADMIN_* sta prazni), ker
 * `admin.spec.ts` preverja obrazec za prvega uporabnika na prazni tabeli
 * uporabnikov.
 *
 * Playwright strežnika zažene pred tem korakom; kataloga do prvega testa ne
 * bereta (gl. `playwright.config.ts`). Predpomnjeni podatki prejšnjih zagonov
 * (`.next/cache/fetch-cache`) se izbrišejo, da testi vidijo sveži seed.
 */
export default function priprava() {
  const env = {
    ...process.env,
    ...testnoOkolje(),
    SEED_ADMIN_EMAIL: "",
    SEED_ADMIN_PASSWORD: "",
  };
  execFileSync("npx", ["payload", "migrate:fresh", "--force-accept-warning"], {
    env,
    stdio: "inherit",
  });
  execFileSync("npx", ["payload", "run", "src/seed/zazeni.ts", "ce-prazno"], {
    env,
    stdio: "inherit",
  });
  execFileSync("npx", ["payload", "run", "e2e/testni-podatki.ts"], { env, stdio: "inherit" });
  rmSync(".next/cache/fetch-cache", { recursive: true, force: true });
}
