import { sql } from "@payloadcms/db-postgres";
import { getPayload, type Payload } from "payload";
import { migrations } from "../migrations";
import { testnoOkolje } from "./testna-baza";

// Tip v `payload` ima argumente migracij kot `unknown`; adapter jih poda
// pravilno (enako kot `payload migrate`).
type Migracije = NonNullable<
  NonNullable<Parameters<Payload["db"]["migrate"]>[0]>["migrations"]
>;

/**
 * Payload na očiščeni testni bazi za integracijske teste: shema se izbriše
 * in na novo zgradi z migracijami iz repa (enako kot na stagingu).
 */
export async function payloadNaCistiBazi(): Promise<Payload> {
  Object.assign(process.env, testnoOkolje());
  // Konfiguracija prebere okolje ob uvozu, zato jo uvozimo šele zdaj.
  const { default: config } = await import("../payload.config");
  const payload = await getPayload({ config });
  await payload.db.drizzle.execute(
    sql`DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;`,
  );
  await payload.db.migrate({ migrations: migrations as unknown as Migracije });
  return payload;
}
