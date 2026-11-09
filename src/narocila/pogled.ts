import type { DDVPoStopnji, NacinDostave, NacinPlacila } from "@/kosarica/cene";
import type { Narocila } from "@/payload-types";
import type { StatusNarocila } from "./statusi";

/**
 * Ploska oblika naročila za stran potrdila in e-pošto (brez Payloadovih
 * tipov in brez žetona).
 */

export interface PostavkaNarocilaPogled {
  ime: string;
  velikost: string | null;
  kolicina: number;
  cenaCenti: number;
  stopnjaDDV: number;
  skupajCenti: number;
}

export interface NarociloPogled {
  id: number;
  stevilka: string;
  status: StatusNarocila;
  nacinDostave: NacinDostave;
  nacinPlacila: NacinPlacila;
  placano: boolean;
  /** Čas oddaje (ISO). */
  oddano: string;
  kupec: { ime: string; priimek: string; email: string; telefon: string };
  naslov: { ulica: string; postnaStevilka: string; kraj: string } | null;
  opomba: string | null;
  postavke: PostavkaNarocilaPogled[];
  vmesniSestevekCenti: number;
  postninaCenti: number;
  skupajCenti: number;
  ddv: DDVPoStopnji[];
}

export const OZNAKE_DOSTAVE: Record<NacinDostave, string> = {
  prevzem: "Prevzem na kmetiji",
  posta: "Pošta",
};

export const OZNAKE_PLACILA: Record<NacinPlacila, string> = {
  kartica: "S kartico",
  "ob-prevzemu": "Ob prevzemu",
};

export function narociloPogled(n: Narocila): NarociloPogled {
  const naslov =
    n.nacinDostave === "posta" && n.naslov?.ulica
      ? { ulica: n.naslov.ulica, postnaStevilka: n.naslov.postnaStevilka ?? "", kraj: n.naslov.kraj ?? "" }
      : null;
  return {
    id: n.id,
    stevilka: n.stevilka,
    status: n.status,
    nacinDostave: n.nacinDostave,
    nacinPlacila: n.nacinPlacila,
    placano: Boolean(n.placano),
    oddano: n.createdAt,
    kupec: { ...n.kupec },
    naslov,
    opomba: n.opomba ?? null,
    postavke: n.postavke.map((p) => ({
      ime: p.ime,
      velikost: p.velikost ?? null,
      kolicina: p.kolicina,
      cenaCenti: p.cenaCenti,
      stopnjaDDV: p.stopnjaDDV,
      skupajCenti: p.cenaCenti * p.kolicina,
    })),
    vmesniSestevekCenti: n.vmesniSestevekCenti,
    postninaCenti: n.postninaCenti,
    skupajCenti: n.skupajCenti,
    ddv: (n.ddv ?? []).map((d) => ({ stopnja: d.stopnja, osnovaCenti: d.osnovaCenti, ddvCenti: d.ddvCenti })),
  };
}

/** Pot do potrdila naročila z žetonom (Z32). */
export function potNarocila(stevilka: string, zeton: string): string {
  return `/narocilo/${encodeURIComponent(stevilka)}?k=${encodeURIComponent(zeton)}`;
}
