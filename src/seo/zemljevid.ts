import type { MetadataRoute } from "next";
import { potPrograma, PRAVNE_POVEZAVE } from "@/components/postavitev/navigacija";
import { absolutniUrl } from "./izvor";

/**
 * Javne strani brez parametrov, ki sodijo v zemljevid strani (Z71). Košarica,
 * blagajna, naročila in slogovni vodnik niso indeksirani, zato jih ni.
 */
export const STATICNE_STRANI: ReadonlyArray<{ pot: string; prednost: number }> = [
  { pot: "/", prednost: 1 },
  { pot: "/products", prednost: 0.9 },
  { pot: "/darila", prednost: 0.8 },
  { pot: "/darila/sestavi", prednost: 0.6 },
  { pot: "/about", prednost: 0.6 },
  ...PRAVNE_POVEZAVE.map((p) => ({ pot: p.href, prednost: 0.3 })),
];

export interface VirZemljevida {
  /** Objavljeni izdelki (katalog javnih strani že izpusti neobjavljene). */
  izdelki: ReadonlyArray<{ slug: string }>;
  /** Objavljeni darilni programi. */
  programi: ReadonlyArray<{ slug: string }>;
}

export function vnosiZemljevida(vir: VirZemljevida, izvor: URL): MetadataRoute.Sitemap {
  return [
    ...STATICNE_STRANI.map((s) => ({ url: absolutniUrl(s.pot, izvor), priority: s.prednost })),
    ...vir.izdelki.map((i) => ({
      url: absolutniUrl(`/products/${encodeURIComponent(i.slug)}`, izvor),
      priority: 0.7,
    })),
    ...vir.programi.map((p) => ({ url: absolutniUrl(potPrograma(p.slug), izvor), priority: 0.5 })),
  ];
}
