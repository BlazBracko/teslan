import { priceList, priceListCategories } from './priceList';

/**
 * Pregled ponudbe za domačo stran, združen v skupine.
 *
 * Zakaj skupine in ne kategorije s cenika: kategorij je devet, kar je na
 * domači strani devet škatel z besedilom in nobene slike. Poleg tega jih
 * obiskovalec ne bere kot ponudbo, ampak kot seznam iz baze — „Začimbe 6,
 * 3,50—12,00 €“ je vrstica iz cenika, ne izložba.
 *
 * Skupine so združene tako, kot ljudje razmišljajo o hrani (sveže, začimbe,
 * sladko, shramba), ne tako, kot je urejen cenik. Vsaka dobi eno sliko, kar
 * je izvedljivo: devet fotografij ne obstaja, štiri skoraj.
 *
 * Namesto števil in cenovnih razponov nosi vsaka skupina **imena dejanskih
 * izdelkov**. „Česen, čebula in paradižnik v prahu“ razumeš takoj; „6 ·
 * 3,50—12,00 €“ je statistika o množici in z njo ne moreš nič. Ostane samo
 * `od X €`, ker je to edina cena, na katero se da opreti.
 */
export interface OfferingGroup {
  name: string;
  /** Kategorije s cenika, ki spadajo v to skupino. */
  categories: string[];
  /** Kaj je v skupini, z imeni izdelkov s cenika. */
  blurb: string;
  /**
   * Pot do slike v `public/`. Neobvezna — ploščica pokaže mirno nadomestno
   * ploskev, tako kot kartice na `/products`. Ko fotografija nastane, se
   * doda tu in koda se ne spremeni.
   */
  image?: string;
  /**
   * Opis slike. Ločen od `name`, ker ime skupine opisuje ponudbo, ne
   * fotografije — bralcu zaslonskega bralnika „Sladko“ ne pove, kaj vidi.
   */
  imageAlt?: string;
  /**
   * `cover` za prave fotografije — te napolnijo ploskev od roba do roba.
   * `contain` za izrezke izdelkov, ki se položijo na svetlo ploskev kot na
   * kartico. Privzeto `contain`.
   *
   * Vmesne poti ni: fotografija z `contain` bi se sredi kremne ploskve
   * izrisala kot majhen pravokotnik z belim robom naokrog, izrezek z `cover`
   * pa bi se obrezal mimo motiva.
   */
  imageFit?: 'cover' | 'contain';
}

const groups: OfferingGroup[] = [
  {
    name: 'Sveže z njive',
    categories: ['Sveža zelenjava'],
    /* Sezone so iz `data/products.ts`. Svežega česna, krompirja in jagod na
       ceniku ni, `meta description` pa jih obljublja — zato so imenovani
       tukaj. Prej je bil za to poseben pas z devetimi ovalnimi značkami. */
    blurb:
      'Šparglji od aprila do junija, jagode od maja, česen in krompir jeseni. Redkvica skozi sezono.',
    /* Izrezek in ne fotografija s kmetije, iz dveh razlogov. `spargelj22.png`
       je ilustracija in bi bila edina risba med posnetki. `slika1.jpeg` pa je
       skoraj enakega razmerja kot ploskev, zato je `cover` ne obreže — v
       160×213 px se vidi predvsem trata, šparglji pa ostanejo drobni na dnu.
       Poleg tega so šparglji na tej strani zgoraj že dvakrat. */
    image: '/krompir.jpg',
    imageAlt: 'Domači krompir',
  },
  {
    name: 'Začimbe in posušeno',
    categories: ['Začimbe', 'Prigrizki'],
    blurb:
      'Česen, šparglji, čebula in paradižnik v prahu, suhi peteršilj in hrustljav čebulni čips.',
    image: '/cesen.jpg',
    imageAlt: 'Glavice domačega česna',
  },
  {
    name: 'Sladko',
    categories: ['Liofilizirano sadje', 'Sokovi'],
    blurb: 'Posušene jagode, borovnice in maline, ki ostanejo hrustljave, ter sok aronije.',
    image: '/jagode.png',
    /* Na sliki so SVEŽE jagode, čeprav skupina prodaja posušene. Opis mora
       povedati, kaj se vidi, ne kaj bi si želeli. Neujemanje je isto kot na
       kartici „Liofilizirane jagode“ in ga odpravi šele prava fotografija
       posušenega sadja. */
    imageAlt: 'Sveže jagode',
  },
  {
    name: 'Iz domače kuhinje',
    categories: ['Marmelade in vloženo', 'Jajca', 'Olja', 'Testenine'],
    blurb:
      'Kokošja in prepeličja jajca, bučno in olivno olje, testenine s šparglji, marmelada in vloženi jurčki.',
  },
];

/**
 * Vsaka kategorija s cenika mora pripadati natanko eni skupini.
 *
 * Brez te kontrole bi nova kategorija na ceniku tiho izpadla z domače
 * strani, dvojna uvrstitev pa bi izdelke šteta dvakrat. Ker to teče ob
 * uvozu v server komponenti, se napaka pokaže med buildom in ne na strani.
 */
const uvrscene = groups.flatMap((group) => group.categories);
const podvojene = uvrscene.filter((name, i) => uvrscene.indexOf(name) !== i);
const neuvrscene = priceListCategories.filter((name) => !uvrscene.includes(name));
const neznane = uvrscene.filter((name) => !priceListCategories.includes(name));

if (podvojene.length || neuvrscene.length || neznane.length) {
  throw new Error(
    [
      'Skupine ponudbe se ne ujemajo s cenikom:',
      podvojene.length && `  v dveh skupinah: ${podvojene.join(', ')}`,
      neuvrscene.length && `  brez skupine: ${neuvrscene.join(', ')}`,
      neznane.length && `  ni na ceniku: ${neznane.join(', ')}`,
    ]
      .filter(Boolean)
      .join('\n'),
  );
}

export interface OfferingGroupView extends OfferingGroup {
  /** Najnižja cena v skupini. Edina cena, ki obiskovalcu kaj pove. */
  fromPrice: number;
}

/** Izpeljano iz cenika, da se cena ob spremembi cenika popravi sama. */
export const offering: OfferingGroupView[] = groups.map((group) => ({
  ...group,
  fromPrice: Math.min(
    ...priceList.filter((item) => group.categories.includes(item.category)).map((i) => i.price),
  ),
}));
