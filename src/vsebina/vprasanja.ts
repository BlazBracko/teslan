import { formatirajCeno } from "../lib/denar";

/**
 * Pogosta vprašanja kupcev (stran `/vprasanja`, izbor na domači strani).
 *
 * OSNUTEK ZA LASTNIKOV PREGLED: besedila je napisal agent po pravilih
 * trgovine iz načrta (dostava, plačilo, darila) in po splošnih pogojih.
 * Lastnik naj jih prebere in popravi, kar ne drži (posebej roke pošiljanja
 * in nasvete za shranjevanje); seznam je v `docs/nacrti/spletna-trgovina-predaja.md`.
 *
 * Zneski in kontakti niso zapisani v besedilu, ampak pridejo iz nastavitev
 * trgovine, da se odgovori ne razidejo z blagajno.
 */

export interface PodatkiZaVprasanja {
  postninaCenti: number;
  pragBrezplacnePostnineCenti: number;
  telefon: string | null;
  email: string | null;
  naslov: string | null;
}

export interface Vprasanje {
  id: string;
  vprasanje: string;
  /** Odstavki odgovora (golo besedilo, tudi za JSON-LD `FAQPage`). */
  odgovor: string[];
  povezava?: { href: string; oznaka: string };
  /** Pokaže se tudi v izboru na domači strani. */
  izpostavljeno?: boolean;
}

export interface SklopVprasanj {
  id: string;
  naslov: string;
  vprasanja: Vprasanje[];
}

export function pogostaVprasanja(p: PodatkiZaVprasanja): SklopVprasanj[] {
  const postnina = formatirajCeno(p.postninaCenti);
  const prag = formatirajCeno(p.pragBrezplacnePostnineCenti);
  const klic = p.telefon ? ` na ${p.telefon}` : "";
  const kontakt = [p.telefon && `pokličite ${p.telefon}`, p.email && `pišite na ${p.email}`]
    .filter(Boolean)
    .join(" ali ");

  return [
    {
      id: "narocilo",
      naslov: "Naročilo",
      vprasanja: [
        {
          id: "kako-narocim",
          vprasanje: "Kako naročim?",
          izpostavljeno: true,
          odgovor: [
            "Izdelke dodate v košarico, na blagajni vpišete kontaktne podatke ter izberete dostavo in plačilo. Uporabniškega računa ne potrebujete.",
            "Po oddaji se odpre potrdilo naročila, enako potrdilo pošljemo na vaš e-naslov.",
          ],
        },
        {
          id: "narocilo-po-telefonu",
          vprasanje: "Ali lahko naročim tudi po telefonu?",
          odgovor: [
            `Da. Pokličite nas${klic}, naročilo zapišemo in se dogovorimo za prevzem na kmetiji.`,
          ],
        },
        {
          id: "potrdilo",
          vprasanje: "Kako vem, da je naročilo sprejeto?",
          odgovor: [
            "Takoj po oddaji vidite stran s številko naročila, potrdilo pa pošljemo tudi na e-naslov, ki ste ga vpisali.",
            "Če ga v nekaj minutah ni, poglejte med vsiljeno pošto ali nas pokličite.",
          ],
        },
        {
          id: "sprememba",
          vprasanje: "Ali lahko naročilo spremenim ali prekličem?",
          odgovor: [
            `Javite nam čim prej${kontakt ? `: ${kontakt}` : ""}. Dokler naročila nismo pripravili oziroma paketa oddali na pošto, ga lahko spremenimo ali prekličemo.`,
          ],
        },
      ],
    },
    {
      id: "dostava",
      naslov: "Dostava in prevzem",
      vprasanja: [
        {
          id: "postnina",
          vprasanje: "Koliko stane poštnina?",
          izpostavljeno: true,
          odgovor: [
            `Poštnina za pošiljko po Sloveniji je ${postnina}. Pri naročilu nad ${prag} je brezplačna. Prevzem na kmetiji je vedno brezplačen.`,
          ],
          povezava: { href: "/dostava", oznaka: "Več o dostavi in plačilu" },
        },
        {
          id: "kdaj-paket",
          vprasanje: "Kdaj prejmem paket?",
          odgovor: [
            "Paket oddamo na pošto praviloma v nekaj delovnih dneh po prejemu naročila. Ko ga oddamo, vam pošljemo e-pošto; pošta ga običajno dostavi naslednji delovni dan.",
            "Pred prazniki je naročil več, zato darila naročite pravočasno.",
          ],
        },
        {
          id: "samo-prevzem",
          vprasanje: "Zakaj nekaterih izdelkov ne pošiljate po pošti?",
          izpostavljeno: true,
          odgovor: [
            "Jajca in sveža zelenjava so občutljivi in na poti izgubijo svežino, zato jih prodajamo samo s prevzemom na kmetiji. Taki izdelki imajo oznako »Samo prevzem na kmetiji«.",
            "Če je v košarici tak izdelek, celotno naročilo prevzamete na kmetiji. Če želite ostale izdelke prejeti po pošti, jih naročite posebej.",
          ],
        },
        {
          id: "prevzem",
          vprasanje: "Kako poteka prevzem na kmetiji?",
          odgovor: [
            "Ko je naročilo pripravljeno, vas obvestimo po e-pošti. Termin prevzema se dogovorimo po telefonu ali ga zapišete v opombo ob naročilu.",
            ...(p.naslov ? [`Prevzamete ga na naslovu ${p.naslov}.`] : []),
          ],
        },
        {
          id: "tujina",
          vprasanje: "Ali pošiljate v tujino?",
          odgovor: ["Za zdaj pošiljamo samo na naslove v Sloveniji."],
        },
      ],
    },
    {
      id: "placilo",
      naslov: "Plačilo",
      vprasanja: [
        {
          id: "nacini-placila",
          vprasanje: "Kako lahko plačam?",
          izpostavljeno: true,
          odgovor: [
            "Pošiljko po pošti plačate s kartico (tudi Apple Pay in Google Pay) na varni strani ponudnika plačil Stripe.",
            "Pri prevzemu na kmetiji lahko plačate s kartico ob naročilu ali ob prevzemu.",
          ],
        },
        {
          id: "varnost-kartice",
          vprasanje: "Ali je plačilo s kartico varno?",
          odgovor: [
            "Da. Podatke o kartici vpišete neposredno pri ponudniku plačil Stripe; mi jih ne vidimo in ne hranimo.",
          ],
        },
      ],
    },
    {
      id: "darila",
      naslov: "Darila",
      vprasanja: [
        {
          id: "darilo-prejemniku",
          vprasanje: "Ali lahko darilo pošljete neposredno obdarovancu?",
          odgovor: [
            "Da. Ko je v košarici darilna škatla in izberete pošiljanje po pošti, na blagajni označite »Pošlji na naslov prejemnika«. V paketu ni cen, potrdilo naročila dobite samo vi.",
          ],
        },
        {
          id: "sporocilo",
          vprasanje: "Ali lahko dodam osebno sporočilo?",
          odgovor: [
            "Da. Ko sestavljate darilo, vpišete sporočilo (do 300 znakov), ki ga napišemo na kartico in priložimo v škatlo.",
          ],
          povezava: { href: "/darila", oznaka: "Na darila" },
        },
        {
          id: "poslovna-darila",
          vprasanje: "Ali pripravljate tudi poslovna darila?",
          odgovor: [
            `Da. Za več škatel hkrati nas ${kontakt || "pokličite"}, pripravimo ponudbo z vsebino in sporočilom po vaši želji.`,
          ],
        },
      ],
    },
    {
      id: "izdelki",
      naslov: "Izdelki",
      vprasanja: [
        {
          id: "shranjevanje",
          vprasanje: "Kako shranjujem izdelke?",
          odgovor: [
            "Začimbe v prahu, liofilizirano sadje in testenine hranite dobro zaprte v suhem in temnem prostoru.",
            "Marmelade, vložnine in sokove po odprtju hranite v hladilniku. Rok uporabe je zapisan na embalaži.",
          ],
        },
        {
          id: "liofilizirano",
          vprasanje: "Kaj je liofilizirano sadje?",
          odgovor: [
            "Sadje, ki mu z zamrzovanjem in sušenjem v vakuumu odvzamemo vodo. Ostane hrustljavo ter ohrani barvo in okus, zato je priročno za prigrizek, kosmiče in peko.",
          ],
        },
        {
          id: "sveze",
          vprasanje: "Kdaj so na voljo sveži pridelki?",
          odgovor: [
            "Sveži pridelki so na voljo v sezoni: šparglji spomladi, jagode v začetku poletja, česen in krompir jeseni. Točne mesece vidite pri posameznem izdelku.",
            "Prodajamo jih na kmetiji; pred obiskom nas pokličite, da vam jih pripravimo.",
          ],
        },
        {
          id: "vracilo",
          vprasanje: "Ali lahko izdelek vrnem?",
          odgovor: [
            "Pri nakupu na spletu lahko v 14 dneh odstopite od pogodbe. Izjeme so hitro pokvarljiva živila in darilne škatle, sestavljene po vaših željah.",
          ],
          povezava: { href: "/odstop", oznaka: "Odstop od pogodbe" },
        },
      ],
    },
  ];
}

export function izpostavljenaVprasanja(sklopi: readonly SklopVprasanj[]): Vprasanje[] {
  return sklopi.flatMap((s) => s.vprasanja).filter((v) => v.izpostavljeno);
}

/** JSON-LD `FAQPage` za stran s pogostimi vprašanji. */
export function vprasanjaJsonLd(sklopi: readonly SklopVprasanj[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sklopi
      .flatMap((s) => s.vprasanja)
      .map((v) => ({
        "@type": "Question",
        name: v.vprasanje,
        acceptedAnswer: { "@type": "Answer", text: v.odgovor.join(" ") },
      })),
  };
}
