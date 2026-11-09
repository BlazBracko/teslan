import type { IzdelekPogled, SlikaPogled } from "@/katalog/podatki";
import { razpolozljivostVelikosti, steviloKosov, type NacinProdaje } from "@/katalog/razpolozljivost";
import { oznakaSezone, type Mesec } from "@/katalog/sezona";
import {
  doBrezplacnePostnine,
  izracunajPostnino,
  izracunajZnesek,
  type DDVPoStopnji,
  type NastavitvePostnine,
} from "./cene";
import { pravilaDostave, type PravilaDostave } from "./dostava";
import { kljucPostavke, NAJVEC_KOSOV, type PostavkaKosarice } from "./postavke";

/**
 * Strežniško preverjanje košarice (Z21): iz id-jev in količin, ki jih hrani
 * brskalnik, in iz trenutnega kataloga izračuna imena, cene, zalogo in
 * težave. Funkcija je čista (katalog, nastavitve in mesec dobi kot
 * argumente), da jo lahko blagajna (K7) ponovno uporabi in da je
 * preizkušena brez baze.
 */

export type VrstaTezave =
  /** Izdelka ali velikosti ni več, ali je ni mogoče naročiti: postavko je treba odstraniti. */
  | "nedosegljivo"
  /** Naročenih je več kosov, kot jih je na zalogi: količino je treba zmanjšati. */
  | "kolicina";

export interface Tezava {
  vrsta: VrstaTezave;
  razlog: string;
  /** Pri `kolicina`: največja količina, ki jo je še mogoče naročiti. */
  najvecKosov?: number;
}

export interface PostavkaPregled {
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

export interface PregledKosarice {
  postavke: PostavkaPregled[];
  /** Kosi v postavkah brez težav. */
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
  imaTezave: boolean;
  trgovinaOdprta: boolean;
  /** Ali sme kupec nadaljevati na blagajno. */
  lahkoNaBlagajno: boolean;
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

function preveriPostavko(p: PostavkaKosarice, izdelki: Map<number, IzdelekPogled>, mesec: Mesec): PostavkaPregled {
  const osnova = {
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
  const najvecKosov = Math.min(zaloga, NAJVEC_KOSOV);
  let tezava: Tezava | null = null;
  if (!narocljiva) {
    tezava = { vrsta: "nedosegljivo", razlog: razlogNedosegljivosti(izdelek, razpolozljivost.vrsta) };
  } else if (p.kolicina > zaloga) {
    tezava = {
      vrsta: "kolicina",
      razlog: `Na zalogi ${zaloga === 1 ? "je" : zaloga === 2 ? "sta" : "so"} samo še ${steviloKosov(zaloga)}.`,
      najvecKosov,
    };
  }
  const cenaCenti = velikost.cenaCenti;
  return {
    ...osnova,
    izdelek: podatkiIzdelka,
    velikost: velikost.oznaka,
    cenaCenti: narocljiva ? cenaCenti : null,
    stopnjaDDV: izdelek.stopnjaDDV,
    najvecKosov: narocljiva ? najvecKosov : p.kolicina,
    skupajCenti: narocljiva && cenaCenti != null ? cenaCenti * p.kolicina : null,
    tezava,
  };
}

export function preveriKosarico(
  kosarica: readonly PostavkaKosarice[],
  izdelki: readonly IzdelekPogled[],
  nastavitve: NastavitvePostnine & { trgovinaOdprta: boolean },
  mesec: Mesec,
): PregledKosarice {
  const poId = new Map(izdelki.map((i) => [i.id, i]));
  const postavke = kosarica.map((p) => preveriPostavko(p, poId, mesec));

  const brezTezav = postavke.filter((p) => p.tezava === null);
  const znesek = izracunajZnesek(
    brezTezav.map((p) => ({
      cenaCenti: p.cenaCenti as number,
      kolicina: p.kolicina,
      stopnjaDDV: p.stopnjaDDV as number,
    })),
    "prevzem",
    nastavitve,
  );
  // Pravila dostave štejejo vse izdelke, ki bodo ostali v košarici (tudi
  // tiste, ki jim je treba le zmanjšati količino).
  const pravila = pravilaDostave(
    postavke.flatMap((p) =>
      p.izdelek && p.tezava?.vrsta !== "nedosegljivo"
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
    imaTezave,
    trgovinaOdprta,
    lahkoNaBlagajno: trgovinaOdprta && brezTezav.length > 0 && !imaTezave,
  };
}
