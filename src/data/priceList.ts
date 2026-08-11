/**
 * Cenik izdelkov.
 *
 * Prej je teh 23 vrstic živelo neposredno v `app/products/page.tsx`, skupaj
 * z drugim vmesnikom `Product`, ki se je podvajal z `data/products.ts`
 * (tam so sezonski pridelki za domačo stran). Ločena datoteka pomeni, da
 * je stran lahko server komponenta in da se cenik ureja na enem mestu.
 */
export interface PriceListItem {
  id: number;
  name: string;
  /** Pakiranje oz. količina, kot je zapisana na ceniku. */
  amount: string;
  price: number;
  category: string;
}

export const priceList: PriceListItem[] = [
  { id: 1,  name: 'Šparglji šopek',                 amount: '0,5 kg',           price: 5.5,  category: 'Sveža zelenjava' },
  { id: 2,  name: 'Redkvica šopek',                 amount: 'šopek',            price: 2.5,  category: 'Sveža zelenjava' },
  { id: 3,  name: 'Česen v prahu',                  amount: '41 ml (15 g)',     price: 5.0,  category: 'Začimbe' },
  { id: 4,  name: 'Česen v prahu',                  amount: '106 ml (40 g)',    price: 12.0, category: 'Začimbe' },
  { id: 5,  name: 'Šparglji v prahu',               amount: '106 ml (18 g)',    price: 5.0,  category: 'Začimbe' },
  { id: 6,  name: 'Čebula v prahu',                 amount: '106 ml (35 g)',    price: 9.0,  category: 'Začimbe' },
  { id: 7,  name: 'Paradižnik v prahu',             amount: '20 g',             price: 6.0,  category: 'Začimbe' },
  { id: 8,  name: 'Suhi peteršilj',                 amount: '212 ml (15 g)',    price: 5.0,  category: 'Začimbe' },
  { id: 9,  name: 'Čebulni čips',                   amount: '45 g',             price: 10.0, category: 'Prigrizki' },
  { id: 10, name: 'Jajca kokošja',                  amount: '10 kos',           price: 3.0,  category: 'Jajca' },
  { id: 11, name: 'Jajca prepeličja',               amount: '18 kos',           price: 5.0,  category: 'Jajca' },
  { id: 12, name: 'Vložena prepeličja jajca',       amount: '370 ml',           price: 8.0,  category: 'Jajca' },
  { id: 13, name: 'Liofilizirane jagode, breskve',  amount: '370 ml (20 g)',    price: 8.0,  category: 'Liofilizirano sadje' },
  { id: 14, name: 'Liofilizirane borovnice',        amount: '370 ml (40 g)',    price: 13.0, category: 'Liofilizirano sadje' },
  { id: 15, name: 'Liofilizirane mix',              amount: '370 ml (40 g)',    price: 13.0, category: 'Liofilizirano sadje' },
  { id: 16, name: 'Liofilizirane maline',           amount: '370 ml (20 g)',    price: 8.0,  category: 'Liofilizirano sadje' },
  { id: 17, name: 'Fižol liofiliziran',             amount: '280 g',            price: 10.0, category: 'Liofilizirano sadje' },
  { id: 18, name: 'Marmelada borovnica',            amount: '370 ml',           price: 8.0,  category: 'Marmelade in vloženo' },
  { id: 19, name: 'Vloženi jurčki',                 amount: '370 ml',           price: 12.0, category: 'Marmelade in vloženo' },
  { id: 20, name: 'Testenine s šparglji',           amount: '150 g',            price: 5.0,  category: 'Testenine' },
  { id: 21, name: 'Bučno / olivno olje',            amount: '1 L',              price: 20.0, category: 'Olja' },
  { id: 22, name: 'Bučno / olivno olje',            amount: '0,5 L',            price: 12.0, category: 'Olja' },
  { id: 23, name: 'Aronija sok',                    amount: '1 L',              price: 10.0, category: 'Sokovi' },
];

/** Kategorije v vrstnem redu prvega pojava na ceniku. */
export const priceListCategories = [...new Set(priceList.map((item) => item.category))];

/** Povzetek kategorije za pregled ponudbe na domači strani. */
export interface PriceListCategorySummary {
  name: string;
  count: number;
  minPrice: number;
  maxPrice: number;
}

/**
 * Izpeljano iz `priceList`, ne prepisano na roko — če se cenik spremeni,
 * se števila in cenovni razponi na domači strani popravijo sami.
 * Urejeno po številu izdelkov, da največje kategorije dobijo prostor.
 */
export const priceListSummary: PriceListCategorySummary[] = priceListCategories
  .map((name) => {
    const items = priceList.filter((item) => item.category === name);
    const prices = items.map((item) => item.price);
    return {
      name,
      count: items.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  })
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'sl'));

/** Skupno število izdelkov na ceniku. */
export const priceListTotal = priceList.length;
