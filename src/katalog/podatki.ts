import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import type { Izdelki, Kategorije, Media, NastavitveTrgovine, SkupinePonudbe } from "@/payload-types";
import { odstotekDDV } from "./ddv";
import { OSVEZI_PO_SEKUNDAH, OZNAKA_KATALOG, OZNAKA_NASTAVITVE } from "./oznake";
import type { NacinProdaje } from "./razpolozljivost";
import { sezonaIzPolj, type Sezona } from "./sezona";
import { potSlike } from "./slike";

/**
 * Podatki iz CMS za javne strani (strežnik). Poizvedbe so predpomnjene z
 * oznakami iz `oznake.ts`: hooki v Payloadu jih ob spremembi razveljavijo,
 * sicer se osvežijo najkasneje po 60 s (Z17).
 *
 * Vrnjene oblike so namenoma ploske in brez Payloadovih tipov, da jih
 * komponente lahko prejmejo kot props (tudi odjemalske) in da predpomnilnik
 * ne hrani nepotrebnih polj.
 */

export interface SlikaPogled {
  url: string;
  alt: string;
  sirina: number | null;
  visina: number | null;
  /** Žarišče obreza v odstotkih, za `object-position`. */
  zarisce: { x: number; y: number } | null;
}

export interface KategorijaPogled {
  id: number;
  ime: string;
  slug: string;
}

export interface VelikostPogled {
  id: string;
  oznaka: string;
  cenaCenti: number | null;
  zaloga: number | null;
}

export interface IzdelekPogled {
  id: number;
  ime: string;
  slug: string;
  izpostavljen: boolean;
  kategorija: KategorijaPogled;
  kratekOpis: string | null;
  opis: Izdelki["opis"];
  sestavine: string | null;
  alergeni: string | null;
  slike: SlikaPogled[];
  nacinProdaje: NacinProdaje;
  sezona: Sezona | null;
  stopnjaDDV: number;
  primernoZaDarilo: boolean;
  velikosti: VelikostPogled[];
}

export interface SkupinaPogled {
  id: number;
  ime: string;
  opis: string | null;
  slika: SlikaPogled | null;
  kategorije: number[];
}

export interface Katalog {
  kategorije: KategorijaPogled[];
  izdelki: IzdelekPogled[];
  skupine: SkupinaPogled[];
}

function slikaPogled(medij: number | Media | null | undefined): SlikaPogled | null {
  if (!medij || typeof medij === "number" || !medij.url) return null;
  return {
    url: potSlike(medij.url),
    alt: medij.alt,
    sirina: medij.width ?? null,
    visina: medij.height ?? null,
    zarisce:
      medij.focalX != null && medij.focalY != null ? { x: medij.focalX, y: medij.focalY } : null,
  };
}

function kategorijaPogled(k: Kategorije): KategorijaPogled {
  return { id: k.id, ime: k.ime, slug: k.slug ?? String(k.id) };
}

function izdelekPogled(i: Izdelki): IzdelekPogled | null {
  // Izdelek brez kategorije (izbrisana) se ne prikaže.
  if (typeof i.kategorija !== "object" || !i.kategorija) return null;
  return {
    id: i.id,
    ime: i.ime,
    slug: i.slug ?? String(i.id),
    izpostavljen: Boolean(i.izpostavljen),
    kategorija: kategorijaPogled(i.kategorija),
    kratekOpis: i.kratekOpis ?? null,
    opis: i.opis ?? null,
    sestavine: i.sestavine ?? null,
    alergeni: i.alergeni ?? null,
    slike: (i.slike ?? []).map(slikaPogled).filter((s): s is SlikaPogled => s !== null),
    nacinProdaje: i.nacinProdaje,
    sezona: sezonaIzPolj(i.sezona),
    stopnjaDDV: odstotekDDV(i.stopnjaDDV),
    primernoZaDarilo: Boolean(i.primernoZaDarilo),
    velikosti: i.velikosti.map((v) => ({
      id: v.id ?? "",
      oznaka: v.oznaka,
      cenaCenti: v.cenaCenti ?? null,
      zaloga: v.zaloga ?? null,
    })),
  };
}

function skupinaPogled(s: SkupinePonudbe): SkupinaPogled {
  return {
    id: s.id,
    ime: s.ime,
    opis: s.opis ?? null,
    slika: slikaPogled(s.slika),
    kategorije: (s.kategorije ?? []).map((k) => (typeof k === "number" ? k : k.id)),
  };
}

async function preberiKatalog(): Promise<Katalog> {
  const payload = await getPayload({ config });
  // Javne strani berejo z enakimi pravili kot neprijavljen obiskovalec:
  // neobjavljeni izdelki niso vidni nikjer (Z14).
  const kot = { overrideAccess: false, depth: 1, pagination: false } as const;
  const [kategorije, izdelki, skupine] = await Promise.all([
    payload.find({ collection: "kategorije", sort: ["vrstniRed", "ime"], ...kot, depth: 0 }),
    payload.find({ collection: "izdelki", sort: ["vrstniRed", "ime"], ...kot }),
    payload.find({ collection: "skupine-ponudbe", sort: ["vrstniRed", "ime"], ...kot }),
  ]);
  return {
    kategorije: kategorije.docs.map(kategorijaPogled),
    izdelki: izdelki.docs.map(izdelekPogled).filter((i): i is IzdelekPogled => i !== null),
    skupine: skupine.docs.map(skupinaPogled),
  };
}

/** Kategorije, objavljeni izdelki in skupine ponudbe. */
export const naloziKatalog = unstable_cache(preberiKatalog, ["katalog-v1"], {
  tags: [OZNAKA_KATALOG],
  revalidate: OSVEZI_PO_SEKUNDAH,
});

export type NastavitvePogled = Pick<
  NastavitveTrgovine,
  "trgovinaOdprta" | "postninaCenti" | "pragBrezplacnePostnineCenti" | "emailObvestil" | "navodilaZaPrevzem" | "prodajalec"
>;

/** Nastavitve trgovine; berejo se samo na strežniku (global je zaprt za javnost). */
export const naloziNastavitve = unstable_cache(
  async (): Promise<NastavitvePogled> => {
    const payload = await getPayload({ config });
    const n = await payload.findGlobal({ slug: "nastavitve-trgovine", depth: 0 });
    return {
      trgovinaOdprta: n.trgovinaOdprta,
      postninaCenti: n.postninaCenti,
      pragBrezplacnePostnineCenti: n.pragBrezplacnePostnineCenti,
      emailObvestil: n.emailObvestil,
      navodilaZaPrevzem: n.navodilaZaPrevzem,
      prodajalec: n.prodajalec,
    };
  },
  ["nastavitve-trgovine-v1"],
  { tags: [OZNAKA_NASTAVITVE], revalidate: OSVEZI_PO_SEKUNDAH },
);
