/**
 * Nadomestni Stripe za e2e teste brez pravih ključev (načrt §11: Stripe
 * testi se brez ključev ne smejo ustaviti). Posnema samo, kar uporablja
 * trgovina:
 *
 *  - API seje Checkout: ustvari (`POST /v1/checkout/sessions`), preberi
 *    (`GET /v1/checkout/sessions/:id`), izteci (`POST …/:id/expire`);
 *  - stran za plačilo (`/placaj/:id`) z gumboma „Plačaj“ in „Plačaj brez
 *    webhooka“ ter povezavo „Nazaj“ na `cancel_url`;
 *  - dogodka webhooka `checkout.session.completed` in
 *    `checkout.session.expired`, podpisana kot pri Stripu (HMAC SHA-256),
 *    poslana na `/api/stripe/webhook` izvora iz `success_url`.
 *
 * Teče kot samostojen proces (`node e2e/stripe-nadomestek.ts`), ki ga zažene
 * Playwright; nastavitve dobi iz okolja (`STRIPE_NADOMESTEK_PORT`,
 * `STRIPE_WEBHOOK_SECRET`). S pravimi ključi teče `e2e/stripe-pravi.spec.ts`.
 */
import { createHmac, randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const PORT = Number(process.env.STRIPE_NADOMESTEK_PORT ?? 3105);
const SKRIVNOST = process.env.STRIPE_WEBHOOK_SECRET ?? "";

interface Seja {
  id: string;
  object: "checkout.session";
  status: "open" | "complete" | "expired";
  payment_status: "paid" | "unpaid";
  payment_intent: string | null;
  amount_total: number;
  currency: string;
  customer_email: string | null;
  client_reference_id: string | null;
  metadata: Record<string, string>;
  success_url: string;
  cancel_url: string;
  expires_at: number;
  url: string;
}

const seje = new Map<string, Seja>();

/** Stripe pošilja parametre kot obrazec z gnezdenimi ključi (`metadata[orderId]`). */
function sejaIzObrazca(telo: string): Seja {
  const p = new URLSearchParams(telo);
  const metadata: Record<string, string> = {};
  let znesek = 0;
  for (const [kljuc, vrednost] of p) {
    const m = /^metadata\[(.+)\]$/.exec(kljuc);
    if (m) metadata[m[1]] = vrednost;
    const postavka = /^line_items\[(\d+)\]\[price_data\]\[unit_amount\]$/.exec(kljuc);
    if (postavka) znesek += Number(vrednost) * Number(p.get(`line_items[${postavka[1]}][quantity]`) ?? 1);
  }
  const id = `cs_test_nadomestek_${randomBytes(8).toString("hex")}`;
  return {
    id,
    object: "checkout.session",
    status: "open",
    payment_status: "unpaid",
    payment_intent: null,
    amount_total: znesek,
    currency: p.get("currency") ?? "eur",
    customer_email: p.get("customer_email"),
    client_reference_id: p.get("client_reference_id"),
    metadata,
    success_url: p.get("success_url") ?? "",
    cancel_url: p.get("cancel_url") ?? "",
    expires_at: Number(p.get("expires_at") ?? 0),
    url: `http://localhost:${PORT}/placaj/${id}`,
  };
}

async function posljiDogodek(type: string, seja: Seja): Promise<void> {
  const telo = JSON.stringify({
    id: `evt_nadomestek_${randomBytes(8).toString("hex")}`,
    object: "event",
    type,
    created: Math.floor(Date.now() / 1000),
    data: { object: seja },
  });
  const cas = Math.floor(Date.now() / 1000);
  const podpis = createHmac("sha256", SKRIVNOST).update(`${cas}.${telo}`).digest("hex");
  const odziv = await fetch(new URL("/api/stripe/webhook", seja.success_url), {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": `t=${cas},v1=${podpis}` },
    body: telo,
  });
  if (!odziv.ok) console.error(`[stripe-nadomestek] webhook ${type}: ${odziv.status} ${await odziv.text()}`);
}

function preberiTelo(zahteva: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const deli: Buffer[] = [];
    zahteva.on("data", (d: Buffer) => deli.push(d));
    zahteva.on("end", () => resolve(Buffer.concat(deli).toString("utf8")));
    zahteva.on("error", reject);
  });
}

function json(odgovor: ServerResponse, status: number, telo: unknown) {
  odgovor.writeHead(status, { "content-type": "application/json" });
  odgovor.end(JSON.stringify(telo));
}

const napaka = (odgovor: ServerResponse, status: number, sporocilo: string) =>
  json(odgovor, status, { error: { type: "invalid_request_error", message: sporocilo } });

const html = (s: string) => s.replace(/[&<>"]/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[z] ?? z);

function stranZaPlacilo(seja: Seja): string {
  const znesek = (seja.amount_total / 100).toFixed(2).replace(".", ",");
  const zakljucena = seja.status !== "open";
  return `<!doctype html><html lang="sl"><head><meta charset="utf-8"><title>Nadomestni Stripe</title></head>
<body><main>
<a href="${html(seja.cancel_url)}">Nazaj</a>
<h1>Nadomestni Stripe</h1>
<p>Naročilo ${html(seja.metadata.stevilka ?? "")}, znesek <span data-testid="znesek">${znesek} €</span>, ${html(seja.customer_email ?? "")}</p>
${zakljucena ? `<p>Seja je ${seja.status === "expired" ? "potekla" : "zaključena"}.</p>` : ""}
<form method="post" action="/placaj/${seja.id}"><button ${zakljucena ? "disabled" : ""}>Plačaj</button></form>
<form method="post" action="/placaj/${seja.id}?brez-webhooka=1"><button ${zakljucena ? "disabled" : ""}>Plačaj brez webhooka</button></form>
</main></body></html>`;
}

const streznik = createServer(async (zahteva, odgovor) => {
  try {
    const url = new URL(zahteva.url ?? "/", `http://localhost:${PORT}`);
    const pot = url.pathname;

    if (pot === "/zdravje") return json(odgovor, 200, { ok: true });

    if (zahteva.method === "POST" && pot === "/v1/checkout/sessions") {
      const seja = sejaIzObrazca(await preberiTelo(zahteva));
      seje.set(seja.id, seja);
      return json(odgovor, 200, seja);
    }

    const api = /^\/v1\/checkout\/sessions\/([^/]+)(\/expire)?$/.exec(pot);
    if (api) {
      const seja = seje.get(api[1]);
      if (!seja) return napaka(odgovor, 404, `No such checkout.session: '${api[1]}'`);
      if (zahteva.method === "GET" && !api[2]) return json(odgovor, 200, seja);
      if (zahteva.method === "POST" && api[2]) {
        await preberiTelo(zahteva);
        if (seja.status !== "open") {
          return napaka(odgovor, 400, `Only Checkout Sessions with a status in ["open"] can be expired.`);
        }
        seja.status = "expired";
        json(odgovor, 200, seja);
        // Kot pri Stripu: iztek sproži še dogodek webhooka (po odgovoru).
        setTimeout(() => void posljiDogodek("checkout.session.expired", seja), 200);
        return;
      }
    }

    const placilo = /^\/placaj\/([^/]+)$/.exec(pot);
    if (placilo) {
      const seja = seje.get(placilo[1]);
      if (!seja) return napaka(odgovor, 404, "Ni seje.");
      if (zahteva.method === "GET") {
        odgovor.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        return odgovor.end(stranZaPlacilo(seja));
      }
      if (zahteva.method === "POST") {
        await preberiTelo(zahteva);
        if (seja.status !== "open") return napaka(odgovor, 400, "Seja ni odprta.");
        seja.status = "complete";
        seja.payment_status = "paid";
        seja.payment_intent = `pi_nadomestek_${randomBytes(8).toString("hex")}`;
        if (!url.searchParams.has("brez-webhooka")) await posljiDogodek("checkout.session.completed", seja);
        odgovor.writeHead(303, { location: seja.success_url });
        return odgovor.end();
      }
    }

    napaka(odgovor, 404, `Ni poti ${zahteva.method} ${pot}`);
  } catch (e) {
    console.error("[stripe-nadomestek]", e);
    napaka(odgovor, 500, "Napaka nadomestka.");
  }
});

streznik.listen(PORT, () => console.log(`[stripe-nadomestek] posluša na http://localhost:${PORT}`));
