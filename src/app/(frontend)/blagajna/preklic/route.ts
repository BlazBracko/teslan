import config from "@payload-config";
import { getPayload } from "payload";
import { ponudnikPlacil } from "@/narocila/placila";
import { preklicObVrnitvi } from "@/narocila/potek-placila";

/**
 * Vrnitev s Stripa, ko kupec plačilo prekine (T3 korak 4, Z42). Seja se
 * takoj izteče, naročilo prekliče in zaloga vrne; kupec gre nazaj na
 * blagajno, kjer ima košarico še vedno (ni bila izpraznjena). Številka in
 * žeton naročila sta v naslovu le do te preusmeritve.
 *
 * Če je bilo naročilo medtem vendarle plačano, gre kupec na potrdilo.
 */

export const dynamic = "force-dynamic";

export async function GET(zahteva: Request): Promise<Response> {
  const url = new URL(zahteva.url);
  const stevilka = url.searchParams.get("narocilo");
  const zeton = url.searchParams.get("k");
  const cilj = new URL("/blagajna?preklic=1", url);

  if (stevilka && zeton) {
    const payload = await getPayload({ config });
    try {
      const { potNarocila } = await preklicObVrnitvi(payload, ponudnikPlacil(), stevilka, zeton);
      if (potNarocila) return preusmeri(new URL(potNarocila, url));
    } catch (napaka) {
      // Naročilo prekliče dogodek webhooka ali varovalka; kupec vseeno
      // dobi obvestilo, da plačilo ni bilo opravljeno.
      payload.logger.error({ err: napaka, narocilo: stevilka }, "Preklic plačila ob vrnitvi s Stripa ni uspel");
    }
  }
  return preusmeri(cilj);
}

function preusmeri(cilj: URL): Response {
  // Žeton ne sme oditi naprej kot referer.
  return new Response(null, { status: 303, headers: { Location: cilj.pathname + cilj.search, "Referrer-Policy": "no-referrer" } });
}
