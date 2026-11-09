import type { NacinProdaje } from "../katalog/razpolozljivost";
import type { Mesec } from "../katalog/sezona";

/**
 * Začetni podatki kataloga (§6, tabela izdelkov). Prej so živeli v
 * `src/data/priceList.ts`, `products.ts` in `offering.ts`; zdaj so le vir za
 * seed, na strani pa se berejo iz baze.
 *
 * Cene so v centih. Opisi so z nekdanjega cenika; daljše opise, sestavine in
 * alergene vnese lastnik v adminu (§7).
 */

export interface SlikaSeed {
  /** Datoteka v `public/`. */
  datoteka: string;
  alt: string;
  /** Žarišče obreza v odstotkih (Payload `focalX`/`focalY`). */
  zarisce?: { x: number; y: number };
}

export const SLIKE = {
  sparglji: {
    datoteka: "slika1.jpeg",
    alt: "Šparglji z Domačije Tešlan na žaru, v ozadju vas Podgora",
    // Šparglji so na dnu kadra.
    zarisce: { x: 50, y: 100 },
  },
  cesen: { datoteka: "cesen.jpg", alt: "Glavice domačega česna" },
  sparglji2: { datoteka: "spargelj22.png", alt: "Ilustracija šparglja" },
  jagode: { datoteka: "jagode.png", alt: "Sveže jagode" },
  jagodeNjiva: {
    datoteka: "jagodeFB.jpg",
    alt: "Jagode na rastlini na njivi Domačije Tešlan",
    zarisce: { x: 50, y: 72 },
  },
  testenine: { datoteka: "sparglji.jpg", alt: "Zeleni šparglji" },
  krompir: { datoteka: "krompir.jpg", alt: "Domači krompir" },
} satisfies Record<string, SlikaSeed>;

export type KljucSlike = keyof typeof SLIKE;

export interface KategorijaSeed {
  ime: string;
  slug: string;
}

/** Današnjih devet kategorij s cenika + „Sveže iz sezone“ (vrstni red = prikaz). */
export const KATEGORIJE: KategorijaSeed[] = [
  { ime: "Sveža zelenjava", slug: "sveza-zelenjava" },
  { ime: "Sveže iz sezone", slug: "sveze-iz-sezone" },
  { ime: "Začimbe", slug: "zacimbe" },
  { ime: "Prigrizki", slug: "prigrizki" },
  { ime: "Jajca", slug: "jajca" },
  { ime: "Liofilizirano sadje", slug: "liofilizirano-sadje" },
  { ime: "Marmelade in vloženo", slug: "marmelade-in-vlozeno" },
  { ime: "Testenine", slug: "testenine" },
  { ime: "Olja", slug: "olja" },
  { ime: "Sokovi", slug: "sokovi" },
];

export interface SkupinaSeed {
  ime: string;
  opis: string;
  slika?: KljucSlike;
  kategorije: string[];
}

/** Štiri skupine ponudbe za domačo stran (nekdanji `src/data/offering.ts`). */
export const SKUPINE: SkupinaSeed[] = [
  {
    ime: "Sveže z njive",
    opis: "Šparglji od aprila do junija, jagode od maja, česen in krompir jeseni. Redkvica skozi sezono.",
    slika: "krompir",
    kategorije: ["sveza-zelenjava", "sveze-iz-sezone"],
  },
  {
    ime: "Začimbe in posušeno",
    opis: "Česen, šparglji, čebula in paradižnik v prahu, suhi peteršilj in hrustljav čebulni čips.",
    slika: "cesen",
    kategorije: ["zacimbe", "prigrizki"],
  },
  {
    ime: "Sladko",
    opis: "Posušene jagode, borovnice in maline, ki ostanejo hrustljave, ter sok aronije.",
    slika: "jagode",
    kategorije: ["liofilizirano-sadje", "sokovi"],
  },
  {
    ime: "Iz domače kuhinje",
    opis: "Kokošja in prepeličja jajca, bučno in olivno olje, testenine s šparglji, marmelada in vloženi jurčki.",
    kategorije: ["marmelade-in-vlozeno", "jajca", "olja", "testenine"],
  },
];

export interface IzdelekSeed {
  ime: string;
  slug: string;
  kategorija: string;
  nacin: NacinProdaje;
  /** `[oznaka, cena v centih]`; pri `samo-prikaz` brez cene. */
  velikosti: Array<[string, number | null]>;
  sezona?: { od: Mesec; do: Mesec };
  kratekOpis: string;
  slike?: KljucSlike[];
  izpostavljen?: boolean;
}

/** Tabela izdelkov iz §6 (P2–P4). */
export const IZDELKI: IzdelekSeed[] = [
  {
    ime: "Šparglji",
    slug: "sparglji",
    kategorija: "sveza-zelenjava",
    nacin: "samo-prevzem",
    velikosti: [["šopek 0,5 kg", 550]],
    sezona: { od: 4, do: 6 },
    kratekOpis:
      "Sveži zeleni šparglji, ročno pobrani vsako jutro. Nežen okus, popolni za na žar ali v solato.",
    slike: ["sparglji"],
    izpostavljen: true,
  },
  {
    ime: "Redkvica",
    slug: "redkvica",
    kategorija: "sveza-zelenjava",
    nacin: "samo-prevzem",
    velikosti: [["šopek", 250]],
    kratekOpis: "Hrustljava in blago pikantna. Lepo se poda v solate ali na kruh z maslom.",
  },
  {
    ime: "Jagode",
    slug: "jagode",
    kategorija: "sveze-iz-sezone",
    nacin: "samo-prikaz",
    velikosti: [["sveže", null]],
    sezona: { od: 5, do: 7 },
    kratekOpis:
      "Sladke, sočne jagode, pridelane brez pesticidov. Popolne za sveže uživanje ali predelavo.",
    slike: ["jagodeNjiva"],
    izpostavljen: true,
  },
  {
    ime: "Česen",
    slug: "cesen",
    kategorija: "sveze-iz-sezone",
    nacin: "samo-prikaz",
    velikosti: [["sveže", null]],
    sezona: { od: 9, do: 10 },
    kratekOpis:
      "Domači česen z intenzivnim okusom. Idealen za kuhanje, kisanje ali kot naravno zdravilo.",
    slike: ["cesen"],
  },
  {
    ime: "Krompir",
    slug: "krompir",
    kategorija: "sveze-iz-sezone",
    nacin: "samo-prikaz",
    velikosti: [["sveže", null]],
    sezona: { od: 8, do: 10 },
    kratekOpis: "Domači krompir raznih sort. Odličen za pečenje, kuhanje ali kot priloga.",
    slike: ["krompir"],
  },
  {
    ime: "Česen v prahu",
    slug: "cesen-v-prahu",
    kategorija: "zacimbe",
    nacin: "posta-in-prevzem",
    velikosti: [
      ["41 ml (15 g)", 500],
      ["106 ml (40 g)", 1200],
    ],
    kratekOpis: "Priročna zamenjava za svež česen. Za juhe, omake in marinade.",
    slike: ["cesen"],
  },
  {
    ime: "Šparglji v prahu",
    slug: "sparglji-v-prahu",
    kategorija: "zacimbe",
    nacin: "posta-in-prevzem",
    velikosti: [["106 ml (18 g)", 500]],
    kratekOpis: "Nežna špargljeva aroma za juhe, rižote in namaze.",
    slike: ["sparglji2"],
  },
  {
    ime: "Čebula v prahu",
    slug: "cebula-v-prahu",
    kategorija: "zacimbe",
    nacin: "posta-in-prevzem",
    velikosti: [["106 ml (35 g)", 900]],
    kratekOpis: "Enakomerna čebulna osnova brez rezanja in solz.",
  },
  {
    ime: "Paradižnik v prahu",
    slug: "paradiznik-v-prahu",
    kategorija: "zacimbe",
    nacin: "posta-in-prevzem",
    velikosti: [["20 g", 600]],
    kratekOpis: "Zgoščen paradižnikov okus za omake in juhe.",
  },
  {
    ime: "Suhi peteršilj",
    slug: "suhi-petersilj",
    kategorija: "zacimbe",
    nacin: "posta-in-prevzem",
    velikosti: [["212 ml (15 g)", 500]],
    kratekOpis: "Za posip po jedi in v juhe. Pred uporabo zdrobite med prsti.",
  },
  {
    ime: "Čebulni čips",
    slug: "cebulni-cips",
    kategorija: "prigrizki",
    nacin: "posta-in-prevzem",
    velikosti: [["45 g", 1000]],
    kratekOpis: "Hrustljav prigrizek s toplim čebulnim okusom. Tudi kot posip po solati.",
  },
  {
    ime: "Jajca kokošja",
    slug: "jajca-kokosja",
    kategorija: "jajca",
    nacin: "samo-prevzem",
    velikosti: [["10 kos", 300]],
    kratekOpis: "Pakirano po deset. Za vsakodnevno kuho in peko.",
  },
  {
    ime: "Jajca prepeličja",
    slug: "jajca-prepelicja",
    kategorija: "jajca",
    nacin: "samo-prevzem",
    velikosti: [["18 kos", 500]],
    kratekOpis: "Drobna jajca, primerna za predjedi in okrasitev krožnika.",
  },
  {
    ime: "Vložena prepeličja jajca",
    slug: "vlozena-prepelicja-jajca",
    kategorija: "jajca",
    nacin: "samo-prevzem",
    velikosti: [["370 ml", 800]],
    kratekOpis: "Že pripravljena — na krožnik s hladnimi predjedmi ali kot prigrizek.",
  },
  {
    ime: "Liofilizirane jagode, breskve",
    slug: "liofilizirane-jagode-breskve",
    kategorija: "liofilizirano-sadje",
    nacin: "posta-in-prevzem",
    velikosti: [["370 ml (20 g)", 800]],
    kratekOpis: "Sadje brez dodane vode, hrustljavo. Za zajtrk ali pecivo.",
    slike: ["jagode"],
  },
  {
    ime: "Liofilizirane borovnice",
    slug: "liofilizirane-borovnice",
    kategorija: "liofilizirano-sadje",
    nacin: "posta-in-prevzem",
    velikosti: [["370 ml (40 g)", 1300]],
    kratekOpis: "Cel sadež, hrustljav. Za müsli, jogurt in pecivo.",
  },
  {
    ime: "Liofilizirane mix",
    slug: "liofilizirane-mix",
    kategorija: "liofilizirano-sadje",
    nacin: "posta-in-prevzem",
    velikosti: [["370 ml (40 g)", 1300]],
    kratekOpis: "Mešanica več vrst sadja v enem pakiranju.",
  },
  {
    ime: "Liofilizirane maline",
    slug: "liofilizirane-maline",
    kategorija: "liofilizirano-sadje",
    nacin: "posta-in-prevzem",
    velikosti: [["370 ml (20 g)", 800]],
    kratekOpis: "Izrazit malinov okus za sladice in napitke.",
  },
  {
    ime: "Fižol liofiliziran",
    slug: "fizol-liofiliziran",
    kategorija: "liofilizirano-sadje",
    nacin: "posta-in-prevzem",
    velikosti: [["280 g", 1000]],
    kratekOpis: "Hitra priprava: prelijte z vročo vodo in počakajte.",
  },
  {
    ime: "Marmelada borovnica",
    slug: "marmelada-borovnica",
    kategorija: "marmelade-in-vlozeno",
    nacin: "posta-in-prevzem",
    velikosti: [["370 ml", 800]],
    kratekOpis: "Za na kruh, v pecivo ali k sladicam.",
  },
  {
    ime: "Vloženi jurčki",
    slug: "vlozeni-jurcki",
    kategorija: "marmelade-in-vlozeno",
    nacin: "posta-in-prevzem",
    velikosti: [["370 ml", 1200]],
    kratekOpis: "Za predjedi, k mesu ali v testenine.",
  },
  {
    ime: "Testenine s šparglji",
    slug: "testenine-s-sparglji",
    kategorija: "testenine",
    nacin: "posta-in-prevzem",
    velikosti: [["150 g", 500]],
    kratekOpis: "Testenine z nežno špargljevo noto. Lepo se povežejo z maslom.",
    slike: ["testenine"],
  },
  {
    ime: "Bučno olje",
    slug: "bucno-olje",
    kategorija: "olja",
    nacin: "posta-in-prevzem",
    velikosti: [
      ["1 L", 2000],
      ["0,5 L", 1200],
    ],
    kratekOpis: "Za solate in hladne jedi.",
  },
  {
    ime: "Olivno olje",
    slug: "olivno-olje",
    kategorija: "olja",
    nacin: "posta-in-prevzem",
    velikosti: [
      ["1 L", 2000],
      ["0,5 L", 1200],
    ],
    kratekOpis: "Za solate in hladne jedi.",
  },
  {
    ime: "Aronija sok",
    slug: "aronija-sok",
    kategorija: "sokovi",
    nacin: "posta-in-prevzem",
    velikosti: [["1 L", 1000]],
    kratekOpis: "Temen in izrazit sok. Po okusu razredčite z vodo.",
  },
];

/** P12: seed zaloga na velikost. */
export const ZACETNA_ZALOGA = 20;

/** Podatki prodajalca, ki so že znani (nekdanji `src/data/contact.ts`). */
export const PRODAJALEC = {
  naslov: "Podgora 15, 8351 Straža pri Novem mestu",
  telefon: "040 578 512",
  email: "sandi.dercar@gmail.com",
};

export const NAVODILA_ZA_PREVZEM =
  "Naročilo prevzamete na kmetiji: Podgora 15, 8351 Straža pri Novem mestu. Ko je pripravljeno, vas obvestimo po e-pošti; termin prevzema se lahko dogovorimo tudi po telefonu 040 578 512.";

/** Demo darilne škatle (§6, P12: zaloga 20). */
export interface TipSkatleSeed {
  ime: string;
  opis: string;
  steviloMest: number;
  cenaCenti: number;
}

export const TIPI_SKATEL: TipSkatleSeed[] = [
  {
    ime: "Mala darilna škatla",
    opis: "[DEMO] Kartonska škatla za tri izdelke, z lesno volno in kartico za vaše sporočilo.",
    steviloMest: 3,
    cenaCenti: 500,
  },
  {
    ime: "Velika darilna škatla",
    opis: "[DEMO] Večja škatla za šest izdelkov, z lesno volno in kartico za vaše sporočilo.",
    steviloMest: 6,
    cenaCenti: 800,
  },
];

/** Demo programi (§6); vsebina: `[slug izdelka, začetek oznake velikosti, količina]`. */
export interface ProgramSeed {
  ime: string;
  slug: string;
  opis: string;
  tipSkatle: string;
  slika?: KljucSlike;
  vsebina: Array<[string, string, number]>;
}

export const PROGRAMI: ProgramSeed[] = [
  {
    ime: "Okusi Dolenjske",
    slug: "okusi-dolenjske",
    opis: "[DEMO] Mala škatla z domačimi okusi: česen v prahu, šparglji v prahu in borovničeva marmelada.",
    tipSkatle: "Mala darilna škatla",
    slika: "testenine",
    vsebina: [
      ["cesen-v-prahu", "41 ml", 1],
      ["sparglji-v-prahu", "", 1],
      ["marmelada-borovnica", "", 1],
    ],
  },
  {
    ime: "Za kuharje",
    slug: "za-kuharje",
    opis: "[DEMO] Velika škatla za vse, ki radi kuhajo: začimbe v prahu, suhi peteršilj, testenine s šparglji in bučno olje.",
    tipSkatle: "Velika darilna škatla",
    slika: "cesen",
    vsebina: [
      ["cesen-v-prahu", "106 ml", 1],
      ["cebula-v-prahu", "", 1],
      ["paradiznik-v-prahu", "", 1],
      ["suhi-petersilj", "", 1],
      ["testenine-s-sparglji", "", 1],
      ["bucno-olje", "0,5 L", 1],
    ],
  },
];
