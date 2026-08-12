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
  /**
   * Kratek opis izdelka, ena ali dve vrstici. Neobvezen — kartica ga
   * preprosto izpusti, če ga ni.
   *
   * Namenoma prazen pri večini: opisov živil si ne izmišljujem. Sestavine,
   * poreklo in način predelave so trditve, ki jih lahko zapiše samo tisti,
   * ki izdelek dela.
   */
  description?: string;
  /**
   * Pot do slike v `public/`. Neobvezna — kartica pokaže mirno nadomestno
   * ploskev iz palete, da vrsta ostane enotna in ne izgleda pokvarjeno.
   */
  image?: string;
  /**
   * `contain` za izrezke na beli oz. prosojni podlagi, da se ne obrežejo;
   * `cover` za prave fotografije. Privzeto `cover`.
   */
  imageFit?: 'cover' | 'contain';
  /**
   * `object-position` za obrez. Fotografije s kmetije so portretne in subjekt
   * na njih ni v sredini kadra, zato privzeti center obreže mimo.
   */
  imagePosition?: string;
}

export const priceList: PriceListItem[] = [
  {
    id: 1,
    name: 'Šparglji šopek',
    amount: '0,5 kg',
    price: 5.5,
    category: 'Sveža zelenjava',
    // Primer izpolnjenih polj. Ostali izdelki jih čakajo.
    description: 'Ročno pobrani vsako jutro. Nežen okus, popolni za na žar ali v solato.',
    image: '/slika1.jpeg',
    imagePosition: '50% 100%',
  },
  {
    id: 2,
    name: 'Redkvica šopek',
    amount: 'šopek',
    price: 2.5,
    category: 'Sveža zelenjava',
    description: 'Hrustljava in blago pikantna. Lepo se poda v solate ali na kruh z maslom.',
  },
  {
    id: 3,
    name: 'Česen v prahu',
    amount: '41 ml (15 g)',
    price: 5.0,
    category: 'Začimbe',
    description: 'Priročna zamenjava za svež česen. Za juhe, omake in marinade.',
    image: '/cesen.jpg',
    imageFit: 'contain',
  },
  {
    id: 4,
    name: 'Česen v prahu',
    amount: '106 ml (40 g)',
    price: 12.0,
    category: 'Začimbe',
    description: 'Večje pakiranje za pogosto uporabo.',
    image: '/cesen.jpg',
    imageFit: 'contain',
  },
  {
    id: 5,
    name: 'Šparglji v prahu',
    amount: '106 ml (18 g)',
    price: 5.0,
    category: 'Začimbe',
    description: 'Nežna špargljeva aroma za juhe, rižote in namaze.',
    image: '/spargelj22.png',
    imageFit: 'contain',
  },
  {
    id: 6,
    name: 'Čebula v prahu',
    amount: '106 ml (35 g)',
    price: 9.0,
    category: 'Začimbe',
    description: 'Enakomerna čebulna osnova brez rezanja in solz.',
  },
  {
    id: 7,
    name: 'Paradižnik v prahu',
    amount: '20 g',
    price: 6.0,
    category: 'Začimbe',
    description: 'Zgoščen paradižnikov okus za omake in juhe.',
  },
  {
    id: 8,
    name: 'Suhi peteršilj',
    amount: '212 ml (15 g)',
    price: 5.0,
    category: 'Začimbe',
    description: 'Za posip po jedi in v juhe. Pred uporabo zdrobi med prsti.',
  },
  {
    id: 9,
    name: 'Čebulni čips',
    amount: '45 g',
    price: 10.0,
    category: 'Prigrizki',
    description: 'Hrustljav prigrizek s toplim čebulnim okusom. Tudi kot posip po solati.',
  },
  {
    id: 10,
    name: 'Jajca kokošja',
    amount: '10 kos',
    price: 3.0,
    category: 'Jajca',
    description: 'Pakirano po deset. Za vsakodnevno kuho in peko.',
  },
  {
    id: 11,
    name: 'Jajca prepeličja',
    amount: '18 kos',
    price: 5.0,
    category: 'Jajca',
    description: 'Drobna jajca, primerna za predjedi in okrasitev krožnika.',
  },
  {
    id: 12,
    name: 'Vložena prepeličja jajca',
    amount: '370 ml',
    price: 8.0,
    category: 'Jajca',
    description: 'Že pripravljena — na krožnik s hladnimi predjedmi ali kot prigrizek.',
  },
  {
    id: 13,
    name: 'Liofilizirane jagode, breskve',
    amount: '370 ml (20 g)',
    price: 8.0,
    category: 'Liofilizirano sadje',
    description: 'Sadje brez dodane vode, hrustljavo. Za zajtrk ali pecivo.',
    image: '/jagode.png',
    imageFit: 'contain',
  },
  {
    id: 14,
    name: 'Liofilizirane borovnice',
    amount: '370 ml (40 g)',
    price: 13.0,
    category: 'Liofilizirano sadje',
    description: 'Cel sadež, hrustljav. Za müsli, jogurt in pecivo.',
  },
  {
    id: 15,
    name: 'Liofilizirane mix',
    amount: '370 ml (40 g)',
    price: 13.0,
    category: 'Liofilizirano sadje',
    description: 'Mešanica več vrst sadja v enem pakiranju.',
  },
  {
    id: 16,
    name: 'Liofilizirane maline',
    amount: '370 ml (20 g)',
    price: 8.0,
    category: 'Liofilizirano sadje',
    description: 'Izrazit malinov okus za sladice in napitke.',
  },
  {
    id: 17,
    name: 'Fižol liofiliziran',
    amount: '280 g',
    price: 10.0,
    category: 'Liofilizirano sadje',
    description: 'Hitra priprava: prelij z vročo vodo in počakaj.',
  },
  {
    id: 18,
    name: 'Marmelada borovnica',
    amount: '370 ml',
    price: 8.0,
    category: 'Marmelade in vloženo',
    description: 'Za na kruh, v pecivo ali k sladicam.',
  },
  {
    id: 19,
    name: 'Vloženi jurčki',
    amount: '370 ml',
    price: 12.0,
    category: 'Marmelade in vloženo',
    description: 'Za predjedi, k mesu ali v testenine.',
  },
  {
    id: 20,
    name: 'Testenine s šparglji',
    amount: '150 g',
    price: 5.0,
    category: 'Testenine',
    description: 'Testenine z nežno špargljevo noto. Lepo se povežejo z maslom.',
    image: '/sparglji.jpg',
    imageFit: 'contain',
  },
  {
    id: 21,
    name: 'Bučno / olivno olje',
    amount: '1 L',
    price: 20.0,
    category: 'Olja',
    description: 'Za solate in hladne jedi. Veliko pakiranje.',
  },
  {
    id: 22,
    name: 'Bučno / olivno olje',
    amount: '0,5 L',
    price: 12.0,
    category: 'Olja',
    description: 'Manjše pakiranje za občasno uporabo.',
  },
  {
    id: 23,
    name: 'Aronija sok',
    amount: '1 L',
    price: 10.0,
    category: 'Sokovi',
    description: 'Temen in izrazit sok. Po okusu razredči z vodo.',
  },
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
