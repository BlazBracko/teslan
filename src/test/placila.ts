import { randomBytes } from "node:crypto";
import type Stripe from "stripe";
import type { NovaSeja, PonudnikPlacil, StanjeSeje } from "@/narocila/placila";
import { parametriSeje } from "@/narocila/stripe";

/**
 * Nadomestek Stripa za integracijske teste: seje živijo v pomnilniku,
 * parametri pa se sestavijo z isto funkcijo kot za pravi Stripe (in s tem
 * tudi preverijo, da se vsota postavk ujema z zneskom).
 */
export class NadomestniPonudnik implements PonudnikPlacil {
  readonly seje = new Map<string, { stanje: StanjeSeje; parametri: Stripe.Checkout.SessionCreateParams }>();
  napakaPriUstvarjanju: Error | null = null;

  async ustvariSejo(...[n, moznosti]: Parameters<PonudnikPlacil["ustvariSejo"]>): Promise<NovaSeja> {
    if (this.napakaPriUstvarjanju) throw this.napakaPriUstvarjanju;
    const parametri = parametriSeje(n, moznosti);
    const id = `cs_test_${n.id}_${randomBytes(4).toString("hex")}`;
    this.seje.set(id, {
      parametri,
      stanje: { id, status: "open", placano: false, paymentIntentId: null, narociloId: n.id },
    });
    return { id, url: `https://placilo.test/${id}` };
  }

  async preberiSejo(id: string): Promise<StanjeSeje> {
    const seja = this.seje.get(id);
    if (!seja) throw new Error(`Ni seje ${id}`);
    return { ...seja.stanje };
  }

  async prekiniSejo(id: string): Promise<StanjeSeje> {
    const seja = this.seje.get(id);
    if (!seja) throw new Error(`Ni seje ${id}`);
    if (seja.stanje.status === "open") seja.stanje.status = "expired";
    return { ...seja.stanje };
  }

  /** Kupec plača: seja je zaključena in plačana. */
  placaj(id: string): StanjeSeje {
    const seja = this.seje.get(id);
    if (!seja || seja.stanje.status !== "open") throw new Error(`Seja ${id} ni odprta`);
    seja.stanje = { ...seja.stanje, status: "complete", placano: true, paymentIntentId: `pi_${id}` };
    return { ...seja.stanje };
  }

  /** Zadnja ustvarjena seja. */
  zadnja() {
    const seje = [...this.seje.values()];
    return seje[seje.length - 1];
  }
}

/** Dogodek webhooka, kot ga pošlje Stripe (samo polja, ki jih uporabljamo). */
export function dogodekSeje(
  type: "checkout.session.completed" | "checkout.session.expired",
  stanje: StanjeSeje,
  { placano = stanje.placano }: { placano?: boolean } = {},
): Stripe.Event {
  return {
    id: `evt_${randomBytes(6).toString("hex")}`,
    object: "event",
    type,
    data: {
      object: {
        id: stanje.id,
        object: "checkout.session",
        status: type === "checkout.session.completed" ? "complete" : "expired",
        payment_status: placano ? "paid" : "unpaid",
        payment_intent: stanje.paymentIntentId,
        metadata: stanje.narociloId ? { orderId: String(stanje.narociloId) } : {},
      },
    },
  } as unknown as Stripe.Event;
}
