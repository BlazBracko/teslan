import { describe, expect, it } from "vitest";
import type { IzdelekPogled } from "@/katalog/pogled";
import { kontaktIzNastavitev } from "@/lib/kontakt";
import { absolutniUrl, izvorStrani, opozorilaSeo } from "./izvor";
import { izdelekJsonLd, lokalnoPodjetje, postniNaslov, serializirajJsonLd } from "./json-ld";
import { metapodatkiStrani, PRIVZETA_SLIKA_OG } from "./metapodatki";
import { pravilaRobots } from "./robots";
import { vnosiZemljevida } from "./zemljevid";

const izvor = new URL("https://www.teslan.si");

describe("izvor strani (Z70)", () => {
  it("vzame NEXT_PUBLIC_SITE_URL, sicer lokalni strežnik", () => {
    expect(izvorStrani({ NEXT_PUBLIC_SITE_URL: "https://www.teslan.si" }).origin).toBe("https://www.teslan.si");
    expect(izvorStrani({ NEXT_PUBLIC_SITE_URL: undefined }, "3100").origin).toBe("http://localhost:3100");
    expect(absolutniUrl("/products/x", izvor)).toBe("https://www.teslan.si/products/x");
    expect(absolutniUrl("https://slike.example.com/a.jpg", izvor)).toBe("https://slike.example.com/a.jpg");
  });

  it("v produkciji brez izvora opozori", () => {
    expect(opozorilaSeo({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: undefined })).toHaveLength(1);
    expect(opozorilaSeo({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://www.teslan.si" })).toEqual([]);
  });
});

describe("metapodatkiStrani (Z70, Z72)", () => {
  it("sestavi naslov, opis, kanonični URL in OG s privzeto sliko", () => {
    const m = metapodatkiStrani({ naslov: "Izdelki", opis: "Opis.", pot: "/products" });
    expect(m.title).toBe("Izdelki");
    expect(m.description).toBe("Opis.");
    expect(m.alternates).toEqual({ canonical: "/products" });
    expect(m.openGraph).toMatchObject({ url: "/products", siteName: "Domačija Tešlan", locale: "sl_SI" });
    expect(m.openGraph?.images).toEqual([PRIVZETA_SLIKA_OG]);
    expect(m.robots).toBeUndefined();
  });

  it("uporabi sliko izdelka in zna izklopiti indeksiranje", () => {
    const m = metapodatkiStrani({
      naslov: "Česen",
      opis: "x",
      pot: "/products/cesen",
      slike: [{ url: "/api/media/file/cesen.jpg", alt: "Česen", width: null, height: null }],
      brezIndeksa: true,
    });
    expect(m.openGraph?.images).toEqual([{ url: "/api/media/file/cesen.jpg", alt: "Česen" }]);
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(metapodatkiStrani({ naslov: null, opis: "x", pot: null }).alternates).toBeUndefined();
  });
});

describe("robots (Z71)", () => {
  it("na stagingu prepove vse", () => {
    expect(pravilaRobots(true, izvor)).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("v produkciji dovoli javne strani in pokaže zemljevid", () => {
    const r = pravilaRobots(false, izvor);
    expect(r.sitemap).toBe("https://www.teslan.si/sitemap.xml");
    expect(r.rules).toMatchObject({ allow: "/", disallow: expect.arrayContaining(["/admin", "/blagajna"]) });
  });
});

describe("zemljevid strani (Z71)", () => {
  it("vsebuje statične strani, izdelke in programe z absolutnimi naslovi", () => {
    const url = vnosiZemljevida({ izdelki: [{ slug: "cesen-v-prahu" }], programi: [{ slug: "okusi-dolenjske" }] }, izvor).map(
      (v) => v.url,
    );
    expect(url).toEqual(
      expect.arrayContaining([
        "https://www.teslan.si/",
        "https://www.teslan.si/products",
        "https://www.teslan.si/pogoji",
        "https://www.teslan.si/products/cesen-v-prahu",
        "https://www.teslan.si/darila/sestavi?program=okusi-dolenjske",
      ]),
    );
    expect(url.some((u) => u.includes("kosarica") || u.includes("blagajna"))).toBe(false);
  });
});

describe("JSON-LD (Z73)", () => {
  const kontakt = kontaktIzNastavitev({
    naslov: "Podgora 15, 8351 Straža pri Novem mestu",
    telefon: "040 578 512",
    email: "info@example.com",
    geoSirina: 45.77,
    geoDolzina: 15.09,
  });

  it("LocalBusiness z naslovom, telefonom, lego in URL", () => {
    expect(lokalnoPodjetje(kontakt, izvor)).toMatchObject({
      "@type": "LocalBusiness",
      name: "Domačija Tešlan",
      url: "https://www.teslan.si/",
      telephone: "+38640578512",
      email: "info@example.com",
      address: { streetAddress: "Podgora 15", postalCode: "8351", addressLocality: "Straža pri Novem mestu", addressCountry: "SI" },
      geo: { "@type": "GeoCoordinates", latitude: 45.77, longitude: 15.09 },
    });
  });

  it("prazni podatki se izpustijo", () => {
    const ld = lokalnoPodjetje(kontaktIzNastavitev({}), izvor);
    expect(ld).not.toHaveProperty("address");
    expect(ld).not.toHaveProperty("telephone");
    expect(ld).not.toHaveProperty("geo");
    expect(postniNaslov("Podgora brez pošte")).toEqual({
      "@type": "PostalAddress",
      streetAddress: "Podgora brez pošte",
      addressCountry: "SI",
    });
  });

  const izdelek: IzdelekPogled = {
    id: 1,
    ime: "Česen v prahu",
    slug: "cesen-v-prahu",
    izpostavljen: false,
    kategorija: { id: 1, ime: "Začimbe", slug: "zacimbe" },
    kratekOpis: "Mlet česen.",
    opis: null,
    sestavine: null,
    alergeni: null,
    slike: [{ url: "/api/media/file/cesen.jpg", alt: "Česen", sirina: null, visina: null, zarisce: null }],
    nacinProdaje: "posta-in-prevzem",
    sezona: null,
    stopnjaDDV: 9.5,
    primernoZaDarilo: true,
    velikosti: [
      { id: "a", oznaka: "41 ml", cenaCenti: 450, zaloga: 20 },
      { id: "b", oznaka: "100 ml", cenaCenti: 900, zaloga: 0 },
      { id: "c", oznaka: "brez cene", cenaCenti: null, zaloga: 5 },
    ],
  };

  it("Product z ponudbo za vsako velikost s ceno", () => {
    const ld = izdelekJsonLd(izdelek, kontakt, izvor, 3);
    expect(ld).toMatchObject({
      "@type": "Product",
      name: "Česen v prahu",
      url: "https://www.teslan.si/products/cesen-v-prahu",
      image: ["https://www.teslan.si/api/media/file/cesen.jpg"],
      description: "Mlet česen.",
    });
    expect(ld?.offers).toEqual([
      expect.objectContaining({ price: "4.50", priceCurrency: "EUR", availability: "https://schema.org/InStock" }),
      expect.objectContaining({ price: "9.00", availability: "https://schema.org/OutOfStock" }),
    ]);
  });

  it("samo-prikaz in izdelek brez cen nimata Product", () => {
    expect(izdelekJsonLd({ ...izdelek, nacinProdaje: "samo-prikaz" }, kontakt, izvor, 3)).toBeNull();
    expect(
      izdelekJsonLd({ ...izdelek, velikosti: [{ id: "x", oznaka: "1", cenaCenti: null, zaloga: 1 }] }, kontakt, izvor, 3),
    ).toBeNull();
  });

  it("besedilo iz CMS ne more zapreti oznake script", () => {
    const json = serializirajJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
