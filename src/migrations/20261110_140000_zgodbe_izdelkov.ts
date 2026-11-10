import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import { lexicalIzOdstavkov } from '../seed/lexical'
import { ZGODBE } from '../seed/zgodbe'

/**
 * Podatkovna migracija (brez spremembe sheme, zato brez posnetka .json):
 *  - izdelkom iz seeda, ki še nimajo dolgega opisa, vpiše osnutek zgodbe,
 *  - kratek opis jagod iz seeda ne trdi več, da so pridelane brez pesticidov
 *    (kmetija ni ekološka).
 * Opisov, ki jih je lastnik že vpisal ali spremenil, ne spreminja.
 */
const STAR_OPIS_JAGOD =
  'Sladke, sočne jagode, pridelane brez pesticidov. Popolne za sveže uživanje ali predelavo.'
const NOV_OPIS_JAGOD = 'Sladke, sočne jagode, nabrane zjutraj. Popolne za sveže uživanje ali predelavo.'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [slug, odstavki] of Object.entries(ZGODBE)) {
    const opis = JSON.stringify(lexicalIzOdstavkov(odstavki))
    await db.execute(sql`
      UPDATE "izdelki" SET "opis" = ${opis}::jsonb, "updated_at" = now()
      WHERE "slug" = ${slug} AND "opis" IS NULL`)
  }
  await db.execute(sql`
    UPDATE "izdelki" SET "kratek_opis" = ${NOV_OPIS_JAGOD}, "updated_at" = now()
    WHERE "slug" = 'jagode' AND "kratek_opis" = ${STAR_OPIS_JAGOD}`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Vpisane zgodbe ostanejo: lastnik jih je morda že urejal.
  await db.execute(sql`SELECT 1`)
}
