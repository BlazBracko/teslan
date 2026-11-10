import { resendAdapter } from "@payloadcms/email-resend";
import type { EmailAdapter, SendEmailOptions } from "payload";
import type { Env } from "../env";
import { dnevnikEposte, razberiPosiljatelja } from "./dnevnik";

/**
 * Izbira poti za e-pošto (Z56, Z58):
 *
 * - `RESEND_API_KEY` nastavljen → pošiljanje prek Resenda (REST API),
 * - sicer → izpis v log strežnika (in v `EPOSTA_DNEVNIK` za teste),
 * - `EMAIL_REDIRECT_TO` nastavljen (staging) → vsa pošta gre na ta naslov,
 *   zadeva dobi predpono `[STAGING → <prvotni prejemniki>]`.
 *
 * Pošiljatelj je `EMAIL_FROM` (privzeto „Domačija Tešlan
 * <narocila@teslan.si>“). Datoteka je dosegljiva iz konfiguracije Payloada,
 * zato uvaža relativno.
 */

type Naslovi = SendEmailOptions["to"];

/** Vsi naslovi iz polja `to`/`cc`/`bcc` kot seznam nizov. */
export function seznamNaslovov(v: Naslovi): string[] {
  if (!v) return [];
  const seznam = Array.isArray(v) ? v : [v];
  return seznam.map((n) => (typeof n === "string" ? n : n.address)).filter(Boolean);
}

/** Predpona zadeve pri preusmeritvi na stagingu (Z58). */
export function zadevaPreusmeritve(zadeva: string, prvotni: readonly string[]): string {
  return `[STAGING → ${prvotni.length ? prvotni.join(", ") : "brez prejemnika"}] ${zadeva}`;
}

/** Sporočilo, preusmerjeno na en naslov; kopije (`cc`, `bcc`) odpadejo. */
export function preusmeri(sporocilo: SendEmailOptions, naslov: string): SendEmailOptions {
  const prvotni = [...seznamNaslovov(sporocilo.to), ...seznamNaslovov(sporocilo.cc), ...seznamNaslovov(sporocilo.bcc)];
  return {
    ...sporocilo,
    to: naslov,
    cc: undefined,
    bcc: undefined,
    subject: zadevaPreusmeritve(String(sporocilo.subject ?? ""), prvotni),
  };
}

/** Ovije adapter tako, da gre vsa pošta na `naslov` (staging, Z58). */
export function sPreusmeritvijo<T>(adapter: EmailAdapter<T>, naslov: string): EmailAdapter<T> {
  return (args) => {
    const notranji = adapter(args);
    return {
      ...notranji,
      name: `${notranji.name}-preusmeritev`,
      sendEmail: (sporocilo) => notranji.sendEmail(preusmeri(sporocilo, naslov)),
    };
  };
}

export type NacinPosiljanja = "resend" | "dnevnik";

export function nacinPosiljanja(env: Pick<Env, "RESEND_API_KEY">): NacinPosiljanja {
  return env.RESEND_API_KEY ? "resend" : "dnevnik";
}

export function adapterEposte(
  env: Pick<Env, "RESEND_API_KEY" | "EMAIL_FROM" | "EMAIL_REDIRECT_TO" | "EPOSTA_DNEVNIK">,
): EmailAdapter {
  const posiljatelj = razberiPosiljatelja(env.EMAIL_FROM);
  const osnovni: EmailAdapter = env.RESEND_API_KEY
    ? resendAdapter({
        apiKey: env.RESEND_API_KEY,
        defaultFromAddress: posiljatelj.naslov,
        defaultFromName: posiljatelj.ime,
      })
    : dnevnikEposte({ posiljatelj, datoteka: env.EPOSTA_DNEVNIK });
  return env.EMAIL_REDIRECT_TO ? sPreusmeritvijo(osnovni, env.EMAIL_REDIRECT_TO) : osnovni;
}

/**
 * Opozorila ob zagonu strežnika (brez vrednosti): e-pošta ne gre nikamor,
 * staging bi pisal pravim kupcem ali produkcija preusmerja vso pošto.
 */
export function opozorilaEposte(
  env: Pick<Env, "NODE_ENV" | "RESEND_API_KEY" | "EMAIL_REDIRECT_TO" | "NOINDEX">,
): string[] {
  const opozorila: string[] = [];
  if (env.NODE_ENV === "production" && !env.RESEND_API_KEY) {
    opozorila.push("E-pošta: RESEND_API_KEY ni nastavljen, zato se vsa e-pošta samo izpiše v log (kupcem ne pride).");
  }
  if (env.RESEND_API_KEY && env.NOINDEX === "1" && !env.EMAIL_REDIRECT_TO) {
    opozorila.push("E-pošta: staging (NOINDEX=1) pošilja prek Resenda brez EMAIL_REDIRECT_TO, zato e-pošta pride pravim prejemnikom.");
  }
  if (env.EMAIL_REDIRECT_TO && env.NOINDEX !== "1" && env.NODE_ENV === "production") {
    opozorila.push("E-pošta: EMAIL_REDIRECT_TO je nastavljen brez NOINDEX=1, zato vsa e-pošta gre na en naslov namesto kupcem.");
  }
  return opozorila;
}
