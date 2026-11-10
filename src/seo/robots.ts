import type { MetadataRoute } from "next";
import { absolutniUrl } from "./izvor";

/**
 * Poti, ki jih iskalniki v produkciji ne obiskujejo: admin, API, košarica,
 * blagajna, naročila (z žetonom) in slogovni vodnik (obstaja le na stagingu).
 */
export const ZAPRTE_POTI = ["/admin", "/api/", "/kosarica", "/blagajna", "/narocilo/", "/styleguide"];

/**
 * `robots.txt` (Z71). Na stagingu (`NOINDEX=1`) prepove vse, v produkciji
 * dovoli javne strani in pokaže zemljevid strani.
 */
export function pravilaRobots(noindex: boolean, izvor: URL): MetadataRoute.Robots {
  if (noindex) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ZAPRTE_POTI },
    sitemap: absolutniUrl("/sitemap.xml", izvor),
  };
}
