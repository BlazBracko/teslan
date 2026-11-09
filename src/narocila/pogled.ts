import type { DDVPoStopnji, NacinDostave, NacinPlacila } from "@/kosarica/cene";
import type { Narocila } from "@/payload-types";
import type { StatusNarocila } from "./statusi";

/**
 * Ploska oblika naročila za stran potrdila in e-pošto (brez Payloadovih
 * tipov in brez žetona).
 */

export interface KosVsebineNarocilaPogled {
  ime: string;
  velikost: string | null;
  kolicina: number;
  cenaCenti: number;
}

export interface PostavkaNarocilaPogled {
  tip: "izdelek" | "skatla";
  ime: string;
  velikost: string | null;
  kolicina: number;
  /** Pri škatli cena ene škatle z vsebino. */
  cenaCenti: number;
  stopnjaDDV: number;
  skupajCenti: number;
  /** Vsebina ene darilne škatle (pri izdelku prazna). */
  vsebina: KosVsebineNarocilaPogled[];
  sporociloNaKartici: string | null;
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
  /** Z55: paket gre na naslov prejemnika (`naslov` je tedaj njegov). */
  darilo: boolean;
  prejemnik: { ime: string } | null;
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
    darilo: Boolean(n.darilo) && naslov !== null,
    prejemnik: n.darilo && n.prejemnik?.ime ? { ime: n.prejemnik.ime } : null,
    opomba: n.opomba ?? null,
    postavke: n.postavke.map((p) => {
      const vsebina = p.tip === "skatla" ? (p.vsebina ?? []) : [];
      const cenaCenti = p.cenaCenti + vsebina.reduce((s, v) => s + v.cenaCenti * v.kolicina, 0);
      return {
        tip: p.tip,
        ime: p.ime,
        velikost: p.velikost ?? null,
        kolicina: p.kolicina,
        cenaCenti,
        stopnjaDDV: p.stopnjaDDV,
        skupajCenti: cenaCenti * p.kolicina,
        vsebina: vsebina.map((v) => ({
          ime: v.ime,
          velikost: v.velikost ?? null,
          kolicina: v.kolicina,
          cenaCenti: v.cenaCenti,
        })),
        sporociloNaKartici: p.sporociloNaKartici?.trim() || null,
      };
    }),
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
