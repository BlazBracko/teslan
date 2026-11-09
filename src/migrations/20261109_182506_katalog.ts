import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_izdelki_nacin_prodaje" AS ENUM('posta-in-prevzem', 'samo-prevzem', 'samo-prikaz');
  CREATE TYPE "public"."enum_izdelki_sezona_od" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum_izdelki_sezona_do" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum_izdelki_stopnja_d_d_v" AS ENUM('9.5', '22');
  CREATE TABLE "izdelki_velikosti" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"oznaka" varchar NOT NULL,
  	"cena_centi" numeric,
  	"zaloga" numeric
  );
  
  CREATE TABLE "izdelki" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ime" varchar NOT NULL,
  	"slug" varchar,
  	"objavljen" boolean DEFAULT false,
  	"izpostavljen" boolean DEFAULT false,
  	"vrstni_red" numeric DEFAULT 0 NOT NULL,
  	"kategorija_id" integer NOT NULL,
  	"kratek_opis" varchar,
  	"opis" jsonb,
  	"sestavine" varchar,
  	"alergeni" varchar,
  	"nacin_prodaje" "enum_izdelki_nacin_prodaje" DEFAULT 'posta-in-prevzem' NOT NULL,
  	"sezona_od" "enum_izdelki_sezona_od",
  	"sezona_do" "enum_izdelki_sezona_do",
  	"stopnja_d_d_v" "enum_izdelki_stopnja_d_d_v" DEFAULT '9.5' NOT NULL,
  	"primerno_za_darilo" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "izdelki_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "kategorije" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ime" varchar NOT NULL,
  	"slug" varchar,
  	"vrstni_red" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "skupine_ponudbe" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ime" varchar NOT NULL,
  	"opis" varchar,
  	"slika_id" integer,
  	"vrstni_red" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "skupine_ponudbe_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"kategorije_id" integer
  );
  
  CREATE TABLE "nastavitve_trgovine" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"trgovina_odprta" boolean DEFAULT true,
  	"postnina_centi" numeric DEFAULT 500 NOT NULL,
  	"prag_brezplacne_postnine_centi" numeric DEFAULT 5000 NOT NULL,
  	"email_obvestil" varchar DEFAULT 'sandi.dercar@gmail.com' NOT NULL,
  	"navodila_za_prevzem" varchar,
  	"prodajalec_naziv" varchar,
  	"prodajalec_naslov" varchar,
  	"prodajalec_davcna_stevilka" varchar,
  	"prodajalec_maticna_stevilka" varchar,
  	"prodajalec_kmg_mid" varchar,
  	"prodajalec_telefon" varchar,
  	"prodajalec_email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "izdelki_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "kategorije_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "skupine_ponudbe_id" integer;
  ALTER TABLE "izdelki_velikosti" ADD CONSTRAINT "izdelki_velikosti_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."izdelki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "izdelki" ADD CONSTRAINT "izdelki_kategorija_id_kategorije_id_fk" FOREIGN KEY ("kategorija_id") REFERENCES "public"."kategorije"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "izdelki_rels" ADD CONSTRAINT "izdelki_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."izdelki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "izdelki_rels" ADD CONSTRAINT "izdelki_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "skupine_ponudbe" ADD CONSTRAINT "skupine_ponudbe_slika_id_media_id_fk" FOREIGN KEY ("slika_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "skupine_ponudbe_rels" ADD CONSTRAINT "skupine_ponudbe_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."skupine_ponudbe"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "skupine_ponudbe_rels" ADD CONSTRAINT "skupine_ponudbe_rels_kategorije_fk" FOREIGN KEY ("kategorije_id") REFERENCES "public"."kategorije"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "izdelki_velikosti_order_idx" ON "izdelki_velikosti" USING btree ("_order");
  CREATE INDEX "izdelki_velikosti_parent_id_idx" ON "izdelki_velikosti" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "izdelki_slug_idx" ON "izdelki" USING btree ("slug");
  CREATE INDEX "izdelki_objavljen_idx" ON "izdelki" USING btree ("objavljen");
  CREATE INDEX "izdelki_kategorija_idx" ON "izdelki" USING btree ("kategorija_id");
  CREATE INDEX "izdelki_updated_at_idx" ON "izdelki" USING btree ("updated_at");
  CREATE INDEX "izdelki_created_at_idx" ON "izdelki" USING btree ("created_at");
  CREATE INDEX "izdelki_rels_order_idx" ON "izdelki_rels" USING btree ("order");
  CREATE INDEX "izdelki_rels_parent_idx" ON "izdelki_rels" USING btree ("parent_id");
  CREATE INDEX "izdelki_rels_path_idx" ON "izdelki_rels" USING btree ("path");
  CREATE INDEX "izdelki_rels_media_id_idx" ON "izdelki_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX "kategorije_slug_idx" ON "kategorije" USING btree ("slug");
  CREATE INDEX "kategorije_updated_at_idx" ON "kategorije" USING btree ("updated_at");
  CREATE INDEX "kategorije_created_at_idx" ON "kategorije" USING btree ("created_at");
  CREATE INDEX "skupine_ponudbe_slika_idx" ON "skupine_ponudbe" USING btree ("slika_id");
  CREATE INDEX "skupine_ponudbe_updated_at_idx" ON "skupine_ponudbe" USING btree ("updated_at");
  CREATE INDEX "skupine_ponudbe_created_at_idx" ON "skupine_ponudbe" USING btree ("created_at");
  CREATE INDEX "skupine_ponudbe_rels_order_idx" ON "skupine_ponudbe_rels" USING btree ("order");
  CREATE INDEX "skupine_ponudbe_rels_parent_idx" ON "skupine_ponudbe_rels" USING btree ("parent_id");
  CREATE INDEX "skupine_ponudbe_rels_path_idx" ON "skupine_ponudbe_rels" USING btree ("path");
  CREATE INDEX "skupine_ponudbe_rels_kategorije_id_idx" ON "skupine_ponudbe_rels" USING btree ("kategorije_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_izdelki_fk" FOREIGN KEY ("izdelki_id") REFERENCES "public"."izdelki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_kategorije_fk" FOREIGN KEY ("kategorije_id") REFERENCES "public"."kategorije"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_skupine_ponudbe_fk" FOREIGN KEY ("skupine_ponudbe_id") REFERENCES "public"."skupine_ponudbe"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_izdelki_id_idx" ON "payload_locked_documents_rels" USING btree ("izdelki_id");
  CREATE INDEX "payload_locked_documents_rels_kategorije_id_idx" ON "payload_locked_documents_rels" USING btree ("kategorije_id");
  CREATE INDEX "payload_locked_documents_rels_skupine_ponudbe_id_idx" ON "payload_locked_documents_rels" USING btree ("skupine_ponudbe_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "izdelki_velikosti" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "izdelki" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "izdelki_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "kategorije" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "skupine_ponudbe" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "skupine_ponudbe_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nastavitve_trgovine" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "izdelki_velikosti" CASCADE;
  DROP TABLE "izdelki" CASCADE;
  DROP TABLE "izdelki_rels" CASCADE;
  DROP TABLE "kategorije" CASCADE;
  DROP TABLE "skupine_ponudbe" CASCADE;
  DROP TABLE "skupine_ponudbe_rels" CASCADE;
  DROP TABLE "nastavitve_trgovine" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_izdelki_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_kategorije_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_skupine_ponudbe_fk";
  
  DROP INDEX "payload_locked_documents_rels_izdelki_id_idx";
  DROP INDEX "payload_locked_documents_rels_kategorije_id_idx";
  DROP INDEX "payload_locked_documents_rels_skupine_ponudbe_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "izdelki_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "kategorije_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "skupine_ponudbe_id";
  DROP TYPE "public"."enum_izdelki_nacin_prodaje";
  DROP TYPE "public"."enum_izdelki_sezona_od";
  DROP TYPE "public"."enum_izdelki_sezona_do";
  DROP TYPE "public"."enum_izdelki_stopnja_d_d_v";`)
}
