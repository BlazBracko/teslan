import { NextResponse, type NextRequest } from "next/server";
import { dovoljeno, nastavitveZascite, REALM } from "@/zascita/staging";

/**
 * Proxy (Next 16; prej `middleware.ts`) teče pred vsako zahtevo, tudi za
 * statične datoteke, zato nima `matcher`. Okolje se bere ob zahtevi, ker ista
 * gradnja teče na stagingu in v produkciji.
 *
 *  - `NOINDEX=1`: vsak odgovor dobi `X-Robots-Tag: noindex` (Z71).
 *  - `BASIC_AUTH_USER` + `BASIC_AUTH_PASSWORD`: vse poti razen
 *    `/api/stripe/webhook` zahtevajo HTTP Basic Auth (Z74).
 */
export async function proxy(zahteva: NextRequest) {
  const nastavitve = nastavitveZascite(process.env);
  const glave: Record<string, string> = nastavitve.noindex ? { "X-Robots-Tag": "noindex, nofollow" } : {};

  if (!(await dovoljeno(zahteva.nextUrl.pathname, zahteva.headers.get("authorization"), nastavitve))) {
    return new NextResponse("Za ogled testne strani je potrebna prijava.", {
      status: 401,
      headers: {
        ...glave,
        "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const odgovor = NextResponse.next();
  for (const [ime, vrednost] of Object.entries(glave)) odgovor.headers.set(ime, vrednost);
  return odgovor;
}
