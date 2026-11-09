"use server";

import config from "@payload-config";
import { headers } from "next/headers";
import { getPayload } from "payload";
import { okolje } from "@/env";
import { IME_PASTI } from "./obrazec";
import { oddajNarocilo, type RezultatOddaje } from "./oddaja";
import { ipIzGlav, NAROCIL_NA_IP, OKNO_OMEJITVE_MS, OmejitevNarocil } from "./omejitev";
import { pocistiNeplacana } from "./potek-placila";
import { ponudnikPlacil } from "./placila";

/**
 * Strežniška akcija blagajne (Z25–Z27, Z30). Vnos iz brskalnika je
 * nezaupanja vreden: obrazec, košarico, stikalo trgovine, zalogo in cene
 * preveri `oddajNarocilo` na strežniku. Pred tem: past za robote in
 * omejitev naročil na IP (Z26).
 *
 * Pri plačilu s kartico (K8) gre kupec na Stripe Checkout; povratna naslova
 * se sestavita iz `NEXT_PUBLIC_SITE_URL` ali, če ni nastavljen, iz naslova
 * zahteve. Ob vsaki oddaji se uskladijo še kartična naročila, ki predolgo
 * čakajo na plačilo (varovalka, če dogodek webhooka ni prispel, P10).
 */

/** Izvor strani iz glav zahteve (za razvoj brez `NEXT_PUBLIC_SITE_URL`). */
function izvorIzGlav(glave: Headers): string | undefined {
  const gostitelj = glave.get("x-forwarded-host") ?? glave.get("host");
  if (!gostitelj) return undefined;
  const protokol = glave.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";
  return `${protokol}://${gostitelj.split(",")[0].trim()}`;
}

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

  const glave = await headers();
  const ip = ipIzGlav(glave);
  if (!omejitev().dovoljeno(ip)) {
    payload.logger.warn("Blagajna: preveč naročil z enega IP, naročilo zavrnjeno.");
    return {
      ok: false,
      vrsta: "zavrnjeno",
      sporocilo: "Z vašega omrežja je bilo v kratkem oddanih več naročil. Poskusite znova čez nekaj minut ali nas pokličite.",
    };
  }

  const placila = ponudnikPlacil();
  if (placila) {
    try {
      await pocistiNeplacana(payload, placila);
    } catch (napaka) {
      payload.logger.error({ err: napaka }, "Varovalka za neplačana naročila ni uspela");
    }
  }

  const rezultat = await oddajNarocilo(
    payload,
    { obrazec: vnos?.obrazec, kosarica: vnos?.kosarica },
    { placila, izvor: okolje().NEXT_PUBLIC_SITE_URL ?? izvorIzGlav(glave) },
  );
  if (rezultat.ok) omejitev().zabelezi(ip);
  return rezultat;
}
