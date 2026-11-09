import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import { kontaktIzNastavitev, type Kontakt } from "@/lib/kontakt";
import type { NastavitveTrgovine } from "@/payload-types";
import { OSVEZI_PO_SEKUNDAH, OZNAKA_KATALOG, OZNAKA_NASTAVITVE } from "./oznake";
import { izdelekPogled, kategorijaPogled, skupinaPogled, type IzdelekPogled, type Katalog } from "./pogled";

export type {
  IzdelekPogled,
  KategorijaPogled,
  Katalog,
  SkupinaPogled,
  SlikaPogled,
  VelikostPogled,
} from "./pogled";

/**
 * Podatki iz CMS za javne strani (strežnik). Poizvedbe so predpomnjene z
 * oznakami iz `oznake.ts`: hooki v Payloadu jih ob spremembi razveljavijo,
 * sicer se osvežijo najkasneje po 60 s (Z17).
 *
 * Vrnjene oblike so namenoma ploske in brez Payloadovih tipov, da jih
 * komponente lahko prejmejo kot props (tudi odjemalske) in da predpomnilnik
 * ne hrani nepotrebnih polj.
 */

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

/** Kontaktni podatki za javne strani (iz `nastavitve-trgovine` → `prodajalec`). */
export async function naloziKontakt(): Promise<Kontakt> {
  return kontaktIzNastavitev((await naloziNastavitve()).prodajalec);
}
