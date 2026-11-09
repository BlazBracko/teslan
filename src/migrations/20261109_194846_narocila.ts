import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_narocila_postavke_tip" AS ENUM('izdelek', 'skatla');
  CREATE TYPE "public"."enum_narocila_status" AS ENUM('caka-placilo', 'novo', 'pripravljeno', 'poslano', 'zakljuceno', 'preklicano');
  CREATE TYPE "public"."enum_narocila_nacin_dostave" AS ENUM('prevzem', 'posta');
  CREATE TYPE "public"."enum_narocila_nacin_placila" AS ENUM('kartica', 'ob-prevzemu');
  CREATE TABLE "narocila_postavke" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tip" "enum_narocila_postavke_tip" DEFAULT 'izdelek' NOT NULL,
  	"ime" varchar NOT NULL,
  	"velikost" varchar,
  	"kolicina" numeric NOT NULL,
  	"cena_centi" numeric NOT NULL,
  	"stopnja_d_d_v" numeric NOT NULL,
  	"izdelek_id" integer,
  	"velikost_id" varchar
  );
  
  CREATE TABLE "narocila_ddv" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"stopnja" numeric NOT NULL,
  	"osnova_centi" numeric NOT NULL,
  	"ddv_centi" numeric NOT NULL
  );
  
  CREATE TABLE "narocila" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stevilka" varchar NOT NULL,
  	"status" "enum_narocila_status" DEFAULT 'novo' NOT NULL,
  	"zeton" varchar NOT NULL,
  	"nacin_dostave" "enum_narocila_nacin_dostave" NOT NULL,
  	"nacin_placila" "enum_narocila_nacin_placila" NOT NULL,
  	"placano" boolean DEFAULT false,
  	"kupec_ime" varchar NOT NULL,
  	"kupec_priimek" varchar NOT NULL,
  	"kupec_email" varchar NOT NULL,
  	"kupec_telefon" varchar NOT NULL,
  	"naslov_ulica" varchar,
  	"naslov_postna_stevilka" varchar,
  	"naslov_kraj" varchar,
  	"darilo" boolean DEFAULT false,
  	"prejemnik_ime" varchar,
  	"prejemnik_ulica" varchar,
  	"prejemnik_postna_stevilka" varchar,
  	"prejemnik_kraj" varchar,
  	"opomba" varchar,
  	"vmesni_sestevek_centi" numeric NOT NULL,
  	"postnina_centi" numeric NOT NULL,
  	"skupaj_centi" numeric NOT NULL,
  	"soglasje_pogoji" timestamp(3) with time zone NOT NULL,
  	"stevilka_posiljke" varchar,
  	"razlog_preklica" varchar,
  	"interna_opomba" varchar,
  	"zaloga_vrnjena" boolean DEFAULT false,
  	"napaka_eposte" varchar,
  	"stripe_session_id" varchar,
  	"stripe_payment_intent_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "narocila_id" integer;
  ALTER TABLE "narocila_postavke" ADD CONSTRAINT "narocila_postavke_izdelek_id_izdelki_id_fk" FOREIGN KEY ("izdelek_id") REFERENCES "public"."izdelki"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "narocila_postavke" ADD CONSTRAINT "narocila_postavke_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."narocila"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "narocila_ddv" ADD CONSTRAINT "narocila_ddv_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."narocila"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "narocila_postavke_order_idx" ON "narocila_postavke" USING btree ("_order");
  CREATE INDEX "narocila_postavke_parent_id_idx" ON "narocila_postavke" USING btree ("_parent_id");
  CREATE INDEX "narocila_postavke_izdelek_idx" ON "narocila_postavke" USING btree ("izdelek_id");
  CREATE INDEX "narocila_ddv_order_idx" ON "narocila_ddv" USING btree ("_order");
  CREATE INDEX "narocila_ddv_parent_id_idx" ON "narocila_ddv" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "narocila_stevilka_idx" ON "narocila" USING btree ("stevilka");
  CREATE INDEX "narocila_status_idx" ON "narocila" USING btree ("status");
  CREATE INDEX "narocila_stripe_session_id_idx" ON "narocila" USING btree ("stripe_session_id");
  CREATE INDEX "narocila_updated_at_idx" ON "narocila" USING btree ("updated_at");
  CREATE INDEX "narocila_created_at_idx" ON "narocila" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_narocila_fk" FOREIGN KEY ("narocila_id") REFERENCES "public"."narocila"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_narocila_id_idx" ON "payload_locked_documents_rels" USING btree ("narocila_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "narocila_postavke" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "narocila_ddv" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "narocila" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "narocila_postavke" CASCADE;
  DROP TABLE "narocila_ddv" CASCADE;
  DROP TABLE "narocila" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_narocila_fk";
  
  DROP INDEX "payload_locked_documents_rels_narocila_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "narocila_id";
  DROP TYPE "public"."enum_narocila_postavke_tip";
  DROP TYPE "public"."enum_narocila_status";
  DROP TYPE "public"."enum_narocila_nacin_dostave";
  DROP TYPE "public"."enum_narocila_nacin_placila";`)
}
