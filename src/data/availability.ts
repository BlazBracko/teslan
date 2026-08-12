/**
 * Razpoložljivost izdelkov.
 *
 * To je namenoma edino mesto, ki ve, ali je izdelek na zalogi. Ko bo zalogo
 * objavljala vaša aplikacija z bazo, se zamenja samo `stockFor` — kartice in
 * stran ostanejo nedotaknjene, ker sprejemajo že izračunan `Stock`.
 *
 * Dve vrsti razpoložljivosti, ker nista isto:
 *
 *  - **sezonska** (sveži pridelki): šparglji v avgustu niso „pošli“, ampak
 *    jih sezona še ni oz. ni več. Izračuna se iz meseca.
 *  - **ročna** (predelano: začimbe, olja, marmelade): velja, dokler je kdo
 *    ne spremeni. Prav to bo prevzela aplikacija.
 */

export type StockKind = 'na-zalogi' | 'kmalu' | 'ni-na-voljo';

export interface Stock {
  kind: StockKind;
  label: string;
}

/** Meseca od/do, 1 = januar. Obseg lahko prelije čez novo leto (npr. 11–2). */
export interface Season {
  from: number;
  to: number;
}

const MESECI = [
  'Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij',
  'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December',
];

export const monthName = (m: number) => MESECI[m - 1];

export const seasonLabel = (s: Season) => `${monthName(s.from)} — ${monthName(s.to)}`;

/** Upošteva tudi sezone, ki se prelijejo čez novo leto. */
export function inSeason(season: Season, month: number): boolean {
  return season.from <= season.to
    ? month >= season.from && month <= season.to
    : month >= season.from || month <= season.to;
}

const prejsnjiMesec = (m: number) => (m === 1 ? 12 : m - 1);

export function stockFor(
  item: { season?: Season; inStock?: boolean },
  month: number,
): Stock {
  if (item.season) {
    if (inSeason(item.season, month)) return { kind: 'na-zalogi', label: 'Na zalogi' };
    // Mesec pred začetkom sezone: „kmalu“ pove več kot „ni na voljo“.
    if (month === prejsnjiMesec(item.season.from)) return { kind: 'kmalu', label: 'Kmalu' };
    return { kind: 'ni-na-voljo', label: `Sezona ${seasonLabel(item.season)}` };
  }

  return item.inStock === false
    ? { kind: 'ni-na-voljo', label: 'Trenutno ni na zalogi' }
    : { kind: 'na-zalogi', label: 'Na zalogi' };
}
