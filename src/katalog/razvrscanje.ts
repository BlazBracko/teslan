import {
  jeNaKmetiji,
  razpolozljivostIzdelka,
  type IzdelekZaRazpolozljivost,
  type VelikostZaRazpolozljivost,
  type VrstaRazpolozljivosti,
} from "./razpolozljivost";
import type { Mesec } from "./sezona";

type IzdelekZaSeznam = IzdelekZaRazpolozljivost & { velikosti: VelikostZaRazpolozljivost[] };

/**
 * Vrstni red na seznamu izdelkov: najprej tisto, kar se da naročiti zdaj,
 * nato kar pride kmalu, kar je na voljo samo na kmetiji, kar ni v sezoni in
 * na koncu razprodano. Znotraj skupine ostane vrstni red iz CMS (urednikov
 * `vrstniRed`), zato je razvrščanje stabilno.
 *
 * Brez tega je kupec novembra v spletni trgovini najprej videl šparglje, ki
 * jih ni mogoče naročiti do aprila.
 */
const RANG: Record<VrstaRazpolozljivosti, number> = {
  "na-zalogi": 0,
  malo: 0,
  kmalu: 1,
  "na-kmetiji": 2,
  "izven-sezone": 3,
  "ni-na-zalogi": 4,
};

export function razvrstiZaSeznam<T extends IzdelekZaSeznam>(
  izdelki: readonly T[],
  mesec: Mesec,
): T[] {
  return izdelki
    .map((izdelek, i) => ({ izdelek, i, rang: RANG[razpolozljivostIzdelka(izdelek, mesec).vrsta] }))
    .sort((a, b) => a.rang - b.rang || a.i - b.i)
    .map((x) => x.izdelek);
}

/**
 * Izbor za domačo stran: najprej izpostavljeni, nato po en izdelek iz vsake
 * kategorije (da izbor pokaže širino ponudbe), vsi naročljivi v spletni
 * trgovini (izdelki „Na voljo na kmetiji“ v izbor ne spadajo).
 */
export function izborZaDomov<T extends IzdelekZaSeznam & { izpostavljen: boolean; kategorija: { id: number } }>(
  izdelki: readonly T[],
  mesec: Mesec,
  najvec: number,
): T[] {
  const narocljivi = izdelki.filter(
    (i) => !jeNaKmetiji(i.nacinProdaje) && razpolozljivostIzdelka(i, mesec).narocljiva,
  );
  const izbrani: T[] = narocljivi.filter((i) => i.izpostavljen).slice(0, najvec);
  const kategorije = new Set(izbrani.map((i) => i.kategorija.id));
  for (const izdelek of narocljivi) {
    if (izbrani.length >= najvec) break;
    if (izbrani.includes(izdelek) || kategorije.has(izdelek.kategorija.id)) continue;
    izbrani.push(izdelek);
    kategorije.add(izdelek.kategorija.id);
  }
  for (const izdelek of narocljivi) {
    if (izbrani.length >= najvec) break;
    if (!izbrani.includes(izdelek)) izbrani.push(izdelek);
  }
  return izbrani;
}
