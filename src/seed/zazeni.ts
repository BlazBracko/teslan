/**
 * Zagon seeda iz ukazne vrstice (prek `payload run`, ki naloži `.env*`):
 *   npm run seed            → dopolni manjkajoče (gl. seed.ts)
 *   npm run seed:if-empty   → katalog le v prazni bazi (pred deployem)
 */
import { getPayload } from "payload";
import { preberiOkolje } from "../env";
import config from "../payload.config";
import { seed } from "./seed";

const env = preberiOkolje(process.env, ["DATABASE_URL", "PAYLOAD_SECRET"]);
const nacin = process.argv.includes("ce-prazno") ? "ce-prazno" : "dopolni";

const payload = await getPayload({ config });
let izhod = 0;
try {
  await seed(payload, {
    nacin,
    admin: { email: env.SEED_ADMIN_EMAIL, geslo: env.SEED_ADMIN_PASSWORD },
  });
} catch (napaka) {
  payload.logger.error({ err: napaka }, "Seed ni uspel");
  izhod = 1;
} finally {
  await payload.destroy();
}
process.exit(izhod);
