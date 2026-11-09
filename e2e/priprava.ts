import { execFileSync } from "node:child_process";
import { testnoOkolje } from "../src/test/testna-baza";

/**
 * Pred e2e testi: testna baza se izprazni in na novo zgradi z migracijami
 * iz repa (`payload migrate:fresh`). Strežnika ob zagonu baze ne bereta,
 * zato je vrstni red glede na `webServer` vseeno.
 */
export default function priprava() {
  execFileSync("npx", ["payload", "migrate:fresh", "--force-accept-warning"], {
    env: { ...process.env, ...testnoOkolje() },
    stdio: "inherit",
  });
}
