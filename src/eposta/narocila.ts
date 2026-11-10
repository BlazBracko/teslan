import { oznakaStopnje } from "../kosarica/cene";
import { formatirajCeno } from "../lib/denar";
import { IME_KMETIJE, type Kontakt } from "../lib/kontakt";
import { OZNAKE_DOSTAVE, OZNAKE_PLACILA, type NarociloPogled } from "../narocila/pogled";
import type { StatusNarocila } from "../narocila/statusi";
import { sestaviSporocilo, type Blok, type Sporocilo, type VrsticaPostavke } from "./predloga";

/**
 * Obvestila o naročilu (Z57), vsako v HTML in besedilni različici:
 *
 * - E1 potrdilo kupcu, E2 novo naročilo prodajalcu (ob oddaji ali plačilu),
 * - E3 pripravljeno za prevzem, E4 poslano, E5 preklicano (ob spremembi
 *   statusa v adminu, `obvestila.ts`).
 *
 * Kupca vikamo. Datoteka je dosegljiva iz konfiguracije Payloada, zato
 * uvaža relativno.
 */

export type { Sporocilo } from "./predloga";

const imeIzdelka = (ime: string, velikost: string | null) => `${ime}${velikost ? `, ${velikost}` : ""}`;

/** Postavke z vsebino darilnih škatel in povzetek zneskov; `sporocila` doda sporočilo na kartici (samo E2, Z54). */
function postavke(n: NarociloPogled, { sporocila = false } = {}): Blok {
  const vrstice: VrsticaPostavke[] = n.postavke.map((p) => ({
    ime: imeIzdelka(p.ime, p.velikost),
    kolicina: p.kolicina,
    znesek: formatirajCeno(p.skupajCenti),
    podrobnosti: p.vsebina.map((v) => `${v.kolicina} × ${imeIzdelka(v.ime, v.velikost)}`),
    sporocilo: sporocila ? p.sporociloNaKartici : null,
  }));
  return {
    vrsta: "postavke",
    postavke: vrstice,
    povzetek: [
      { oznaka: "Vmesni seštevek", znesek: formatirajCeno(n.vmesniSestevekCenti) },
      { oznaka: "Poštnina", znesek: formatirajCeno(n.postninaCenti) },
      { oznaka: "Skupaj", znesek: formatirajCeno(n.skupajCenti), poudarjeno: true },
      ...n.ddv.map((d) => ({
        oznaka: `od tega DDV ${oznakaStopnje(d.stopnja)}`,
        znesek: formatirajCeno(d.ddvCenti),
        podrejeno: true,
      })),
    ],
  };
}

function naslovPaketa(n: NarociloPogled): string | null {
  if (!n.naslov) return null;
  const vrstice = [n.naslov.ulica, `${n.naslov.postnaStevilka} ${n.naslov.kraj}`];
  return (n.darilo && n.prejemnik ? [n.prejemnik.ime, ...vrstice] : vrstice).join("\n");
}

/** Dostava (z naslovom paketa) in plačilo kot vrstice podatkov. */
function dostavaInPlacilo(n: NarociloPogled, { prodajalcu = false } = {}): Array<[string, string]> {
  const naslov = naslovPaketa(n);
  const placano = n.placano ? " (plačano)" : prodajalcu ? " (še ni plačano)" : "";
  return [
    ["Dostava", n.darilo ? `${OZNAKE_DOSTAVE.posta}, darilo na naslov prejemnika` : OZNAKE_DOSTAVE[n.nacinDostave]],
    ...(naslov ? [[n.darilo ? "Naslov prejemnika" : "Naslov za pošiljanje", naslov] as [string, string]] : []),
    ["Plačilo", `${OZNAKE_PLACILA[n.nacinPlacila]}${placano}`],
  ];
}

/** Podpis kmetije s kontaktom (E1, E3–E5). */
function podpis(kontakt: Kontakt): string[] {
  return [
    "Lep pozdrav,",
    IME_KMETIJE,
    ...(kontakt.telefon ? [`Telefon: ${kontakt.telefon}`] : []),
    ...(kontakt.email ? [`E-pošta: ${kontakt.email}`] : []),
  ];
}

const ogledNarocila = (povezava: string): Blok => ({
  vrsta: "gumb",
  oznaka: "Ogled naročila",
  uvod: "Naročilo si lahko kadar koli ogledate na",
  url: povezava,
});

const pozdrav = (n: NarociloPogled): Blok => ({ vrsta: "odstavek", besedilo: `Pozdravljeni, ${n.kupec.ime}!` });

const zadevaKupcu = (besedilo: string) => `${besedilo} — ${IME_KMETIJE}`;

export interface PodatkiZaKupca {
  /** Celoten naslov potrdila naročila z žetonom. */
  povezava: string;
  kontakt: Kontakt;
  navodilaZaPrevzem: string | null;
}

/** E1: potrdilo naročila kupcu. */
export function potrdiloKupcu(n: NarociloPogled, { povezava, navodilaZaPrevzem, kontakt }: PodatkiZaKupca): Sporocilo {
  const prevzem = n.nacinDostave === "prevzem";
  return sestaviSporocilo({
    zadeva: zadevaKupcu(`Potrdilo naročila ${n.stevilka}`),
    predogled: `Prejeli smo vaše naročilo ${n.stevilka} in ga pripravljamo.`,
    naslov: "Hvala za vaše naročilo",
    bloki: [
      pozdrav(n),
      { vrsta: "odstavek", besedilo: `Hvala za vaše naročilo ${n.stevilka}. Prejeli smo ga in ga pripravljamo.` },
      { vrsta: "naslov", besedilo: "Naročili ste" },
      postavke(n),
      {
        vrsta: "podatki",
        vrstice: [
          ["Številka naročila", n.stevilka],
          ...dostavaInPlacilo(n),
          ...(n.opomba ? [["Vaša opomba", n.opomba] as [string, string]] : []),
        ],
      },
      ...(prevzem
        ? ([
            { vrsta: "naslov", besedilo: "Prevzem na kmetiji" },
            {
              vrsta: "odstavek",
              besedilo:
                navodilaZaPrevzem?.trim() ||
                "Ko bo naročilo pripravljeno, vas obvestimo in se dogovorimo za termin prevzema.",
            },
            ...(kontakt.naslov
              ? [{ vrsta: "podatki", vrstice: [["Naslov kmetije", kontakt.naslov]] } satisfies Blok]
              : []),
          ] satisfies Blok[])
        : []),
      ogledNarocila(povezava),
      { vrsta: "poudarek", besedilo: "To ni račun." },
    ],
    noga: podpis(kontakt),
  });
}

/** E2: obvestilo prodajalcu o novem naročilu. */
export function obvestiloProdajalcu(n: NarociloPogled, { povezavaAdmin }: { povezavaAdmin: string }): Sporocilo {
  return sestaviSporocilo({
    zadeva: `Novo naročilo ${n.stevilka}: ${n.kupec.ime} ${n.kupec.priimek}, ${formatirajCeno(n.skupajCenti)}`,
    predogled: `${n.kupec.ime} ${n.kupec.priimek}, ${OZNAKE_DOSTAVE[n.nacinDostave].toLowerCase()}, ${formatirajCeno(n.skupajCenti)}`,
    naslov: `Novo naročilo ${n.stevilka}`,
    bloki: [
      { vrsta: "odstavek", besedilo: `Novo naročilo ${n.stevilka} na spletni strani.` },
      ...(n.darilo
        ? [{ vrsta: "poudarek", ton: "opozorilo", besedilo: "DARILO – potrdila in cen ne prilagajte paketu." } satisfies Blok]
        : []),
      {
        vrsta: "podatki",
        vrstice: [
          ["Kupec", `${n.kupec.ime} ${n.kupec.priimek}`],
          ["E-pošta", n.kupec.email],
          ["Telefon", n.kupec.telefon],
          ...dostavaInPlacilo(n, { prodajalcu: true }),
          ...(n.opomba ? [["Opomba kupca", n.opomba] as [string, string]] : []),
        ],
      },
      { vrsta: "naslov", besedilo: "Postavke" },
      postavke(n, { sporocila: true }),
      { vrsta: "gumb", oznaka: "Odpri v adminu", url: povezavaAdmin },
    ],
    noga: ["Sporočilo je poslala spletna trgovina. Odgovor na to sporočilo gre kupcu."],
  });
}

/** E3: naročilo je pripravljeno za prevzem (naslov, pot, telefon). */
export function pripravljenoZaPrevzem(
  n: NarociloPogled,
  { povezava, navodilaZaPrevzem, kontakt }: PodatkiZaKupca,
): Sporocilo {
  const placilo =
    n.nacinPlacila === "ob-prevzemu" && !n.placano
      ? `Ob prevzemu plačate ${formatirajCeno(n.skupajCenti)}.`
      : null;
  return sestaviSporocilo({
    zadeva: zadevaKupcu(`Naročilo ${n.stevilka} je pripravljeno za prevzem`),
    predogled: "Naročilo vas čaka na kmetiji.",
    naslov: "Naročilo je pripravljeno za prevzem",
    bloki: [
      pozdrav(n),
      { vrsta: "odstavek", besedilo: `Vaše naročilo ${n.stevilka} je pripravljeno. Prevzamete ga lahko na kmetiji.` },
      ...(navodilaZaPrevzem?.trim() ? [{ vrsta: "odstavek", besedilo: navodilaZaPrevzem.trim() } satisfies Blok] : []),
      {
        vrsta: "podatki",
        vrstice: [
          ...(kontakt.naslov ? [["Naslov kmetije", kontakt.naslov] as [string, string]] : []),
          ...(kontakt.telefon ? [["Telefon", kontakt.telefon] as [string, string]] : []),
        ],
      },
      ...(kontakt.pot
        ? [{ vrsta: "gumb", oznaka: "Pot do kmetije", uvod: "Pot do kmetije (Google Maps)", url: kontakt.pot } satisfies Blok]
        : []),
      ...(placilo ? [{ vrsta: "poudarek", besedilo: placilo } satisfies Blok] : []),
      ...(kontakt.telefon
        ? [{ vrsta: "odstavek", besedilo: "Pred prihodom nas, prosimo, pokličite, da se dogovorimo za uro." } satisfies Blok]
        : []),
      ogledNarocila(povezava),
    ],
    noga: podpis(kontakt),
  });
}

/** E4: naročilo je poslano (s številko pošiljke, če je vpisana). */
export function poslano(n: NarociloPogled, { povezava, kontakt }: Omit<PodatkiZaKupca, "navodilaZaPrevzem">): Sporocilo {
  const naslov = naslovPaketa(n);
  return sestaviSporocilo({
    zadeva: zadevaKupcu(`Naročilo ${n.stevilka} je poslano`),
    predogled: n.stevilkaPosiljke ? `Številka pošiljke: ${n.stevilkaPosiljke}` : "Paket je na poti.",
    naslov: "Naročilo je na poti",
    bloki: [
      pozdrav(n),
      {
        vrsta: "odstavek",
        besedilo: n.darilo
          ? `Vaše naročilo ${n.stevilka} smo poslali po pošti na naslov prejemnika darila.`
          : `Vaše naročilo ${n.stevilka} smo poslali po pošti.`,
      },
      {
        vrsta: "podatki",
        vrstice: [
          ...(naslov ? [[n.darilo ? "Naslov prejemnika" : "Naslov", naslov] as [string, string]] : []),
          ...(n.stevilkaPosiljke ? [["Številka pošiljke", n.stevilkaPosiljke] as [string, string]] : []),
        ],
      },
      ...(n.stevilkaPosiljke
        ? [
            {
              vrsta: "odstavek",
              besedilo: "Pošiljko lahko spremljate s številko pošiljke na spletni strani Pošte Slovenije.",
            } satisfies Blok,
          ]
        : []),
      ogledNarocila(povezava),
    ],
    noga: podpis(kontakt),
  });
}

export const BESEDILO_VRACILA = "Znesek vrnemo na kartico v nekaj delovnih dneh.";

/** E5: naročilo je preklicano (pri plačanem s kartico z obvestilom o vračilu). */
export function preklicano(
  n: NarociloPogled,
  { povezava, kontakt }: Omit<PodatkiZaKupca, "navodilaZaPrevzem">,
): Sporocilo {
  const vracilo = n.nacinPlacila === "kartica" && n.placano;
  return sestaviSporocilo({
    zadeva: zadevaKupcu(`Naročilo ${n.stevilka} je preklicano`),
    predogled: vracilo ? BESEDILO_VRACILA : `Naročilo ${n.stevilka} je preklicano.`,
    naslov: "Naročilo je preklicano",
    bloki: [
      pozdrav(n),
      { vrsta: "odstavek", besedilo: `Vaše naročilo ${n.stevilka} smo preklicali.` },
      ...(n.razlogPreklica ? [{ vrsta: "podatki", vrstice: [["Razlog", n.razlogPreklica]] } satisfies Blok] : []),
      ...(vracilo ? [{ vrsta: "poudarek", besedilo: BESEDILO_VRACILA } satisfies Blok] : []),
      {
        vrsta: "odstavek",
        besedilo: kontakt.telefon
          ? `Če imate vprašanja, odgovorite na to sporočilo ali nas pokličite na ${kontakt.telefon}.`
          : "Če imate vprašanja, odgovorite na to sporočilo.",
      },
      ogledNarocila(povezava),
    ],
    noga: podpis(kontakt),
  });
}

/**
 * Obvestilo kupcu ob spremembi statusa v adminu ali `null`, ko ga ni:
 * „Pripravljeno za prevzem“ → E3, „Poslano“ → E4, „Preklicano“ → E5.
 * Preklic naročila, ki je še čakalo na plačilo s kartico, ne pošlje ničesar:
 * kupec potrdila (E1) ni dobil, naročilo zanj ni nastalo (Z41).
 */
export function obvestiloObStatusu(
  od: StatusNarocila,
  na: StatusNarocila,
  n: NarociloPogled,
  podatki: PodatkiZaKupca,
): { oznaka: string; sporocilo: Sporocilo } | null {
  if (od === na) return null;
  switch (na) {
    case "pripravljeno":
      return { oznaka: "E3 pripravljeno za prevzem", sporocilo: pripravljenoZaPrevzem(n, podatki) };
    case "poslano":
      return { oznaka: "E4 poslano", sporocilo: poslano(n, podatki) };
    case "preklicano":
      return od === "caka-placilo" ? null : { oznaka: "E5 preklicano", sporocilo: preklicano(n, podatki) };
    default:
      return null;
  }
}
