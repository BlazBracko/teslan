import { sql } from "@payloadcms/db-postgres";
import type { CollectionAfterChangeHook, Payload, PayloadRequest } from "payload";
import { okolje } from "../env";
import { kontaktIzNastavitev, type PodatkiProdajalca } from "../lib/kontakt";
import { kljucPrejsnjegaStatusa, sejaBaze } from "../narocila/baza";
import { narociloPogled, potNarocila } from "../narocila/pogled";
import type { StatusNarocila } from "../narocila/statusi";
import type { Narocila } from "../payload-types";
import { obvestiloObStatusu, obvestiloProdajalcu, potrdiloKupcu, type Sporocilo } from "./narocila";

/**
 * Pošiljanje obvestil o naročilu (Z56–Z59). Napaka pri pošiljanju nikoli
 * ne razveljavi naročila ali spremembe statusa: zapiše se v log in na
 * naročilo (`napakaEposte`), da jo Sandi vidi v adminu.
 *
 * Dosegljivo iz konfiguracije Payloada (hook kolekcije), zato uvaža
 * relativno.
 */

export interface NastavitveZaEposto {
  emailObvestil?: string | null;
  navodilaZaPrevzem?: string | null;
  prodajalec?: PodatkiProdajalca | null;
}

const opisNapake = (napaka: unknown) => (napaka instanceof Error ? napaka.message : String(napaka));

function izvorStrani(): string {
  return (okolje().NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
}

async function poslji(
  payload: Payload,
  { za, odgovorNa, sporocilo }: { za: string; odgovorNa?: string | null; sporocilo: Sporocilo },
): Promise<void> {
  await payload.sendEmail({
    to: za,
    replyTo: odgovorNa ?? undefined,
    subject: sporocilo.zadeva,
    text: sporocilo.besedilo,
    html: sporocilo.html,
  });
}

/**
 * Zapiše napake na naročilo (doda jih obstoječim) in v log. Uporabi
 * transakcijo iz `req`, če je podana, sicer samostojno poizvedbo.
 */
export async function zabeleziNapakeEposte(
  payload: Payload,
  narocilo: Pick<Narocila, "id" | "stevilka">,
  napake: readonly string[],
  req?: Partial<PayloadRequest>,
): Promise<void> {
  if (napake.length === 0) return;
  payload.logger.error({ narocilo: narocilo.stevilka, napake }, "Pošiljanje e-pošte ob naročilu ni uspelo");
  const cas = new Date().toISOString().slice(0, 16).replace("T", " ");
  const zapis = napake.map((n) => `[${cas} UTC] ${n}`).join("\n");
  try {
    const seja = await sejaBaze(payload, req);
    await seja.execute(
      sql`UPDATE narocila
          SET napaka_eposte = concat_ws(E'\n', NULLIF(napaka_eposte, ''), ${zapis}::text)
          WHERE id = ${narocilo.id}`,
    );
  } catch (napaka) {
    payload.logger.error({ err: napaka, narocilo: narocilo.stevilka }, "Napake e-pošte ni bilo mogoče zapisati");
  }
}

/** E1 kupcu in E2 prodajalcu ob novem naročilu (Z43, Z57). */
export async function posljiObvestilaONovemNarocilu(
  payload: Payload,
  narocilo: Narocila,
  nastavitve: NastavitveZaEposto,
): Promise<void> {
  const izvor = izvorStrani();
  const pogled = narociloPogled(narocilo);
  const kontakt = kontaktIzNastavitev(nastavitve.prodajalec);
  const napake: string[] = [];

  try {
    await poslji(payload, {
      za: narocilo.kupec.email,
      odgovorNa: nastavitve.emailObvestil,
      sporocilo: potrdiloKupcu(pogled, {
        povezava: `${izvor}${potNarocila(narocilo.stevilka, narocilo.zeton)}`,
        navodilaZaPrevzem: nastavitve.navodilaZaPrevzem ?? null,
        kontakt,
      }),
    });
  } catch (napaka) {
    napake.push(`Potrdilo kupcu (E1): ${opisNapake(napaka)}`);
  }

  if (nastavitve.emailObvestil) {
    try {
      await poslji(payload, {
        za: nastavitve.emailObvestil,
        odgovorNa: narocilo.kupec.email,
        sporocilo: obvestiloProdajalcu(pogled, { povezavaAdmin: `${izvor}/admin/collections/narocila/${narocilo.id}` }),
      });
    } catch (napaka) {
      napake.push(`Obvestilo prodajalcu (E2): ${opisNapake(napaka)}`);
    }
  } else {
    napake.push("Obvestilo prodajalcu (E2): v nastavitvah trgovine ni e-pošte za obvestila.");
  }

  await zabeleziNapakeEposte(payload, narocilo, napake);
}

/**
 * Obvestilo kupcu ob spremembi statusa (E3–E5, Z57). Teče po shranjevanju
 * v adminu in pri vsaki drugi spremembi prek Payloada; `context.brezEposte`
 * ga izklopi. Žeton se prebere iz baze, ker ga Payload v dokumentu ne vrne.
 */
export const obvestiloObSpremembiStatusa: CollectionAfterChangeHook<Narocila> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== "update" || !previousDoc || req.context.brezEposte) return doc;
  // Status pred spremembo, kot ga je videl zaklep v `beforeChange`; pri
  // sočasnem shranjevanju je to status, ki ga je zapisalo prvo.
  const od = (req.context[kljucPrejsnjegaStatusa(doc.id)] ?? previousDoc.status) as StatusNarocila;
  const na = doc.status as StatusNarocila;
  if (od === na) return doc;

  const { payload } = req;
  try {
    const seja = await sejaBaze(payload, req);
    const [nastavitve, vrstice] = await Promise.all([
      payload.findGlobal({ slug: "nastavitve-trgovine", depth: 0, req }),
      seja.execute(sql`SELECT zeton FROM narocila WHERE id = ${doc.id}`),
    ]);
    const zeton = String((vrstice.rows[0] as { zeton?: string } | undefined)?.zeton ?? "");
    const obvestilo = obvestiloObStatusu(od, na, narociloPogled(doc), {
      povezava: `${izvorStrani()}${potNarocila(doc.stevilka, zeton)}`,
      navodilaZaPrevzem: nastavitve.navodilaZaPrevzem ?? null,
      kontakt: kontaktIzNastavitev(nastavitve.prodajalec),
    });
    if (!obvestilo) return doc;
    try {
      await poslji(payload, { za: doc.kupec.email, odgovorNa: nastavitve.emailObvestil, sporocilo: obvestilo.sporocilo });
    } catch (napaka) {
      await zabeleziNapakeEposte(payload, doc, [`${obvestilo.oznaka}: ${opisNapake(napaka)}`], req);
    }
  } catch (napaka) {
    // Tudi nepričakovana napaka (npr. branje nastavitev) ne ustavi shranjevanja (Z59).
    await zabeleziNapakeEposte(payload, doc, [`Obvestilo ob statusu „${na}“: ${opisNapake(napaka)}`], req);
  }
  return doc;
};
