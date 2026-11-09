import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "narocila_postavke_vsebina" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ime" varchar,
  	"velikost" varchar,
  	"kolicina" numeric,
  	"cena_centi" numeric,
  	"stopnja_d_d_v" numeric,
  	"izdelek_id" integer,
  	"velikost_id" varchar
  );
  
  CREATE TABLE "darilni_programi_vsebina" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"izdelek_id" integer,
  	"velikost_id" varchar,
  	"kolicina" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "darilni_programi" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ime" varchar NOT NULL,
  	"slug" varchar,
  	"objavljen" boolean DEFAULT false,
  	"vrstni_red" numeric DEFAULT 0 NOT NULL,
  	"opis" varchar,
  	"slika_id" integer,
  	"tip_skatle_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tipi_skatel" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ime" varchar NOT NULL,
  	"opis" varchar,
  	"slika_id" integer,
  	"stevilo_mest" numeric DEFAULT 3 NOT NULL,
  	"cena_centi" numeric NOT NULL,
  	"zaloga" numeric DEFAULT 0 NOT NULL,
  	"aktiven" boolean DEFAULT true,
  	"vrstni_red" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "narocila_postavke" ADD COLUMN "tip_skatle_id" integer;
  ALTER TABLE "narocila_postavke" ADD COLUMN "sporocilo_na_kartici" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "darilni_programi_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tipi_skatel_id" integer;
  ALTER TABLE "narocila_postavke_vsebina" ADD CONSTRAINT "narocila_postavke_vsebina_izdelek_id_izdelki_id_fk" FOREIGN KEY ("izdelek_id") REFERENCES "public"."izdelki"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "narocila_postavke_vsebina" ADD CONSTRAINT "narocila_postavke_vsebina_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."narocila_postavke"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "darilni_programi_vsebina" ADD CONSTRAINT "darilni_programi_vsebina_izdelek_id_izdelki_id_fk" FOREIGN KEY ("izdelek_id") REFERENCES "public"."izdelki"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "darilni_programi_vsebina" ADD CONSTRAINT "darilni_programi_vsebina_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."darilni_programi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "darilni_programi" ADD CONSTRAINT "darilni_programi_slika_id_media_id_fk" FOREIGN KEY ("slika_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "darilni_programi" ADD CONSTRAINT "darilni_programi_tip_skatle_id_tipi_skatel_id_fk" FOREIGN KEY ("tip_skatle_id") REFERENCES "public"."tipi_skatel"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tipi_skatel" ADD CONSTRAINT "tipi_skatel_slika_id_media_id_fk" FOREIGN KEY ("slika_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "narocila_postavke_vsebina_order_idx" ON "narocila_postavke_vsebina" USING btree ("_order");
  CREATE INDEX "narocila_postavke_vsebina_parent_id_idx" ON "narocila_postavke_vsebina" USING btree ("_parent_id");
  CREATE INDEX "narocila_postavke_vsebina_izdelek_idx" ON "narocila_postavke_vsebina" USING btree ("izdelek_id");
  CREATE INDEX "darilni_programi_vsebina_order_idx" ON "darilni_programi_vsebina" USING btree ("_order");
  CREATE INDEX "darilni_programi_vsebina_parent_id_idx" ON "darilni_programi_vsebina" USING btree ("_parent_id");
  CREATE INDEX "darilni_programi_vsebina_izdelek_idx" ON "darilni_programi_vsebina" USING btree ("izdelek_id");
  CREATE UNIQUE INDEX "darilni_programi_slug_idx" ON "darilni_programi" USING btree ("slug");
  CREATE INDEX "darilni_programi_objavljen_idx" ON "darilni_programi" USING btree ("objavljen");
  CREATE INDEX "darilni_programi_slika_idx" ON "darilni_programi" USING btree ("slika_id");
  CREATE INDEX "darilni_programi_tip_skatle_idx" ON "darilni_programi" USING btree ("tip_skatle_id");
  CREATE INDEX "darilni_programi_updated_at_idx" ON "darilni_programi" USING btree ("updated_at");
  CREATE INDEX "darilni_programi_created_at_idx" ON "darilni_programi" USING btree ("created_at");
  CREATE INDEX "tipi_skatel_slika_idx" ON "tipi_skatel" USING btree ("slika_id");
  CREATE INDEX "tipi_skatel_aktiven_idx" ON "tipi_skatel" USING btree ("aktiven");
  CREATE INDEX "tipi_skatel_updated_at_idx" ON "tipi_skatel" USING btree ("updated_at");
  CREATE INDEX "tipi_skatel_created_at_idx" ON "tipi_skatel" USING btree ("created_at");
  ALTER TABLE "narocila_postavke" ADD CONSTRAINT "narocila_postavke_tip_skatle_id_tipi_skatel_id_fk" FOREIGN KEY ("tip_skatle_id") REFERENCES "public"."tipi_skatel"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_darilni_programi_fk" FOREIGN KEY ("darilni_programi_id") REFERENCES "public"."darilni_programi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tipi_skatel_fk" FOREIGN KEY ("tipi_skatel_id") REFERENCES "public"."tipi_skatel"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "narocila_postavke_tip_skatle_idx" ON "narocila_postavke" USING btree ("tip_skatle_id");
  CREATE INDEX "payload_locked_documents_rels_darilni_programi_id_idx" ON "payload_locked_documents_rels" USING btree ("darilni_programi_id");
  CREATE INDEX "payload_locked_documents_rels_tipi_skatel_id_idx" ON "payload_locked_documents_rels" USING btree ("tipi_skatel_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "narocila_postavke_vsebina" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "darilni_programi_vsebina" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "darilni_programi" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tipi_skatel" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "narocila_postavke_vsebina" CASCADE;
  DROP TABLE "darilni_programi_vsebina" CASCADE;
  DROP TABLE "darilni_programi" CASCADE;
  DROP TABLE "tipi_skatel" CASCADE;
  ALTER TABLE "narocila_postavke" DROP CONSTRAINT "narocila_postavke_tip_skatle_id_tipi_skatel_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_darilni_programi_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tipi_skatel_fk";
  
  DROP INDEX "narocila_postavke_tip_skatle_idx";
  DROP INDEX "payload_locked_documents_rels_darilni_programi_id_idx";
  DROP INDEX "payload_locked_documents_rels_tipi_skatel_id_idx";
  ALTER TABLE "narocila_postavke" DROP COLUMN "tip_skatle_id";
  ALTER TABLE "narocila_postavke" DROP COLUMN "sporocilo_na_kartici";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "darilni_programi_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tipi_skatel_id";`)
}
