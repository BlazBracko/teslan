"use server";

import config from "@payload-config";
import { headers } from "next/headers";
import { getPayload } from "payload";
import { okolje } from "@/env";
import { IME_PASTI } from "./obrazec";
import { oddajNarocilo, type RezultatOddaje } from "./oddaja";
import { ipIzGlav, NAROCIL_NA_IP, OKNO_OMEJITVE_MS, OmejitevNarocil } from "./omejitev";
import { karticaNaVoljo } from "./placila";

/**
 * Strežniška akcija blagajne (Z25–Z27, Z30). Vnos iz brskalnika je
 * nezaupanja vreden: obrazec, košarico, stikalo trgovine, zalogo in cene
 * preveri `oddajNarocilo` na strežniku. Pred tem: past za robote in
 * omejitev naročil na IP (Z26).
 */

let omejitevProcesa: OmejitevNarocil | undefined;
/** Ena omejitev na proces; ustvari se ob prvi oddaji (gradnja okolja ne bere). */
function omejitev(): OmejitevNarocil {
  omejitevProcesa ??= new OmejitevNarocil(okolje().OMEJITEV_NAROCIL_NA_IP ?? NAROCIL_NA_IP, OKNO_OMEJITVE_MS);
  return omejitevProcesa;
}

export async function oddajNarociloNaStrezniku(vnos: {
  obrazec: unknown;
  kosarica: unknown;
  [IME_PASTI]?: unknown;
}): Promise<RezultatOddaje> {
  const payload = await getPayload({ config });

  if (typeof vnos?.[IME_PASTI] === "string" && vnos[IME_PASTI].trim() !== "") {
    payload.logger.warn("Blagajna: izpolnjeno skrito polje, naročilo zavrnjeno (verjetno robot).");
    return { ok: false, vrsta: "zavrnjeno", sporocilo: "Naročila ni bilo mogoče oddati. Pokličite nas po telefonu." };
  }

  const ip = ipIzGlav(await headers());
  if (!omejitev().dovoljeno(ip)) {
    payload.logger.warn("Blagajna: preveč naročil z enega IP, naročilo zavrnjeno.");
    return {
      ok: false,
      vrsta: "zavrnjeno",
      sporocilo: "Z vašega omrežja je bilo v kratkem oddanih več naročil. Poskusite znova čez nekaj minut ali nas pokličite.",
    };
  }

  const rezultat = await oddajNarocilo(payload, { obrazec: vnos?.obrazec, kosarica: vnos?.kosarica }, { kartica: karticaNaVoljo() });
  if (rezultat.ok) omejitev().zabelezi(ip);
  return rezultat;
}
