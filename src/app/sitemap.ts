import type { MetadataRoute } from "next";
import { naloziDarila } from "@/darila/podatki";
import { okolje } from "@/env";
import { naloziKatalog } from "@/katalog/podatki";
import { izvorStrani } from "@/seo/izvor";
import { vnosiZemljevida } from "@/seo/zemljevid";

/** Izdelki in programi so iz CMS (predpomnjeni, Z17); gradnja nima baze. */
export const dynamic = "force-dynamic";

/** Zemljevid strani (Z71): statične strani, objavljeni izdelki in programi. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [katalog, darila] = await Promise.all([naloziKatalog(), naloziDarila()]);
  return vnosiZemljevida({ izdelki: katalog.izdelki, programi: darila.programi }, izvorStrani(okolje()));
}
