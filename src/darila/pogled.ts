import { slikaPogled, type SlikaPogled } from "@/katalog/pogled";
import type { DarilniProgrami, TipiSkatel } from "@/payload-types";

/**
 * Ploske oblike darilnih škatel in programov za javne strani, košarico in
 * oddajo naročila (brez Payloadovih tipov).
 */

export interface TipSkatlePogled {
  id: number;
  ime: string;
  opis: string | null;
  slika: SlikaPogled | null;
  steviloMest: number;
  cenaCenti: number;
  zaloga: number;
  aktiven: boolean;
}

export interface ProgramPogled {
  id: number;
  ime: string;
  slug: string;
  opis: string | null;
  slika: SlikaPogled | null;
  tipSkatleId: number | null;
  /** Vsebina, kot jo je vpisal urednik; izdelek je `null`, če ga ni več. */
  vsebina: Array<{ izdelekId: number | null; velikostId: string | null; kolicina: number }>;
}

export interface Darila {
  tipi: TipSkatlePogled[];
  programi: ProgramPogled[];
}

const idRelacije = (v: number | { id: number } | null | undefined) => (typeof v === "object" && v ? v.id : (v ?? null));

export function tipSkatlePogled(t: TipiSkatel): TipSkatlePogled {
  return {
    id: t.id,
    ime: t.ime,
    opis: t.opis ?? null,
    slika: slikaPogled(t.slika),
    steviloMest: t.steviloMest,
    cenaCenti: t.cenaCenti,
    zaloga: t.zaloga,
    aktiven: t.aktiven !== false,
  };
}

export function programPogled(p: DarilniProgrami): ProgramPogled {
  return {
    id: p.id,
    ime: p.ime,
    slug: p.slug ?? String(p.id),
    opis: p.opis ?? null,
    slika: slikaPogled(p.slika),
    tipSkatleId: idRelacije(p.tipSkatle),
    vsebina: (p.vsebina ?? []).map((v) => ({
      izdelekId: idRelacije(v.izdelek),
      velikostId: v.velikostId ?? null,
      kolicina: v.kolicina,
    })),
  };
}
