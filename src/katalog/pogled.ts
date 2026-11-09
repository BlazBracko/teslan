import type { Izdelki, Kategorije, Media, SkupinePonudbe } from "@/payload-types";
import { odstotekDDV } from "./ddv";
import type { NacinProdaje } from "./razpolozljivost";
import { sezonaIzPolj, type Sezona } from "./sezona";
import { potSlike } from "./slike";

/**
 * Ploske oblike kataloga za javne strani in blagajno (brez Payloadovih
 * tipov, da jih komponente lahko prejmejo kot props). Pretvorbe so čiste
 * funkcije brez baze: `podatki.ts` jih uporabi za predpomnjen katalog,
 * oddaja naročila (K7) pa za sveže prebrane izdelke v transakciji.
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

export function slikaPogled(medij: number | Media | null | undefined): SlikaPogled | null {
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

export function kategorijaPogled(k: Kategorije): KategorijaPogled {
  return { id: k.id, ime: k.ime, slug: k.slug ?? String(k.id) };
}

export function izdelekPogled(i: Izdelki): IzdelekPogled | null {
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

export function skupinaPogled(s: SkupinePonudbe): SkupinaPogled {
  return {
    id: s.id,
    ime: s.ime,
    opis: s.opis ?? null,
    slika: slikaPogled(s.slika),
    kategorije: (s.kategorije ?? []).map((k) => (typeof k === "number" ? k : k.id)),
  };
}
