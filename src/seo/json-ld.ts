import type { IzdelekPogled } from "@/katalog/pogled";
import { razpolozljivostVelikosti, type VrstaRazpolozljivosti } from "@/katalog/razpolozljivost";
import type { Mesec } from "@/katalog/sezona";
import type { Kontakt } from "@/lib/kontakt";
import { absolutniUrl } from "./izvor";

/**
 * Strukturirani podatki schema.org (Z73). Čiste funkcije: strani jim podajo
 * kontakt iz nastavitev oz. izdelek iz kataloga in izvor strani, izris je v
 * `src/components/seo/JsonLd.tsx`. Prazni podatki se izpustijo, ne izmislijo.
 */

type Objekt = Record<string, unknown>;

/** Logotip kmetije (javna datoteka), kot ga pozna tudi glava. */
const LOGOTIP = "/logo.png";

/**
 * „Podgora 15, 8351 Straža pri Novem mestu“ → ulica, poštna številka, kraj.
 * Naslov brez prepoznavne pošte ostane cel v `streetAddress`.
 */
export function postniNaslov(naslov: string): Objekt {
  const deli = naslov.split(",").map((d) => d.trim()).filter(Boolean);
  const posta = deli.length > 1 ? /^(\d{4})\s+(.+)$/.exec(deli[deli.length - 1]) : null;
  return {
    "@type": "PostalAddress",
    streetAddress: posta ? deli.slice(0, -1).join(", ") : naslov.trim(),
    ...(posta ? { postalCode: posta[1], addressLocality: posta[2] } : {}),
    addressCountry: "SI",
  };
}

/** `LocalBusiness` za domačo stran in „O nas“. */
export function lokalnoPodjetje(kontakt: Kontakt, izvor: URL): Objekt {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": absolutniUrl("/#kmetija", izvor),
    name: kontakt.ime,
    url: absolutniUrl("/", izvor),
    logo: absolutniUrl(LOGOTIP, izvor),
    image: absolutniUrl("/og.jpg", izvor),
    ...(kontakt.naslov ? { address: postniNaslov(kontakt.naslov) } : {}),
    ...(kontakt.telefonPovezava ? { telephone: kontakt.telefonPovezava.replace(/^tel:/, "") } : {}),
    ...(kontakt.email ? { email: kontakt.email } : {}),
    ...(kontakt.geo
      ? { geo: { "@type": "GeoCoordinates", latitude: kontakt.geo.sirina, longitude: kontakt.geo.dolzina } }
      : {}),
    ...(kontakt.zemljevid ? { hasMap: kontakt.zemljevid } : {}),
  };
}

const RAZPOLOZLJIVOST: Record<VrstaRazpolozljivosti, string> = {
  "na-zalogi": "https://schema.org/InStock",
  malo: "https://schema.org/LimitedAvailability",
  "ni-na-zalogi": "https://schema.org/OutOfStock",
  kmalu: "https://schema.org/OutOfStock",
  "izven-sezone": "https://schema.org/OutOfStock",
  "na-kmetiji": "https://schema.org/InStoreOnly",
};

/** Cena v centih → „12.50“ (schema.org pričakuje piko). */
const cena = (centi: number) => (centi / 100).toFixed(2);

/**
 * `Product` z ponudbo za vsako velikost s ceno. Samo za naročljive načine
 * prodaje (ne `samo-prikaz`) in samo, če ima vsaj ena velikost ceno; sicer
 * `null` (stran JSON-LD izdelka ne izriše).
 */
export function izdelekJsonLd(
  izdelek: IzdelekPogled,
  kontakt: Pick<Kontakt, "ime">,
  izvor: URL,
  mesec: Mesec,
): Objekt | null {
  if (izdelek.nacinProdaje === "samo-prikaz") return null;
  const url = absolutniUrl(`/products/${encodeURIComponent(izdelek.slug)}`, izvor);
  const ponudbe = izdelek.velikosti
    .filter((v) => v.cenaCenti != null)
    .map((v) => ({
      "@type": "Offer",
      name: v.oznaka,
      sku: `${izdelek.slug}-${v.id}`,
      price: cena(v.cenaCenti as number),
      priceCurrency: "EUR",
      availability: RAZPOLOZLJIVOST[razpolozljivostVelikosti(izdelek, v, mesec).vrsta],
      itemCondition: "https://schema.org/NewCondition",
      url,
      seller: { "@type": "Organization", name: kontakt.ime },
    }));
  if (ponudbe.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: izdelek.ime,
    url,
    category: izdelek.kategorija.ime,
    brand: { "@type": "Brand", name: kontakt.ime },
    ...(izdelek.kratekOpis ? { description: izdelek.kratekOpis } : {}),
    ...(izdelek.slike.length > 0 ? { image: izdelek.slike.map((s) => absolutniUrl(s.url, izvor)) } : {}),
    offers: ponudbe,
  };
}

/**
 * JSON za `<script type="application/ld+json">`. `<` je zamenjan z
 * `<`, da besedilo iz CMS (npr. „</script>“) ne more zapreti oznake.
 */
export function serializirajJsonLd(podatki: Objekt): string {
  return JSON.stringify(podatki).replace(/</g, "\\u003c");
}
