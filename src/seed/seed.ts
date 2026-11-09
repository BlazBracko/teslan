import path from "node:path";
import type { Payload, RequestContext } from "payload";
import {
  IZDELKI,
  KATEGORIJE,
  NAVODILA_ZA_PREVZEM,
  PRODAJALEC,
  PROGRAMI,
  SKUPINE,
  SLIKE,
  TIPI_SKATEL,
  ZACETNA_ZALOGA,
  type KljucSlike,
  type SlikaSeed,
} from "./podatki";
import type { Mesec } from "../katalog/sezona";
import { PRIVZETE_NASTAVITVE } from "../payload/globali/NastavitveTrgovine";
import type { Izdelki } from "../payload-types";

export type NacinSeeda =
  /** `npm run seed`: doda vse, kar manjka (po slugu), obstoječega ne spreminja. */
  | "dopolni"
  /** `npm run seed:if-empty` (ob deployu): katalog le, če ni nobenega izdelka. */
  | "ce-prazno";

export interface MoznostiSeeda {
  nacin: NacinSeeda;
  admin?: { email?: string; geslo?: string };
  /** Mapa s slikami (privzeto `public/`). */
  mapaSlik?: string;
  log?: (sporocilo: string) => void;
}

export interface PorociloSeeda {
  admin: "ustvarjen" | "obstaja" | "preskocen";
  katalog: "dopolnjen" | "preskocen";
  darila: "dopolnjena" | "preskocena";
  ustvarjeno: {
    kategorije: number;
    skupine: number;
    izdelki: number;
    slike: number;
    tipiSkatel: number;
    programi: number;
  };
  nastavitve: "ustvarjene" | "obstajajo";
}

// Seed teče zunaj strežnika Next, zato brez revalidacije (gl. revalidacija.ts).
const context: RequestContext = { brezRevalidacije: true };

/**
 * Seed (§6): idempotenten, obstoječih zapisov nikoli ne spremeni ali izbriše,
 * zato je varen na stagingu in v produkciji, kjer lastnik podatke že ureja.
 *
 *  1. Če ni uporabnikov in sta podana e-pošta in geslo, ustvari administratorja.
 *  2. Katalog: slike iz `public/`, kategorije, skupine ponudbe in izdelki, ki
 *     jih še ni (primerjava po slugu oz. imenu). V načinu `ce-prazno` samo,
 *     če v bazi ni nobenega izdelka, da se izdelki, ki jih je lastnik
 *     izbrisal, ob naslednjem deployu ne vrnejo.
 *  3. Demo darila (K10): tipi škatel in programi, ki jih še ni. V načinu
 *     `ce-prazno` samo, če ni nobenega tipa škatle in nobenega programa:
 *     staging, ki je bil seedan pred K10, ob prvem deployu dobi demo
 *     darila, kasneje pa izbrisana darila ne vrnejo.
 *  4. Nastavitve trgovine s privzetimi vrednostmi, če še niso bile shranjene.
 */
export async function seed(payload: Payload, moznosti: MoznostiSeeda): Promise<PorociloSeeda> {
  const log = moznosti.log ?? ((s: string) => payload.logger.info(s));
  const mapaSlik = moznosti.mapaSlik ?? path.resolve(process.cwd(), "public");
  const porocilo: PorociloSeeda = {
    admin: "preskocen",
    katalog: "preskocen",
    darila: "preskocena",
    ustvarjeno: { kategorije: 0, skupine: 0, izdelki: 0, slike: 0, tipiSkatel: 0, programi: 0 },
    nastavitve: "obstajajo",
  };

  // 1. Administrator
  const { totalDocs: uporabnikov } = await payload.count({ collection: "users" });
  if (uporabnikov > 0) {
    porocilo.admin = "obstaja";
  } else if (moznosti.admin?.email && moznosti.admin.geslo) {
    await payload.create({
      collection: "users",
      data: {
        ime: "Administrator",
        email: moznosti.admin.email,
        password: moznosti.admin.geslo,
        vloga: "admin",
      },
      context,
    });
    porocilo.admin = "ustvarjen";
    log(`Seed: ustvarjen administrator ${moznosti.admin.email}.`);
  } else {
    log(
      "Seed: ni uporabnikov, SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD pa nista nastavljena; prvega administratorja ustvarite na /admin.",
    );
  }

  // 2. Katalog
  const { totalDocs: izdelkov } = await payload.count({ collection: "izdelki" });
  if (moznosti.nacin === "ce-prazno" && izdelkov > 0) {
    log(`Seed: v bazi je že ${izdelkov} izdelkov, katalog preskočen.`);
  } else {
    porocilo.katalog = "dopolnjen";
    const slike = iskalnikSlik(payload, mapaSlik, porocilo);
    const kategorije = await seedKategorije(payload, porocilo);
    await seedSkupine(payload, kategorije, slike, porocilo);
    await seedIzdelki(payload, kategorije, slike, porocilo);
    const u = porocilo.ustvarjeno;
    log(
      `Seed: katalog dopolnjen (novih: ${u.slike} slik, ${u.kategorije} kategorij, ${u.skupine} skupin, ${u.izdelki} izdelkov).`,
    );
  }

  // 3. Demo darila
  const [{ totalDocs: tipov }, { totalDocs: programov }] = await Promise.all([
    payload.count({ collection: "tipi-skatel" }),
    payload.count({ collection: "darilni-programi" }),
  ]);
  if (moznosti.nacin === "ce-prazno" && tipov + programov > 0) {
    log(`Seed: v bazi je že ${tipov} tipov škatel in ${programov} programov, darila preskočena.`);
  } else {
    porocilo.darila = "dopolnjena";
    await seedDarila(payload, iskalnikSlik(payload, mapaSlik, porocilo), porocilo, log);
    const u = porocilo.ustvarjeno;
    log(`Seed: darila dopolnjena (novih: ${u.tipiSkatel} tipov škatel, ${u.programi} programov).`);
  }

  // 4. Nastavitve trgovine
  const nastavitve = await payload.findGlobal({ slug: "nastavitve-trgovine" });
  if (!nastavitve.updatedAt) {
    await payload.updateGlobal({
      slug: "nastavitve-trgovine",
      data: {
        ...PRIVZETE_NASTAVITVE,
        navodilaZaPrevzem: NAVODILA_ZA_PREVZEM,
        prodajalec: PRODAJALEC,
      },
      context,
    });
    porocilo.nastavitve = "ustvarjene";
    log("Seed: nastavitve trgovine shranjene s privzetimi vrednostmi.");
  }

  return porocilo;
}

type IskalnikSlik = (kljuc: KljucSlike) => Promise<number>;

/**
 * Slike se naložijo šele, ko jih potrebuje nov zapis, in le enkrat. Že
 * naložena slika se prepozna po imenu datoteke ali opisu (Payload ob
 * podvojenem imenu doda pripono, npr. `cesen-1.jpg`).
 */
function iskalnikSlik(payload: Payload, mapaSlik: string, porocilo: PorociloSeeda): IskalnikSlik {
  const ids = new Map<KljucSlike, Promise<number>>();
  const poisci = async (kljuc: KljucSlike): Promise<number> => {
    const slika: SlikaSeed = SLIKE[kljuc];
    const { docs } = await payload.find({
      collection: "media",
      where: {
        or: [{ filename: { equals: slika.datoteka } }, { alt: { equals: slika.alt } }],
      },
      limit: 1,
      depth: 0,
    });
    if (docs[0]) return docs[0].id;
    const medij = await payload.create({
      collection: "media",
      data: {
        alt: slika.alt,
        ...(slika.zarisce ? { focalX: slika.zarisce.x, focalY: slika.zarisce.y } : {}),
      },
      filePath: path.join(mapaSlik, slika.datoteka),
      context,
    });
    porocilo.ustvarjeno.slike++;
    return medij.id;
  };
  return (kljuc) => {
    if (!ids.has(kljuc)) ids.set(kljuc, poisci(kljuc));
    return ids.get(kljuc)!;
  };
}

async function seedKategorije(
  payload: Payload,
  porocilo: PorociloSeeda,
): Promise<Map<string, number>> {
  const ids = new Map<string, number>();
  for (const [i, kategorija] of KATEGORIJE.entries()) {
    const { docs } = await payload.find({
      collection: "kategorije",
      where: { slug: { equals: kategorija.slug } },
      limit: 1,
      depth: 0,
    });
    const id =
      docs[0]?.id ??
      (
        await payload.create({
          collection: "kategorije",
          data: { ime: kategorija.ime, slug: kategorija.slug, vrstniRed: (i + 1) * 10 },
          context,
        })
      ).id;
    if (!docs[0]) porocilo.ustvarjeno.kategorije++;
    ids.set(kategorija.slug, id);
  }
  return ids;
}

async function seedSkupine(
  payload: Payload,
  kategorije: Map<string, number>,
  slike: IskalnikSlik,
  porocilo: PorociloSeeda,
) {
  for (const [i, skupina] of SKUPINE.entries()) {
    const { totalDocs } = await payload.count({
      collection: "skupine-ponudbe",
      where: { ime: { equals: skupina.ime } },
    });
    if (totalDocs > 0) continue;
    await payload.create({
      collection: "skupine-ponudbe",
      data: {
        ime: skupina.ime,
        opis: skupina.opis,
        slika: skupina.slika ? await slike(skupina.slika) : undefined,
        kategorije: skupina.kategorije.map((slug) => obvezno(kategorije.get(slug), slug)),
        vrstniRed: (i + 1) * 10,
      },
      context,
    });
    porocilo.ustvarjeno.skupine++;
  }
}

async function seedIzdelki(
  payload: Payload,
  kategorije: Map<string, number>,
  slike: IskalnikSlik,
  porocilo: PorociloSeeda,
) {
  for (const [i, izdelek] of IZDELKI.entries()) {
    const { totalDocs } = await payload.count({
      collection: "izdelki",
      where: { slug: { equals: izdelek.slug } },
    });
    if (totalDocs > 0) continue;
    const prikaz = izdelek.nacin === "samo-prikaz";
    await payload.create({
      collection: "izdelki",
      data: {
        ime: izdelek.ime,
        slug: izdelek.slug,
        objavljen: true,
        izpostavljen: izdelek.izpostavljen ?? false,
        vrstniRed: (i + 1) * 10,
        kategorija: obvezno(kategorije.get(izdelek.kategorija), izdelek.kategorija),
        kratekOpis: izdelek.kratekOpis,
        slike: await Promise.all((izdelek.slike ?? []).map(slike)),
        nacinProdaje: izdelek.nacin,
        sezona: izdelek.sezona ? { od: mesecPolja(izdelek.sezona.od), do: mesecPolja(izdelek.sezona.do) } : undefined,
        // P5: vsa živila 9,5 %.
        stopnjaDDV: "9.5",
        // P6: za darilo so primerni vsi izdelki, ki se lahko pošljejo.
        primernoZaDarilo: izdelek.nacin === "posta-in-prevzem",
        velikosti: izdelek.velikosti.map(([oznaka, cenaCenti]) => ({
          oznaka,
          cenaCenti,
          zaloga: prikaz ? null : ZACETNA_ZALOGA,
        })),
      },
      context,
    });
    porocilo.ustvarjeno.izdelki++;
  }
}

async function seedDarila(
  payload: Payload,
  slike: IskalnikSlik,
  porocilo: PorociloSeeda,
  log: (s: string) => void,
) {
  const tipi = new Map<string, number>();
  for (const [i, tip] of TIPI_SKATEL.entries()) {
    const { docs } = await payload.find({
      collection: "tipi-skatel",
      where: { ime: { equals: tip.ime } },
      limit: 1,
      depth: 0,
    });
    if (docs[0]) {
      tipi.set(tip.ime, docs[0].id);
      continue;
    }
    const nov = await payload.create({
      collection: "tipi-skatel",
      data: { ...tip, zaloga: ZACETNA_ZALOGA, aktiven: true, vrstniRed: (i + 1) * 10 },
      context,
    });
    tipi.set(tip.ime, nov.id);
    porocilo.ustvarjeno.tipiSkatel++;
  }

  for (const [i, program] of PROGRAMI.entries()) {
    const { totalDocs } = await payload.count({
      collection: "darilni-programi",
      where: { slug: { equals: program.slug } },
    });
    if (totalDocs > 0) continue;
    const vsebina = [];
    for (const [slug, velikost, kolicina] of program.vsebina) {
      const { docs } = await payload.find({
        collection: "izdelki",
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
      });
      const izdelek = docs[0];
      const v = izdelek?.velikosti.find((x) => x.oznaka.startsWith(velikost));
      if (!izdelek?.primernoZaDarilo || !v?.id) {
        // Lastnik je izdelek izbrisal ali spremenil: program brez njega.
        log(`Seed: program ${program.ime} je brez izdelka ${slug} ${velikost} (ga ni ali ni primeren za darilo).`);
        continue;
      }
      vsebina.push({ izdelek: izdelek.id, velikostId: v.id, kolicina });
    }
    if (vsebina.length === 0) continue;
    await payload.create({
      collection: "darilni-programi",
      data: {
        ime: program.ime,
        slug: program.slug,
        opis: program.opis,
        objavljen: true,
        vrstniRed: (i + 1) * 10,
        slika: program.slika ? await slike(program.slika) : undefined,
        tipSkatle: obvezno(tipi.get(program.tipSkatle), program.tipSkatle),
        vsebina,
      },
      context,
    });
    porocilo.ustvarjeno.programi++;
  }
}

type MesecPolja = NonNullable<NonNullable<Izdelki["sezona"]>["od"]>;
const mesecPolja = (m: Mesec) => String(m) as MesecPolja;

function obvezno<T>(vrednost: T | undefined, kaj: string): T {
  if (vrednost === undefined) throw new Error(`Seed: manjka ${kaj}`);
  return vrednost;
}
