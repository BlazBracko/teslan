import { serializirajJsonLd } from "@/seo/json-ld";

/** Strukturirani podatki (Z73) kot `<script type="application/ld+json">`. */
export function JsonLd({ podatki }: { podatki: Record<string, unknown> | null }) {
  if (!podatki) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializirajJsonLd(podatki) }} />;
}
