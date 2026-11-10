import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { EmailAdapter, SendEmailOptions } from "payload";

/**
 * E-pošta brez Resenda (Z58): besedilna različica sporočila se izpiše v
 * log strežnika. Če je nastavljen `EPOSTA_DNEVNIK` (samo testi), se zapis
 * (z HTML) doda še v to datoteko kot ena vrstica JSON, da ga e2e testi
 * lahko preberejo (S9). Ko je `RESEND_API_KEY` nastavljen, se namesto tega
 * uporabi Resend (`adapter.ts`).
 */

export interface Posiljatelj {
  ime: string;
  naslov: string;
}

export const PRIVZETI_POSILJATELJ: Posiljatelj = { ime: "Domačija Tešlan", naslov: "narocila@teslan.si" };

/** „Domačija Tešlan <narocila@teslan.si>“ → ime in naslov; brez `<…>` je vse naslov. */
export function razberiPosiljatelja(vrednost: string | undefined): Posiljatelj {
  const v = vrednost?.trim();
  if (!v) return PRIVZETI_POSILJATELJ;
  const ujemanje = /^(.*)<([^>]+)>\s*$/.exec(v);
  if (!ujemanje) return { ime: PRIVZETI_POSILJATELJ.ime, naslov: v };
  return { ime: ujemanje[1].trim().replace(/^"|"$/g, "") || PRIVZETI_POSILJATELJ.ime, naslov: ujemanje[2].trim() };
}

export interface ZapisEposte {
  cas: string;
  od: string;
  za: string;
  odgovorNa: string | null;
  zadeva: string;
  besedilo: string;
  html: string | null;
}

function naslovi(v: SendEmailOptions["to"] | SendEmailOptions["replyTo"]): string | null {
  if (!v) return null;
  const seznam = Array.isArray(v) ? v : [v];
  return seznam.map((n) => (typeof n === "string" ? n : n.address)).join(", ");
}

export function dnevnikEposte({
  posiljatelj,
  datoteka,
}: {
  posiljatelj: Posiljatelj;
  datoteka?: string;
}): EmailAdapter<ZapisEposte> {
  return ({ payload }) => ({
    name: "dnevnik",
    defaultFromAddress: posiljatelj.naslov,
    defaultFromName: posiljatelj.ime,
    sendEmail: async (sporocilo) => {
      const od = sporocilo.from;
      const zapis: ZapisEposte = {
        cas: new Date().toISOString(),
        od: typeof od === "string" ? od : od ? od.address : `${posiljatelj.ime} <${posiljatelj.naslov}>`,
        za: naslovi(sporocilo.to) ?? "",
        odgovorNa: naslovi(sporocilo.replyTo),
        zadeva: String(sporocilo.subject ?? ""),
        besedilo: typeof sporocilo.text === "string" ? sporocilo.text : "",
        html: typeof sporocilo.html === "string" ? sporocilo.html : null,
      };
      payload.logger.info(
        `E-pošta ni poslana (RESEND_API_KEY ni nastavljen), izpis:\nZa: ${zapis.za}\nZadeva: ${zapis.zadeva}\n\n${zapis.besedilo}`,
      );
      if (datoteka) {
        mkdirSync(path.dirname(datoteka), { recursive: true });
        appendFileSync(datoteka, `${JSON.stringify(zapis)}\n`);
      }
      return zapis;
    },
  });
}
