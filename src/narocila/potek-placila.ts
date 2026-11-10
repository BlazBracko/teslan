import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import type Stripe from "stripe";
import type { Narocila } from "@/payload-types";
import { sejaBaze } from "./baza";
import { posljiObvestilaONovemNarocilu } from "../eposta/obvestila";
import type { PonudnikPlacil, StanjeSeje } from "./placila";
import { potNarocila } from "./pogled";
import { zetonaSeUjemata } from "./stevilka";
import { stanjeIzSeje } from "./stripe";

/**
 * Obdelava plačil s kartico (Z41, Z42, P10). Isti koraki tečejo ob
 * dogodku webhooka, ob vrnitvi kupca s Stripa in v varovalki za pozabljena
 * naročila, zato je vsak korak idempotenten: ponovljen dogodek ne spremeni
 * ničesar in ne pošlje e-pošte še enkrat (S8).
 */

export const RAZLOG_NEPLACANO = "Neplačano: plačilo s kartico ni bilo opravljeno v 30 minutah.";
export const RAZLOG_PREKINJENO = "Neplačano: kupec je plačilo s kartico prekinil.";
const OPOMBA_PLACILO_PO_PREKLICU =
  "Plačilo s kartico je prispelo, ko je bilo naročilo že preklicano. Znesek vrnite kupcu v Stripu.";

/** Varovalka (P10): naročilo, ki čaka na plačilo dlje od tega, se uskladi s Stripom. */
export const ZAMUDA_VAROVALKE_MS = 35 * 60 * 1000;

export type IzidPlacila =
  /** Naročilo je zdaj plačano; E1 in E2 sta poslana. */
  | "placano"
  /** Naročilo je zdaj preklicano, zaloga vrnjena. */
  | "preklicano"
  /** Dogodek je bil že obdelan; nič se ni spremenilo. */
  | "ze-obdelano"
  /** Plačilo za že preklicano naročilo: zapisano za ročno vračilo. */
  | "placano-po-preklicu"
  /** Seja je še odprta (kupec še lahko plača). */
  | "caka"
  /** Dogodek ni za to trgovino ali ne zahteva ničesar. */
  | "prezrto";

/** Naročilo, ki mu pripada seja (po id iz metapodatkov in po id seje). */
async function narociloSeje(payload: Payload, sejaId: string, narociloId: number | null): Promise<Narocila | null> {
  const { docs } = await payload.find({
    collection: "narocila",
    where: {
      and: [{ stripeSessionId: { equals: sejaId } }, ...(narociloId ? [{ id: { equals: narociloId } }] : [])],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return docs[0] ?? null;
}

/**
 * Zaključena in plačana seja (Z41): naročilo postane „Novo“ in plačano,
 * shrani se id plačila, kupec in prodajalec dobita E1 in E2. Prehod
 * naredi en pogojni SQL stavek, zato ga od več hkratnih klicev izvede samo
 * eden in e-pošta gre natanko enkrat.
 */
export async function potrdiPlacilo(payload: Payload, stanje: StanjeSeje): Promise<IzidPlacila> {
  if (stanje.status !== "complete" || !stanje.placano) return "prezrto";
  const n = await narociloSeje(payload, stanje.id, stanje.narociloId);
  if (!n) {
    payload.logger.warn({ seja: stanje.id }, "Stripe: plačana seja brez naročila v tej trgovini, prezrto.");
    return "prezrto";
  }

  const seja = await sejaBaze(payload);
  const prevzeto = await seja.execute(
    sql`UPDATE narocila
        SET status = 'novo', placano = true,
            stripe_payment_intent_id = COALESCE(${stanje.paymentIntentId}, stripe_payment_intent_id),
            updated_at = now()
        WHERE id = ${n.id} AND stripe_session_id = ${stanje.id} AND status = 'caka-placilo'
        RETURNING id`,
  );
  if (prevzeto.rows.length > 0) {
    const [narocilo, nastavitve] = await Promise.all([
      payload.findByID({ collection: "narocila", id: n.id, depth: 0, overrideAccess: true }),
      payload.findGlobal({ slug: "nastavitve-trgovine", depth: 0 }),
    ]);
    payload.logger.info({ narocilo: narocilo.stevilka }, "Stripe: naročilo plačano.");
    await posljiObvestilaONovemNarocilu(payload, narocilo, nastavitve);
    return "placano";
  }

  // Ni več „Čaka na plačilo“: dogodek je že obdelan, ali pa je Sandi
  // naročilo medtem ročno spremenil. Plačilo se zapiše le enkrat.
  const preklicano = n.status === "preklicano";
  const oznaceno = await seja.execute(
    sql`UPDATE narocila
        SET placano = true,
            stripe_payment_intent_id = COALESCE(${stanje.paymentIntentId}, stripe_payment_intent_id),
            interna_opomba = CASE WHEN status = 'preklicano'
              THEN concat_ws(E'\n', NULLIF(interna_opomba, ''), ${OPOMBA_PLACILO_PO_PREKLICU}::text)
              ELSE interna_opomba END,
            updated_at = now()
        WHERE id = ${n.id} AND stripe_session_id = ${stanje.id} AND placano IS DISTINCT FROM true
        RETURNING id`,
  );
  if (oznaceno.rows.length === 0) return "ze-obdelano";
  if (preklicano) {
    payload.logger.error({ narocilo: n.stevilka }, `Stripe: ${OPOMBA_PLACILO_PO_PREKLICU}`);
    return "placano-po-preklicu";
  }
  return "placano";
}

/**
 * Seja je potekla ali je bila prekinjena (Z41, Z42): naročilo, ki še čaka
 * na plačilo, se prekliče in zaloga se vrne (enkrat, hook v `Narocila`).
 * Kupec e-pošte ne dobi.
 */
export async function preklicNeplacanega(
  payload: Payload,
  n: Pick<Narocila, "id" | "status">,
  razlog: string,
): Promise<IzidPlacila> {
  if (n.status === "preklicano") return "ze-obdelano";
  if (n.status !== "caka-placilo") return "prezrto";
  await payload.update({
    collection: "narocila",
    id: n.id,
    data: { status: "preklicano", razlogPreklica: razlog },
    overrideAccess: true,
    // Seja pri Stripu je že potekla; hook je ne poskuša izteči še enkrat.
    context: { brezStripa: true },
  });
  return "preklicano";
}

/** Dogodek webhooka (Z41). Neznane vrste dogodkov se prezrejo. */
export async function obdelajDogodek(payload: Payload, dogodek: Stripe.Event): Promise<IzidPlacila> {
  switch (dogodek.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return potrdiPlacilo(payload, stanjeIzSeje(dogodek.data.object));
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const stanje = stanjeIzSeje(dogodek.data.object);
      const n = await narociloSeje(payload, stanje.id, stanje.narociloId);
      return n ? preklicNeplacanega(payload, n, RAZLOG_NEPLACANO) : "prezrto";
    }
    default:
      return "prezrto";
  }
}

/**
 * Uskladi naročilo, ki čaka na plačilo, s stanjem seje pri ponudniku. Z
 * `prekini` se odprta seja najprej izteče (Z42). Plačana seja naročilo
 * potrdi, potekla ga prekliče.
 */
export async function uskladiSPonudnikom(
  payload: Payload,
  ponudnik: PonudnikPlacil,
  n: Narocila,
  { prekini, razlog }: { prekini: boolean; razlog: string },
): Promise<IzidPlacila> {
  if (n.status !== "caka-placilo") return n.placano || n.status === "preklicano" ? "ze-obdelano" : "prezrto";
  if (!n.stripeSessionId) return prekini ? preklicNeplacanega(payload, n, razlog) : "caka";

  const stanje = prekini ? await ponudnik.prekiniSejo(n.stripeSessionId) : await ponudnik.preberiSejo(n.stripeSessionId);
  if (stanje.status === "complete") {
    return stanje.placano ? potrdiPlacilo(payload, { ...stanje, narociloId: n.id }) : "caka";
  }
  if (stanje.status === "expired") return preklicNeplacanega(payload, n, razlog);
  return "caka";
}

/** Naročilo po številki, a samo s pravilnim žetonom (Z32). */
export async function narociloZZetonom(payload: Payload, stevilka: string, zeton: string | null | undefined) {
  if (!zeton) return null;
  const { docs } = await payload.find({
    collection: "narocila",
    where: { stevilka: { equals: stevilka } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const n = docs[0];
  return n && zetonaSeUjemata(n.zeton, zeton) ? n : null;
}

/**
 * Kupec je na Stripu plačilo prekinil (Z42): seja se takoj izteče in
 * naročilo prekliče (zaloga se vrne). Če je bilo medtem vendarle plačano,
 * vrne pot do potrdila naročila.
 */
export async function preklicObVrnitvi(
  payload: Payload,
  ponudnik: PonudnikPlacil | null,
  stevilka: string,
  zeton: string | null | undefined,
): Promise<{ izid: IzidPlacila; stevilka?: string; potNarocila?: string }> {
  const n = await narociloZZetonom(payload, stevilka, zeton);
  if (!n || !ponudnik) return { izid: "prezrto" };
  const izid = await uskladiSPonudnikom(payload, ponudnik, n, { prekini: true, razlog: RAZLOG_PREKINJENO });
  const placano = izid === "placano" || (izid === "ze-obdelano" && n.placano);
  return { izid, stevilka: n.stevilka, ...(placano ? { potNarocila: potNarocila(n.stevilka, n.zeton) } : {}) };
}

/**
 * Varovalka za izgubljene dogodke webhooka (P10): kartična naročila, ki
 * čakajo na plačilo dlje od `ZAMUDA_VAROVALKE_MS`, se uskladijo s Stripom
 * (odprta seja se izteče, naročilo prekliče). Vrne število preklicanih.
 */
export async function pocistiNeplacana(payload: Payload, ponudnik: PonudnikPlacil, zdaj = new Date()): Promise<number> {
  const { docs } = await payload.find({
    collection: "narocila",
    where: {
      and: [
        { status: { equals: "caka-placilo" } },
        { createdAt: { less_than: new Date(zdaj.getTime() - ZAMUDA_VAROVALKE_MS).toISOString() } },
      ],
    },
    sort: "createdAt",
    limit: 20,
    depth: 0,
    overrideAccess: true,
  });
  let preklicana = 0;
  for (const n of docs) {
    try {
      if ((await uskladiSPonudnikom(payload, ponudnik, n, { prekini: true, razlog: RAZLOG_NEPLACANO })) === "preklicano") {
        preklicana += 1;
      }
    } catch (napaka) {
      payload.logger.error({ err: napaka, narocilo: n.stevilka }, "Usklajevanje neplačanega naročila s Stripom ni uspelo");
    }
  }
  return preklicana;
}
