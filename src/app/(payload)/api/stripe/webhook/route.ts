import config from "@payload-config";
import { getPayload } from "payload";
import type Stripe from "stripe";
import { okolje } from "@/env";
import { obdelajDogodek } from "@/narocila/potek-placila";
import { preveriDogodek } from "@/narocila/stripe";

/**
 * Webhook Stripa (Z41): `checkout.session.completed` potrdi plačilo,
 * `checkout.session.expired` prekliče neplačano naročilo. Telo se prebere
 * nespremenjeno, ker podpis velja zanj. Odgovori:
 *
 *  - 200: dogodek obdelan ali prezrt (tudi ponovljen, S8),
 *  - 400: podpis manjka ali je napačen,
 *  - 500: obdelava ni uspela; Stripe dogodek pošlje znova,
 *  - 503: Stripe na tem okolju ni nastavljen.
 *
 * Pot je izvzeta iz Basic Auth na stagingu (Z74, K12).
 */

export const dynamic = "force-dynamic";

export async function POST(zahteva: Request): Promise<Response> {
  const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = okolje();
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return Response.json({ napaka: "Plačila s kartico na tem okolju niso nastavljena." }, { status: 503 });
  }

  const telo = await zahteva.text();
  let dogodek: Stripe.Event;
  try {
    dogodek = preveriDogodek(telo, zahteva.headers.get("stripe-signature"), STRIPE_WEBHOOK_SECRET);
  } catch {
    return Response.json({ napaka: "Neveljaven podpis." }, { status: 400 });
  }

  const payload = await getPayload({ config });
  try {
    const izid = await obdelajDogodek(payload, dogodek);
    payload.logger.info({ dogodek: dogodek.id, vrsta: dogodek.type, izid }, "Stripe webhook");
    return Response.json({ prejeto: true, izid });
  } catch (napaka) {
    payload.logger.error({ err: napaka, dogodek: dogodek.id, vrsta: dogodek.type }, "Stripe webhook: obdelava ni uspela");
    return Response.json({ napaka: "Obdelava ni uspela." }, { status: 500 });
  }
}
