import type { Env } from "@/env";

/**
 * Izvor spletnega mesta za absolutne naslove (kanonični URL, OG, sitemap,
 * JSON-LD; Z70). Vir je `NEXT_PUBLIC_SITE_URL`; brez njega (razvoj) se
 * uporabi lokalni strežnik, kot bi ga uporabil Next sam. Produkcija brez te
 * spremenljivke ob zagonu izpiše opozorilo (gl. `opozorilaSeo`).
 */
export function izvorStrani(env: Pick<Env, "NEXT_PUBLIC_SITE_URL">, port = process.env.PORT): URL {
  return new URL(env.NEXT_PUBLIC_SITE_URL ?? `http://localhost:${port || 3000}`);
}

/** Absoluten naslov poti (`/products/x`) ali nespremenjen absoluten naslov (slike iz R2). */
export function absolutniUrl(pot: string, izvor: URL): string {
  return new URL(pot, izvor).toString();
}

/** Opozorila ob zagonu: produkcija brez izvora ima napačne kanonične naslove. */
export function opozorilaSeo(env: Pick<Env, "NODE_ENV" | "NEXT_PUBLIC_SITE_URL">): string[] {
  return env.NODE_ENV === "production" && !env.NEXT_PUBLIC_SITE_URL
    ? ["SEO: NEXT_PUBLIC_SITE_URL ni nastavljen, zato kanonični naslovi, sitemap in OG kažejo na localhost."]
    : [];
}
