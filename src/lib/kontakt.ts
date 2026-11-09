import type { IconType } from "react-icons";

/**
 * Kontaktni podatki za javne strani (glava, noga, domača stran, o nas,
 * zasebnost). Vir je global `nastavitve-trgovine` → `prodajalec`, ki ga
 * ureja administrator; nekdanji `src/data/contact.ts` je odstranjen.
 *
 * Prazno polje v nastavitvah pomeni, da se vrstica ne prikaže (ne
 * izmišljamo si podatkov).
 */

export interface PodatkiProdajalca {
  naziv?: string | null;
  naslov?: string | null;
  telefon?: string | null;
  email?: string | null;
}

export interface Kontakt {
  /** Ime kmetije, kot ga vidi obiskovalec. */
  ime: string;
  naslov: string | null;
  /** Naslov v dveh vrsticah (ulica, pošta), za prikaz. */
  naslovVrstice: string[];
  telefon: string | null;
  /** `tel:` povezava v mednarodni obliki. */
  telefonPovezava: string | null;
  email: string | null;
  /** Google Maps na naslovu. */
  zemljevid: string | null;
  /** Google Maps s potjo do naslova (izhodišče izbere naprava). */
  pot: string | null;
}

export const IME_KMETIJE = "Domačija Tešlan";

const prazno = (v: string | null | undefined) => {
  const s = v?.trim();
  return s ? s : null;
};

/**
 * `tel:` povezava. Slovenska številka z vodilno ničlo dobi klicno kodo
 * +386 (040 578 512 → tel:+38640578512), da deluje tudi s tujo kartico.
 */
export function telefonskaPovezava(telefon: string): string {
  let st = telefon.replace(/[^\d+]/g, "");
  if (st.startsWith("00")) st = `+${st.slice(2)}`;
  else if (st.startsWith("0")) st = `+386${st.slice(1)}`;
  return `tel:${st}`;
}

/**
 * Povezavi na Google Maps prek uradnega URL API-ja. Naslov je kodiran, da
 * šumniki in „pri Novem mestu“ ne razrešijo v napačno Stražo.
 */
export function povezaveZemljevida(naslov: string) {
  const q = encodeURIComponent(naslov);
  return {
    zemljevid: `https://www.google.com/maps/search/?api=1&query=${q}`,
    pot: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
  };
}

export function kontaktIzNastavitev(prodajalec: PodatkiProdajalca | null | undefined): Kontakt {
  const naslov = prazno(prodajalec?.naslov);
  const telefon = prazno(prodajalec?.telefon);
  const zemljevid = naslov ? povezaveZemljevida(naslov) : null;
  return {
    ime: IME_KMETIJE,
    naslov,
    naslovVrstice: naslov
      ? naslov
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean)
      : [],
    telefon,
    telefonPovezava: telefon ? telefonskaPovezava(telefon) : null,
    email: prazno(prodajalec?.email),
    zemljevid: zemljevid?.zemljevid ?? null,
    pot: zemljevid?.pot ?? null,
  };
}

/** Vrstica s kontaktnim podatkom (ikona, oznaka, vsebina) za sezname na straneh. */
export interface VrsticaKontakta {
  ikona: IconType;
  oznaka: string;
  vsebina: React.ReactNode;
}
