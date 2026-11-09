import type { Payload } from "payload";
import { okolje } from "@/env";
import { obvestiloProdajalcu, potrdiloKupcu } from "@/eposta/narocila";
import { OZNAKA_KATALOG } from "@/katalog/oznake";
import { izdelekPogled, type IzdelekPogled } from "@/katalog/pogled";
import { trenutniMesec } from "@/katalog/sezona";
import { izracunajZnesek } from "@/kosarica/cene";
import { dovoljenaPlacila, nastevanje } from "@/kosarica/dostava";
import { jeSkatla, normalizirajKosarico } from "@/kosarica/postavke";
import { imePostavke, postavkeZaZnesek, preveriKosarico, type PostavkaPregled } from "@/kosarica/preverjanje";
import { programPogled, tipSkatlePogled } from "@/darila/pogled";
import { kontaktIzNastavitev } from "@/lib/kontakt";
import type { Narocila, NastavitveTrgovine } from "@/payload-types";
import { razveljavi } from "@/payload/revalidacija";
import {
  naslednjaZaporedna,
  sejaBaze,
  zakleniOddajo,
  zakleniTipeSkatel,
  zakleniVelikosti,
  zdruziSpremembe,
  zmanjsajZalogo,
  zmanjsajZalogoSkatel,
  type SpremembaZaloge,
  type SpremembaZalogeSkatel,
} from "./baza";
import { preveriBlagajno, type NapakeBlagajne } from "./obrazec";
import type { PonudnikPlacil } from "./placila";
import { narociloPogled, potNarocila } from "./pogled";
import { zacetniStatus } from "./statusi";
import { letoVLjubljani, oblikujStevilko, predponaLeta, ustvariZeton } from "./stevilka";

/**
 * Oddaja naročila (Z30, Z31, Z32, Z43). Vse teče v eni transakciji:
 *
 *  1. zaklep oddaje (naročila se oddajajo po vrsti, številke so zaporedne),
 *  2. zaklep vrstic velikosti in tipov škatel ter sveže branje izdelkov,
 *     škatel in nastavitev iz baze (ne iz predpomnjenega kataloga),
 *  3. preverjanje košarice (`preveriKosarico`, enako kot na strani
 *     košarice), pravil dostave in plačila ter stikala trgovine (Z27),
 *  4. zmanjšanje zaloge (velikosti, tudi v darilnih škatlah, in škatle,
 *     P8) in zapis naročila s posnetkom imen, velikosti, cen in stopenj
 *     DDV; pri škatli še vsebine in sporočila na kartici (Z54).
 *
 * Če karkoli ne uspe, se transakcija razveljavi in v bazi se ne spremeni
 * nič; kupec dobi seznam postavk s težavami. Po potrditvi se pri plačilu
 * ob prevzemu pošljeta obvestili E1 in E2 (Z43); napaka pri pošiljanju
 * naročila ne razveljavi (Z59).
 *
 * Pri plačilu s kartico (Z40) naročilo nastane s statusom „Čaka na
 * plačilo“ in z rezervirano zalogo; po potrditvi transakcije se ustvari
 * seja Stripe Checkout, kupec gre na njen naslov (`placilo`). E1 in E2 se
 * pošljeta šele ob plačilu (`potek-placila.ts`). Če seje ni mogoče
 * ustvariti, se naročilo takoj prekliče (zaloga se vrne) in kupec dobi
 * napako; košarica mu ostane.
 */

export interface TezavaOddaje {
  ime: string;
  razlog: string;
}

export type RezultatOddaje =
  | {
      ok: true;
      id: number;
      stevilka: string;
      zeton: string;
      /** Stran potrdila naročila. */
      pot: string;
      /** Pri kartici: naslov strani za plačilo (Stripe Checkout), kamor gre kupec. */
      placilo?: string;
    }
  | { ok: false; vrsta: "obrazec"; sporocilo: string; napake: NapakeBlagajne }
  | { ok: false; vrsta: "kosarica"; sporocilo: string; tezave: TezavaOddaje[] }
  | { ok: false; vrsta: "zavrnjeno"; sporocilo: string };

export interface MoznostiOddaje {
  /** Ponudnik plačil s kartico (Stripe) ali `null`, ko kartica ni na voljo. */
  placila: PonudnikPlacil | null;
  /** Izvor strani (npr. https://www.teslan.si) za povratna naslova s Stripa. */
  izvor?: string;
  zdaj?: Date;
}

export const RAZLOG_NAPAKA_ZACETKA = "Neplačano: plačila s kartico ni bilo mogoče začeti.";
export const SPOROCILO_NAPAKA_PLACILA =
  "Plačila s kartico ta hip ni mogoče začeti. Naročilo ni bilo oddano, izdelki so ostali v košarici. Poskusite znova čez nekaj minut ali izberite prevzem na kmetiji in plačilo ob prevzemu.";

export const SPOROCILO_ZAPRTA_TRGOVINA =
  "Spletna trgovina je trenutno zaprta, zato naročila ni mogoče oddati. Košarica ostane shranjena.";

class Razveljavi extends Error {
  constructor(public readonly rezultat: Exclude<RezultatOddaje, { ok: true }>) {
    super(rezultat.sporocilo);
  }
}

export async function oddajNarocilo(
  payload: Payload,
  vnos: { obrazec: unknown; kosarica: unknown },
  { placila, izvor, zdaj = new Date() }: MoznostiOddaje,
): Promise<RezultatOddaje> {
  const obrazec = preveriBlagajno(vnos.obrazec);
  if (!obrazec.success) {
    return { ok: false, vrsta: "obrazec", sporocilo: "Preverite označena polja.", napake: obrazec.napake };
  }
  const podatki = obrazec.data;
  const kosarica = normalizirajKosarico(vnos.kosarica);
  if (kosarica.length === 0) {
    return { ok: false, vrsta: "zavrnjeno", sporocilo: "Košarica je prazna." };
  }
  if (podatki.nacinPlacila === "kartica" && !placila) {
    return {
      ok: false,
      vrsta: "zavrnjeno",
      sporocilo: "Plačilo s kartico trenutno ni mogoče. Izberite prevzem na kmetiji in plačilo ob prevzemu.",
    };
  }

  const transakcija = await payload.db.beginTransaction();
  if (transakcija == null) throw new Error("Baza ne podpira transakcij.");
  const req = { transactionID: transakcija };
  let narocilo: Narocila;
  let nastavitve: NastavitveTrgovine;
  try {
    const seja = await sejaBaze(payload, req);
    await zakleniOddajo(seja);

    nastavitve = await payload.findGlobal({ slug: "nastavitve-trgovine", depth: 0, req });
    if (nastavitve.trgovinaOdprta === false) {
      throw new Razveljavi({ ok: false, vrsta: "zavrnjeno", sporocilo: SPOROCILO_ZAPRTA_TRGOVINA });
    }

    const kosi = kosarica.flatMap((p) => (jeSkatla(p) ? p.vsebina : [p]));
    const skatle = kosarica.filter(jeSkatla);
    await zakleniVelikosti(
      seja,
      kosi.map((p) => p.velikostId),
    );
    await zakleniTipeSkatel(
      seja,
      skatle.map((p) => p.tipSkatleId),
    );
    const [{ docs }, tipi, programi] = await Promise.all([
      payload.find({
        collection: "izdelki",
        where: {
          and: [{ id: { in: [...new Set(kosi.map((p) => p.izdelekId))] } }, { objavljen: { equals: true } }],
        },
        depth: 1,
        pagination: false,
        req,
      }),
      skatle.length > 0
        ? payload.find({
            collection: "tipi-skatel",
            where: { id: { in: [...new Set(skatle.map((p) => p.tipSkatleId))] } },
            depth: 0,
            pagination: false,
            req,
          })
        : { docs: [] },
      skatle.some((p) => p.program)
        ? payload.find({
            collection: "darilni-programi",
            where: { slug: { in: [...new Set(skatle.flatMap((p) => (p.program ? [p.program] : [])))] } },
            depth: 0,
            pagination: false,
            req,
          })
        : { docs: [] },
    ]);
    const izdelki = docs.map(izdelekPogled).filter((i): i is IzdelekPogled => i !== null);

    const pregled = preveriKosarico(
      kosarica,
      izdelki,
      {
        trgovinaOdprta: true,
        postninaCenti: nastavitve.postninaCenti,
        pragBrezplacnePostnineCenti: nastavitve.pragBrezplacnePostnineCenti,
      },
      trenutniMesec(zdaj),
      { tipi: tipi.docs.map(tipSkatlePogled), programi: programi.docs.map(programPogled) },
    );
    if (pregled.imaTezave) {
      throw new Razveljavi({
        ok: false,
        vrsta: "kosarica",
        sporocilo: "Nekaterih izdelkov ni mogoče naročiti, kot so v košarici. Naročilo ni bilo oddano.",
        tezave: pregled.postavke.flatMap((p) =>
          p.tezava
            ? [
                {
                  ime: imePostavke(p),
                  razlog: p.tezava.razlog,
                },
              ]
            : [],
        ),
      });
    }
    if (podatki.nacinDostave === "posta" && !pregled.dostava.postaDovoljena) {
      throw new Razveljavi({
        ok: false,
        vrsta: "zavrnjeno",
        sporocilo: `Pošiljanje po pošti ni mogoče, ker so v košarici izdelki samo za prevzem na kmetiji: ${nastevanje(pregled.dostava.samoPrevzem)}.`,
      });
    }
    if (!dovoljenaPlacila(podatki.nacinDostave).includes(podatki.nacinPlacila)) {
      throw new Razveljavi({
        ok: false,
        vrsta: "zavrnjeno",
        sporocilo: "Pri pošiljanju po pošti je mogoče plačati samo s kartico.",
      });
    }

    const darilo = podatki.nacinDostave === "posta" && podatki.darilo === true;
    if (darilo && !pregled.imaSkatlo) {
      throw new Razveljavi({
        ok: false,
        vrsta: "zavrnjeno",
        sporocilo: "Pošiljanje na naslov prejemnika je mogoče samo, če je v košarici darilna škatla.",
      });
    }

    const znesek = izracunajZnesek(postavkeZaZnesek(pregled.postavke), podatki.nacinDostave, nastavitve);
    const { velikosti, skatle: spremembeSkatel } = spremembeZaloge(pregled.postavke);
    const neuspele = await zmanjsajZalogo(seja, velikosti);
    const neuspeleSkatle = await zmanjsajZalogoSkatel(seja, spremembeSkatel);
    if (neuspele.length > 0 || neuspeleSkatle.length > 0) {
      // Ne bi se smelo zgoditi (vrstice so zaklenjene in preverjene), a
      // zaloga nikoli ne sme pasti pod 0.
      throw new Razveljavi({
        ok: false,
        vrsta: "kosarica",
        sporocilo: "Zaloga se je med oddajo spremenila. Naročilo ni bilo oddano.",
        tezave: [
          ...neuspele.map((n) => ({
            ime: izdelki.find((i) => i.id === n.izdelekId)?.ime ?? "Izdelek",
            razlog: "Izdelka ni več dovolj na zalogi.",
          })),
          ...neuspeleSkatle.map((n) => ({
            ime: tipi.docs.find((t) => t.id === n.tipSkatleId)?.ime ?? "Darilna škatla",
            razlog: "Škatle ni več dovolj na zalogi.",
          })),
        ],
      });
    }

    const leto = letoVLjubljani(zdaj);
    const stevilka = oblikujStevilko(leto, await naslednjaZaporedna(seja, predponaLeta(leto)));
    const posta = podatki.nacinDostave === "posta";
    narocilo = await payload.create({
      collection: "narocila",
      req,
      data: {
        stevilka,
        zeton: ustvariZeton(),
        status: zacetniStatus(podatki.nacinPlacila),
        nacinDostave: podatki.nacinDostave,
        nacinPlacila: podatki.nacinPlacila,
        placano: false,
        kupec: { ime: podatki.ime, priimek: podatki.priimek, email: podatki.email, telefon: podatki.telefon },
        // Pri darilu je naslov dostave naslov prejemnika (Z55).
        naslov: posta
          ? { ulica: podatki.ulica, postnaStevilka: podatki.postnaStevilka, kraj: podatki.kraj }
          : undefined,
        darilo,
        prejemnik: darilo
          ? { ime: podatki.prejemnikIme, ulica: podatki.ulica, postnaStevilka: podatki.postnaStevilka, kraj: podatki.kraj }
          : undefined,
        opomba: podatki.opomba || undefined,
        postavke: pregled.postavke.map(posnetekPostavke),
        vmesniSestevekCenti: znesek.vmesniSestevekCenti,
        postninaCenti: znesek.postninaCenti,
        skupajCenti: znesek.skupajCenti,
        ddv: znesek.ddv,
        soglasjePogoji: zdaj.toISOString(),
      },
    });
    await payload.db.commitTransaction(transakcija);
  } catch (napaka) {
    await payload.db.rollbackTransaction(transakcija);
    if (napaka instanceof Razveljavi) return napaka.rezultat;
    throw napaka;
  }

  // Zaloga se je spremenila: katalog na javnih straneh se osveži.
  razveljavi(OZNAKA_KATALOG, { context: {}, payload });

  const uspeh = {
    ok: true as const,
    id: narocilo.id,
    stevilka: narocilo.stevilka,
    zeton: narocilo.zeton,
    pot: potNarocila(narocilo.stevilka, narocilo.zeton),
  };

  if (narocilo.nacinPlacila === "kartica" && placila) {
    const placilo = await zacniPlacilo(payload, placila, narocilo, { izvor, zdaj });
    return placilo ? { ...uspeh, placilo } : { ok: false, vrsta: "zavrnjeno", sporocilo: SPOROCILO_NAPAKA_PLACILA };
  }

  if (narocilo.status === "novo") {
    await posljiObvestilaONovemNarocilu(payload, narocilo, nastavitve);
  }
  return uspeh;
}

/** Zaloga, ki jo naročilo porabi: velikosti (združene, tudi iz škatel) in škatle. */
function spremembeZaloge(postavke: readonly PostavkaPregled[]): {
  velikosti: SpremembaZaloge[];
  skatle: SpremembaZalogeSkatel[];
} {
  const velikosti: SpremembaZaloge[] = [];
  const skatle: SpremembaZalogeSkatel[] = [];
  for (const p of postavke) {
    if (p.vrsta === "izdelek") {
      velikosti.push({ izdelekId: p.izdelekId, velikostId: p.velikostId, kolicina: p.kolicina });
      continue;
    }
    skatle.push({ tipSkatleId: p.tipSkatleId, kolicina: p.kolicina });
    for (const v of p.vsebina) {
      velikosti.push({ izdelekId: v.izdelekId, velikostId: v.velikostId, kolicina: v.kolicina * p.kolicina });
    }
  }
  const poTipu = new Map<number, number>();
  for (const s of skatle) poTipu.set(s.tipSkatleId, (poTipu.get(s.tipSkatleId) ?? 0) + s.kolicina);
  return {
    velikosti: zdruziSpremembe(velikosti),
    skatle: [...poTipu].map(([tipSkatleId, kolicina]) => ({ tipSkatleId, kolicina })),
  };
}

/** Posnetek postavke na naročilu (Z30, §6): imena, velikosti, cene in DDV ob oddaji. */
function posnetekPostavke(p: PostavkaPregled): NonNullable<Narocila["postavke"]>[number] {
  if (p.vrsta === "izdelek") {
    return {
      tip: "izdelek",
      izdelek: p.izdelekId,
      velikostId: p.velikostId,
      ime: p.izdelek?.ime ?? "",
      velikost: p.velikost,
      cenaCenti: p.cenaCenti as number,
      stopnjaDDV: p.stopnjaDDV as number,
      kolicina: p.kolicina,
    };
  }
  return {
    tip: "skatla",
    tipSkatle: p.tipSkatleId,
    ime: imePostavke(p),
    velikost: null,
    cenaCenti: p.cenaCenti as number,
    stopnjaDDV: p.stopnjaDDV,
    kolicina: p.kolicina,
    vsebina: p.vsebina.map((v) => ({
      izdelek: v.izdelekId,
      velikostId: v.velikostId,
      ime: v.ime ?? "",
      velikost: v.velikost,
      cenaCenti: v.cenaCenti as number,
      stopnjaDDV: v.stopnjaDDV as number,
      kolicina: v.kolicina,
    })),
    sporociloNaKartici: p.sporocilo,
  };
}

/**
 * Ustvari sejo Stripe Checkout za naročilo in shrani njen id (Z40). Vrne
 * naslov strani za plačilo ali `null`, ko ne uspe; tedaj je naročilo že
 * preklicano in zaloga vrnjena.
 */
async function zacniPlacilo(
  payload: Payload,
  placila: PonudnikPlacil,
  narocilo: Narocila,
  { izvor, zdaj }: { izvor?: string; zdaj: Date },
): Promise<string | null> {
  let sejaId: string | undefined;
  try {
    const osnova = izvor ?? okolje().NEXT_PUBLIC_SITE_URL;
    if (!osnova) throw new Error("Ni izvora strani (NEXT_PUBLIC_SITE_URL) za povratna naslova s Stripa.");
    const seja = await placila.ustvariSejo(narocilo, { izvor: osnova, zdaj });
    sejaId = seja.id;
    await payload.update({
      collection: "narocila",
      id: narocilo.id,
      data: { stripeSessionId: seja.id },
      overrideAccess: true,
      context: { sistem: true },
    });
    return seja.url;
  } catch (napaka) {
    payload.logger.error({ err: napaka, narocilo: narocilo.stevilka }, "Seje za plačilo s kartico ni bilo mogoče ustvariti");
    try {
      if (sejaId) await placila.prekiniSejo(sejaId);
      await payload.update({
        collection: "narocila",
        id: narocilo.id,
        data: { status: "preklicano", razlogPreklica: RAZLOG_NAPAKA_ZACETKA },
        overrideAccess: true,
        context: { brezStripa: true },
      });
    } catch (napakaPreklica) {
      payload.logger.error(
        { err: napakaPreklica, narocilo: narocilo.stevilka },
        "Naročila brez plačila ni bilo mogoče preklicati; preklic ga ob izteku (varovalka) ali ročno v adminu",
      );
    }
    return null;
  }
}

/**
 * E1 kupcu in E2 prodajalcu (Z43, Z57). Napaka pri pošiljanju se zapiše v
 * log in na naročilo (`napakaEposte`), naročilo ostane veljavno (Z59).
 */
export async function posljiObvestilaONovemNarocilu(
  payload: Payload,
  narocilo: Narocila,
  nastavitve: {
    emailObvestil?: string | null;
    navodilaZaPrevzem?: string | null;
    prodajalec?: Parameters<typeof kontaktIzNastavitev>[0];
  },
): Promise<void> {
  const izvor = (okolje().NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const pogled = narociloPogled(narocilo);
  const kontakt = kontaktIzNastavitev(nastavitve.prodajalec);
  const napake: string[] = [];

  const e1 = potrdiloKupcu(pogled, {
    povezava: `${izvor}${potNarocila(narocilo.stevilka, narocilo.zeton)}`,
    navodilaZaPrevzem: nastavitve.navodilaZaPrevzem ?? null,
    kontakt,
  });
  try {
    await payload.sendEmail({
      to: narocilo.kupec.email,
      replyTo: nastavitve.emailObvestil ?? undefined,
      subject: e1.zadeva,
      text: e1.besedilo,
    });
  } catch (napaka) {
    napake.push(`Potrdilo kupcu: ${napaka instanceof Error ? napaka.message : String(napaka)}`);
  }

  if (nastavitve.emailObvestil) {
    const e2 = obvestiloProdajalcu(pogled, { povezavaAdmin: `${izvor}/admin/collections/narocila/${narocilo.id}` });
    try {
      await payload.sendEmail({
        to: nastavitve.emailObvestil,
        replyTo: narocilo.kupec.email,
        subject: e2.zadeva,
        text: e2.besedilo,
      });
    } catch (napaka) {
      napake.push(`Obvestilo prodajalcu: ${napaka instanceof Error ? napaka.message : String(napaka)}`);
    }
  } else {
    napake.push("Obvestilo prodajalcu: v nastavitvah trgovine ni e-pošte za obvestila.");
  }

  if (napake.length > 0) {
    payload.logger.error({ narocilo: narocilo.stevilka, napake }, "Pošiljanje e-pošte ob naročilu ni uspelo");
    try {
      await payload.update({
        collection: "narocila",
        id: narocilo.id,
        data: { napakaEposte: napake.join("\n") },
        context: { sistem: true },
      });
    } catch (napaka) {
      payload.logger.error({ err: napaka, narocilo: narocilo.stevilka }, "Napake e-pošte ni bilo mogoče zapisati");
    }
  }
}
