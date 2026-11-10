import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "nastavitve_trgovine" ADD COLUMN "prodajalec_geo_sirina" numeric;
  ALTER TABLE "nastavitve_trgovine" ADD COLUMN "prodajalec_geo_dolzina" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "nastavitve_trgovine" DROP COLUMN "prodajalec_geo_sirina";
  ALTER TABLE "nastavitve_trgovine" DROP COLUMN "prodajalec_geo_dolzina";`)
}
