import type { IzdelekPogled, Katalog } from '@/katalog/podatki';
import { razpolozljivostVelikosti, type Razpolozljivost } from '@/katalog/razpolozljivost';
import type { Mesec } from '@/katalog/sezona';
import type { VrsticaCenika } from './ProductCard';
import type { Stock } from './StockTag';

/**
 * Pretvorba kataloga iz CMS v vrstice obstoječega cenika (ena vrstica na
 * velikost, kot prej). Prehodno: K5 zgradi `/products` na novo s karticami
 * na izdelek.
 */
function stock(r: Razpolozljivost): Stock {
  if (r.narocljiva) return { kind: 'na-zalogi', label: r.oznaka };
  if (r.vrsta === 'kmalu') return { kind: 'kmalu', label: r.oznaka };
  return { kind: 'ni-na-voljo', label: r.oznaka };
}

function vrsticeIzdelka(izdelek: IzdelekPogled, mesec: Mesec): VrsticaCenika[] {
  return izdelek.velikosti.map((velikost) => {
    const r = razpolozljivostVelikosti(izdelek, velikost, mesec);
    return {
      id: `${izdelek.id}-${velikost.id}`,
      name: izdelek.ime,
      amount: velikost.oznaka,
      price: izdelek.nacinProdaje === 'samo-prikaz' ? null : velikost.cenaCenti,
      category: izdelek.kategorija.ime,
      description: izdelek.kratekOpis,
      image: izdelek.slike[0] ?? null,
      stock: stock(r),
    };
  });
}

export function vrsticeCenika(katalog: Katalog, mesec: Mesec) {
  const vrstice = katalog.izdelki.flatMap((i) => vrsticeIzdelka(i, mesec));
  // Kategorije v vrstnem redu iz CMS, samo tiste z vsaj enim izdelkom.
  const kategorije = katalog.kategorije
    .map((k) => k.ime)
    .filter((ime) => vrstice.some((v) => v.category === ime));
  return { vrstice, kategorije };
}
