import type { ProgramPogled, TipSkatlePogled } from "@/darila/pogled";
import { primerenZaDarilo, STOPNJA_DDV_SKATLE, zasedenaMesta } from "@/darila/pravila";
import type { IzdelekPogled, SlikaPogled } from "@/katalog/podatki";
import { razpolozljivostVelikosti, steviloKosov, type NacinProdaje } from "@/katalog/razpolozljivost";
import { oznakaSezone, type Mesec } from "@/katalog/sezona";
import { SKATLO, stevilo } from "@/lib/sklanjanje";
import {
  doBrezplacnePostnine,
  izracunajPostnino,
  izracunajZnesek,
  type DDVPoStopnji,
  type NastavitvePostnine,
  type PostavkaZaZnesek,
} from "./cene";
import { pravilaDostave, type PravilaDostave } from "./dostava";
import {
  jeSkatla,
  kljucPostavke,
  NAJVEC_KOSOV,
  type PostavkaIzdelka,
  type PostavkaKosarice,
  type PostavkaSkatle,
} from "./postavke";

/**
 * Strežniško preverjanje košarice (Z21): iz id-jev in količin, ki jih hrani
 * brskalnik, in iz trenutnega kataloga izračuna imena, cene, zalogo in
 * težave. Funkcija je čista (katalog, darila, nastavitve in mesec dobi kot
 * argumente), da jo blagajna in oddaja naročila ponovno uporabita in da je
 * preizkušena brez baze.
 *
 * Darilna škatla (K10, Z53, P7, P8) je ena postavka: tip škatle (DDV 22 %)
 * in vsebina z lastnimi cenami in stopnjami DDV. Ista velikost izdelka je
 * lahko v košarici samostojno in v več škatlah, zato se zaloga deli med
 * postavke po vrsti, kot so v košarici.
 */

export type VrstaTezave =
  /** Postavke ni mogoče naročiti: treba jo je odstraniti (ali škatlo urediti). */
  | "nedosegljivo"
  /** Naročenih je več kosov, kot jih je na zalogi: količino je treba zmanjšati. */
  | "kolicina";

export interface Tezava {
  vrsta: VrstaTezave;
  razlog: string;
  /** Pri `kolicina`: največja količina, ki jo je še mogoče naročiti. */
  najvecKosov?: number;
}

export interface PostavkaIzdelkaPregled {
  vrsta: "izdelek";
  kljuc: string;
  izdelekId: number;
  velikostId: string;
  kolicina: number;
  /** Ni ga, če izdelka ni več v katalogu. */
  izdelek: {
    ime: string;
    slug: string;
    slika: SlikaPogled | null;
    nacinProdaje: NacinProdaje;
  } | null;
  velikost: string | null;
  cenaCenti: number | null;
  stopnjaDDV: number | null;
  /** Največ kosov, ki jih je mogoče nastaviti (zaloga, a največ 20). */
  najvecKosov: number;
  skupajCenti: number | null;
  tezava: Tezava | null;
}

export interface KosVsebinePregled {
  izdelekId: number;
  velikostId: string;
  kolicina: number;
  /** `null`, če izdelka ni več v katalogu. */
  ime: string | null;
  slug: string | null;
  velikost: string | null;
  cenaCenti: number | null;
  stopnjaDDV: number | null;
  /** Zakaj tega izdelka ni več mogoče dati v škatlo. */
  tezava: string | null;
}

export interface PostavkaSkatlePregled {
  vrsta: "skatla";
  kljuc: string;
  id: string;
  /** Število enakih škatel. */
  kolicina: number;
  tipSkatleId: number;
  tipSkatle: { ime: string; steviloMest: number; slika: SlikaPogled | null } | null;
  /** Program, iz katerega je škatla nastala (samo za ime). */
  program: { slug: string; ime: string } | null;
  /** Cena prazne škatle (DDV 22 %). */
  cenaCenti: number | null;
  stopnjaDDV: number;
  vsebina: KosVsebinePregled[];
  sporocilo: string | null;
  /** Cena ene škatle z vsebino. */
  cenaSkatleCenti: number | null;
  najvecKosov: number;
  skupajCenti: number | null;
  tezava: Tezava | null;
}

export type PostavkaPregled = PostavkaIzdelkaPregled | PostavkaSkatlePregled;

export interface PregledKosarice {
  postavke: PostavkaPregled[];
  /** Kosi v postavkah brez težav (škatla šteje kot en kos). */
  steviloKosov: number;
  /** Vsota postavk brez težav. */
  vmesniSestevekCenti: number;
  /** DDV, vključen v vmesni seštevek, po stopnjah (brez poštnine). */
  ddv: DDVPoStopnji[];
  dostava: PravilaDostave & {
    /** Poštnina, če bi kupec izbral pošto. */
    postninaCenti: number;
    pragBrezplacnePostnineCenti: number;
    doBrezplacnePostnineCenti: number;
  };
  /** V košarici je darilna škatla (na blagajni možnost naslova prejemnika, Z55). */
  imaSkatlo: boolean;
  imaTezave: boolean;
  trgovinaOdprta: boolean;
  /** Ali sme kupec nadaljevati na blagajno. */
  lahkoNaBlagajno: boolean;
}

export interface DarilaZaPreverjanje {
  tipi: readonly TipSkatlePogled[];
  programi?: readonly Pick<ProgramPogled, "slug" | "ime">[];
}

function razlogNedosegljivosti(izdelek: IzdelekPogled, vrsta: string): string {
  switch (vrsta) {
    case "na-kmetiji":
      return "Tega izdelka ni mogoče naročiti prek spleta.";
    case "kmalu":
      return "Sezona tega izdelka se še ni začela.";
    case "izven-sezone":
      return izdelek.sezona
        ? `Izdelek ta čas ni v sezoni (${oznakaSezone(izdelek.sezona).toLowerCase()}).`
        : "Izdelek ta čas ni v sezoni.";
    default:
      return "Izdelka ni več na zalogi.";
  }
}

const naZalogi = (n: number) =>
  `Na zalogi ${n === 1 ? "je" : n === 2 ? "sta" : "so"} samo še ${steviloKosov(n)}.`;

/** Koliko kosov posamezne velikosti in škatel so porabile prejšnje postavke. */
class Poraba {
  private velikosti = new Map<string, number>();
  private skatle = new Map<number, number>();
  velikost = (id: string) => this.velikosti.get(id) ?? 0;
  skatla = (id: number) => this.skatle.get(id) ?? 0;
  porabiVelikost(id: string, n: number) {
    this.velikosti.set(id, this.velikost(id) + n);
  }
  porabiSkatlo(id: number, n: number) {
    this.skatle.set(id, this.skatla(id) + n);
  }
}

function preveriPostavko(
  p: PostavkaIzdelka,
  izdelki: Map<number, IzdelekPogled>,
  mesec: Mesec,
  poraba: Poraba,
): PostavkaIzdelkaPregled {
  const osnova = {
    vrsta: "izdelek" as const,
    kljuc: kljucPostavke(p),
    izdelekId: p.izdelekId,
    velikostId: p.velikostId,
    kolicina: p.kolicina,
  };
  const izdelek = izdelki.get(p.izdelekId);
  if (!izdelek) {
    return {
      ...osnova,
      izdelek: null,
      velikost: null,
      cenaCenti: null,
      stopnjaDDV: null,
      najvecKosov: p.kolicina,
      skupajCenti: null,
      tezava: { vrsta: "nedosegljivo", razlog: "Izdelka ni več v ponudbi." },
    };
  }

  const podatkiIzdelka = {
    ime: izdelek.ime,
    slug: izdelek.slug,
    slika: izdelek.slike[0] ?? null,
    nacinProdaje: izdelek.nacinProdaje,
  };
  const velikost = izdelek.velikosti.find((v) => v.id === p.velikostId);
  if (!velikost) {
    return {
      ...osnova,
      izdelek: podatkiIzdelka,
      velikost: null,
      cenaCenti: null,
      stopnjaDDV: izdelek.stopnjaDDV,
      najvecKosov: p.kolicina,
      skupajCenti: null,
      tezava: { vrsta: "nedosegljivo", razlog: "Te velikosti ni več v ponudbi." },
    };
  }

  const razpolozljivost = razpolozljivostVelikosti(izdelek, velikost, mesec);
  const narocljiva = razpolozljivost.narocljiva && velikost.cenaCenti != null;
  const zaloga = velikost.zaloga ?? 0;
  // Del zaloge so morda že porabile prejšnje postavke (npr. ista velikost v škatli).
  const preostanek = Math.max(0, zaloga - poraba.velikost(velikost.id));
  const najvecKosov = Math.min(preostanek, NAJVEC_KOSOV);
  let tezava: Tezava | null = null;
  if (!narocljiva) {
    tezava = { vrsta: "nedosegljivo", razlog: razlogNedosegljivosti(izdelek, razpolozljivost.vrsta) };
  } else if (preostanek === 0) {
    tezava = {
      vrsta: "nedosegljivo",
      razlog: "Vse kose, ki so na zalogi, ste že dali v darilno škatlo v košarici.",
    };
  } else if (p.kolicina > preostanek) {
    tezava = {
      vrsta: "kolicina",
      razlog:
        preostanek < zaloga
          ? `${naZalogi(zaloga)} Del jih je že v darilni škatli v košarici.`
          : naZalogi(zaloga),
      najvecKosov,
    };
  }
  if (narocljiva) poraba.porabiVelikost(velikost.id, Math.min(p.kolicina, preostanek));
  const cenaCenti = velikost.cenaCenti;
  return {
    ...osnova,
    izdelek: podatkiIzdelka,
    velikost: velikost.oznaka,
    cenaCenti: narocljiva ? cenaCenti : null,
    stopnjaDDV: izdelek.stopnjaDDV,
    najvecKosov: narocljiva ? Math.max(najvecKosov, 1) : p.kolicina,
    skupajCenti: narocljiva && cenaCenti != null ? cenaCenti * p.kolicina : null,
    tezava,
  };
}

/** Kos vsebine škatle: ali je izdelek še primeren, v ponudbi, v sezoni in na zalogi. */
function preveriKosVsebine(
  v: PostavkaSkatle["vsebina"][number],
  izdelki: Map<number, IzdelekPogled>,
  mesec: Mesec,
): KosVsebinePregled & { zaloga: number } {
  const osnova = { izdelekId: v.izdelekId, velikostId: v.velikostId, kolicina: v.kolicina };
  const izdelek = izdelki.get(v.izdelekId);
  if (!izdelek) {
    return {
      ...osnova,
      ime: null,
      slug: null,
      velikost: null,
      cenaCenti: null,
      stopnjaDDV: null,
      tezava: "Izdelka ni več v ponudbi.",
      zaloga: 0,
    };
  }
  const velikost = izdelek.velikosti.find((x) => x.id === v.velikostId);
  let tezava: string | null = null;
  if (!primerenZaDarilo(izdelek)) tezava = "Izdelka ni več mogoče dati v darilno škatlo.";
  else if (!velikost) tezava = "Te velikosti ni več v ponudbi.";
  else {
    const r = razpolozljivostVelikosti(izdelek, velikost, mesec);
    if (!r.narocljiva || velikost.cenaCenti == null) tezava = razlogNedosegljivosti(izdelek, r.vrsta);
  }
  return {
    ...osnova,
    ime: izdelek.ime,
    slug: izdelek.slug,
    velikost: velikost?.oznaka ?? null,
    cenaCenti: tezava ? null : (velikost?.cenaCenti ?? null),
    stopnjaDDV: izdelek.stopnjaDDV,
    tezava,
    zaloga: velikost?.zaloga ?? 0,
  };
}

function preveriSkatlo(
  p: PostavkaSkatle,
  izdelki: Map<number, IzdelekPogled>,
  tipi: Map<number, TipSkatlePogled>,
  programi: Map<string, string>,
  mesec: Mesec,
  poraba: Poraba,
): PostavkaSkatlePregled {
  const tip = tipi.get(p.tipSkatleId);
  const program = p.program && programi.has(p.program) ? { slug: p.program, ime: programi.get(p.program)! } : null;
  const vsebinaZZalogo = p.vsebina.map((v) => preveriKosVsebine(v, izdelki, mesec));
  const vsebina: KosVsebinePregled[] = vsebinaZZalogo.map((v) => ({
    izdelekId: v.izdelekId,
    velikostId: v.velikostId,
    kolicina: v.kolicina,
    ime: v.ime,
    slug: v.slug,
    velikost: v.velikost,
    cenaCenti: v.cenaCenti,
    stopnjaDDV: v.stopnjaDDV,
    tezava: v.tezava,
  }));
  const osnova = {
    vrsta: "skatla" as const,
    kljuc: kljucPostavke(p),
    id: p.id,
    kolicina: p.kolicina,
    tipSkatleId: p.tipSkatleId,
    tipSkatle: tip ? { ime: tip.ime, steviloMest: tip.steviloMest, slika: tip.slika } : null,
    program,
    stopnjaDDV: STOPNJA_DDV_SKATLE,
    vsebina,
    sporocilo: p.sporocilo?.trim() || null,
  };
  const nedosegljivo = (razlog: string): PostavkaSkatlePregled => ({
    ...osnova,
    cenaCenti: tip?.cenaCenti ?? null,
    cenaSkatleCenti: null,
    najvecKosov: p.kolicina,
    skupajCenti: null,
    tezava: { vrsta: "nedosegljivo", razlog },
  });

  if (!tip || !tip.aktiven) return nedosegljivo("Te darilne škatle ni več v ponudbi.");
  const slaba = vsebinaZZalogo.filter((v) => v.tezava);
  if (slaba.length > 0) {
    return nedosegljivo(
      `${slaba.map((v) => v.ime ?? "Izdelka").join(", ")} ni več mogoče naročiti. Uredite škatlo ali jo odstranite.`,
    );
  }
  if (zasedenaMesta(p.vsebina) > tip.steviloMest) {
    return nedosegljivo("V škatli je več izdelkov, kot ima mest. Uredite škatlo.");
  }

  // Zaloga: škatla in vsak izdelek v njej, za vse enake škatle (P8).
  const preostanekSkatel = Math.max(0, tip.zaloga - poraba.skatla(tip.id));
  const zaVsebino = vsebinaZZalogo.map((v) => ({
    ime: v.ime ?? "",
    najvec: Math.floor(Math.max(0, v.zaloga - poraba.velikost(v.velikostId)) / v.kolicina),
  }));
  const najvec = Math.min(NAJVEC_KOSOV, preostanekSkatel, ...zaVsebino.map((v) => v.najvec));
  if (najvec === 0) {
    const manjka = zaVsebino.filter((v) => v.najvec === 0).map((v) => v.ime);
    return nedosegljivo(
      preostanekSkatel === 0
        ? "Te darilne škatle ni več na zalogi."
        : `${manjka.join(", ")} ni več dovolj na zalogi za to škatlo. Uredite škatlo ali jo odstranite.`,
    );
  }
  const tezava: Tezava | null =
    p.kolicina > najvec
      ? { vrsta: "kolicina", razlog: `Na zalogi je dovolj samo za ${stevilo(najvec, SKATLO)}.`, najvecKosov: najvec }
      : null;
  const porabljenih = Math.min(p.kolicina, najvec);
  poraba.porabiSkatlo(tip.id, porabljenih);
  for (const v of p.vsebina) poraba.porabiVelikost(v.velikostId, v.kolicina * porabljenih);

  const cenaSkatleCenti = tip.cenaCenti + vsebina.reduce((s, v) => s + (v.cenaCenti as number) * v.kolicina, 0);
  return {
    ...osnova,
    cenaCenti: tip.cenaCenti,
    cenaSkatleCenti,
    najvecKosov: najvec,
    skupajCenti: cenaSkatleCenti * p.kolicina,
    tezava,
  };
}

/**
 * Postavke za izračun zneska (Z24): škatla je cena škatle po 22 % in vsak
 * izdelek v njej po svoji stopnji, pomnoženo s številom enakih škatel.
 * Postavke s težavo se ne štejejo.
 */
export function postavkeZaZnesek(postavke: readonly PostavkaPregled[]): PostavkaZaZnesek[] {
  return postavke.flatMap((p): PostavkaZaZnesek[] => {
    if (p.tezava !== null || p.cenaCenti == null) return [];
    if (p.vrsta === "izdelek") {
      return p.stopnjaDDV == null ? [] : [{ cenaCenti: p.cenaCenti, kolicina: p.kolicina, stopnjaDDV: p.stopnjaDDV }];
    }
    return [
      { cenaCenti: p.cenaCenti, kolicina: p.kolicina, stopnjaDDV: p.stopnjaDDV },
      ...p.vsebina.map((v) => ({
        cenaCenti: v.cenaCenti as number,
        kolicina: v.kolicina * p.kolicina,
        stopnjaDDV: v.stopnjaDDV as number,
      })),
    ];
  });
}

/** Ime postavke za kupca: „Česen v prahu, 41 ml“, „Mala darilna škatla: Okusi Dolenjske“. */
export function imePostavke(p: PostavkaPregled): string {
  if (p.vrsta === "skatla") {
    const tip = p.tipSkatle?.ime ?? "Darilna škatla";
    return p.program ? `${tip}: ${p.program.ime}` : tip;
  }
  const ime = p.izdelek?.ime ?? "Izdelek, ki ga ni več v ponudbi";
  return p.velikost ? `${ime}, ${p.velikost}` : ime;
}

export function preveriKosarico(
  kosarica: readonly PostavkaKosarice[],
  izdelki: readonly IzdelekPogled[],
  nastavitve: NastavitvePostnine & { trgovinaOdprta: boolean },
  mesec: Mesec,
  darila: DarilaZaPreverjanje = { tipi: [] },
): PregledKosarice {
  const poId = new Map(izdelki.map((i) => [i.id, i]));
  const tipi = new Map(darila.tipi.map((t) => [t.id, t]));
  const programi = new Map((darila.programi ?? []).map((p) => [p.slug, p.ime]));
  const poraba = new Poraba();
  const postavke = kosarica.map((p) =>
    jeSkatla(p) ? preveriSkatlo(p, poId, tipi, programi, mesec, poraba) : preveriPostavko(p, poId, mesec, poraba),
  );

  const brezTezav = postavke.filter((p) => p.tezava === null);
  const znesek = izracunajZnesek(postavkeZaZnesek(postavke), "prevzem", nastavitve);
  // Pravila dostave štejejo vse izdelke, ki bodo ostali v košarici (tudi
  // tiste, ki jim je treba le zmanjšati količino). Škatle so vedno primerne
  // za pošto (P6).
  const pravila = pravilaDostave(
    postavke.flatMap((p) =>
      p.vrsta === "izdelek" && p.izdelek && p.tezava?.vrsta !== "nedosegljivo"
        ? [{ ime: p.izdelek.ime, nacinProdaje: p.izdelek.nacinProdaje }]
        : [],
    ),
  );
  const imaTezave = postavke.some((p) => p.tezava !== null);
  const trgovinaOdprta = nastavitve.trgovinaOdprta;

  return {
    postavke,
    steviloKosov: brezTezav.reduce((vsota, p) => vsota + p.kolicina, 0),
    vmesniSestevekCenti: znesek.vmesniSestevekCenti,
    ddv: znesek.ddv,
    dostava: {
      ...pravila,
      postninaCenti: izracunajPostnino("posta", znesek.vmesniSestevekCenti, nastavitve),
      pragBrezplacnePostnineCenti: nastavitve.pragBrezplacnePostnineCenti,
      doBrezplacnePostnineCenti: doBrezplacnePostnine(znesek.vmesniSestevekCenti, nastavitve),
    },
    imaSkatlo: postavke.some((p) => p.vrsta === "skatla" && p.tezava?.vrsta !== "nedosegljivo"),
    imaTezave,
    trgovinaOdprta,
    lahkoNaBlagajno: trgovinaOdprta && brezTezav.length > 0 && !imaTezave,
  };
}
