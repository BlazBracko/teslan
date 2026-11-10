import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LuChevronRight } from "react-icons/lu";
import { JsonLd } from "@/components/seo/JsonLd";
import { DostavaIzdelka } from "@/components/katalog/DostavaIzdelka";
import { GalerijaIzdelka } from "@/components/katalog/GalerijaIzdelka";
import { SorodniIzdelki, sorodniIzdelki } from "@/components/katalog/SorodniIzdelki";
import { GumbNazaj } from "@/components/katalog/GumbNazaj";
import { ZgodbaIzdelka } from "@/components/katalog/ZgodbaIzdelka";
import { NakupIzdelka, type VelikostZaNakup } from "@/components/katalog/NakupIzdelka";
import { OznakaNacina, OznakaRazpolozljivosti } from "@/components/katalog/OznakaRazpolozljivosti";
import { Container } from "@/components/ui/Container";
import { Price } from "@/components/ui/Price";
import { potSeznama, potSeznamaZaIzdelek } from "@/katalog/nakup";
import { naloziKatalog, naloziKontakt, naloziNastavitve, type IzdelekPogled } from "@/katalog/podatki";
import { cenaNaKartici, razpolozljivostIzdelka, razpolozljivostVelikosti } from "@/katalog/razpolozljivost";
import { oznakaSezone, trenutniMesec } from "@/katalog/sezona";
import { okolje } from "@/env";
import { izvorStrani } from "@/seo/izvor";
import { izdelekJsonLd } from "@/seo/json-ld";
import { metapodatkiStrani } from "@/seo/metapodatki";

/** Izdelki in zaloga so iz CMS (predpomnjeni, Z17); mesec je vedno trenuten. */
export const dynamic = "force-dynamic";

type Parametri = { params: Promise<{ slug: string }> };

const potIzdelka = (slug: string) => `/products/${encodeURIComponent(slug)}`;

/** Objavljen izdelek po slugu; neobjavljeni sploh niso v katalogu (Z14). */
async function najdiIzdelek(slug: string): Promise<IzdelekPogled | undefined> {
  const katalog = await naloziKatalog();
  return katalog.izdelki.find((i) => i.slug === slug);
}

/** Izdelek in sorodni izdelki iz istega (predpomnjenega) kataloga. */
async function najdiIzdelekInKatalog(slug: string) {
  const katalog = await naloziKatalog();
  return { izdelek: katalog.izdelki.find((i) => i.slug === slug), vsi: katalog.izdelki };
}

export async function generateMetadata({ params }: Parametri): Promise<Metadata> {
  const izdelek = await najdiIzdelek((await params).slug);
  if (!izdelek) return { title: "Izdelka ni mogoče najti", robots: { index: false } };
  return metapodatkiStrani({
    naslov: izdelek.ime,
    opis: izdelek.kratekOpis ?? `${izdelek.ime} z Domačije Tešlan v Podgori pri Novem mestu.`,
    pot: potIzdelka(izdelek.slug),
    // Slika izdelka za deljenje (Z72); brez nje privzeta slika kmetije.
    slike: izdelek.slike.slice(0, 1).map((s) => ({ url: s.url, alt: s.alt, width: s.sirina, height: s.visina })),
  });
}

/**
 * Podstran izdelka (Z15): gumb „Nazaj“ in drobtinice, galerija, izbira
 * velikosti in količine, dostava in prevzem, sestavine in alergeni, pod tem
 * zgodba izdelka in sorodni izdelki. Neobstoječ ali neobjavljen slug vrne
 * 404.
 */
export default async function ProductPage({ params }: Parametri) {
  const { slug } = await params;
  const [{ izdelek, vsi }, nastavitve, kontakt] = await Promise.all([
    najdiIzdelekInKatalog(slug),
    naloziNastavitve(),
    naloziKontakt(),
  ]);
  if (!izdelek) notFound();
  const trgovinaOdprta = nastavitve.trgovinaOdprta !== false;

  const mesec = trenutniMesec();
  const seznam = potSeznamaZaIzdelek(izdelek);
  const cena = cenaNaKartici(izdelek, mesec);
  const jsonLd = izdelekJsonLd(izdelek, kontakt, izvorStrani(okolje()), mesec);
  const velikosti: VelikostZaNakup[] = izdelek.velikosti.map((v) => ({
    id: v.id,
    oznaka: v.oznaka,
    cenaCenti: izdelek.nacinProdaje === "samo-prikaz" ? null : v.cenaCenti,
    zaloga: v.zaloga ?? 0,
    razpolozljivost: razpolozljivostVelikosti(izdelek, v, mesec),
  }));
  const podrobnosti = [
    izdelek.sezona && { naslov: "Sezona", vsebina: oznakaSezone(izdelek.sezona) },
    izdelek.sestavine && { naslov: "Sestavine", vsebina: izdelek.sestavine },
    izdelek.alergeni && { naslov: "Alergeni", vsebina: izdelek.alergeni },
  ].filter((p): p is { naslov: string; vsebina: string } => Boolean(p));

  return (
    <Container className="py-4 md:py-10">
      <JsonLd podatki={jsonLd} />
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 md:mb-6">
        <GumbNazaj nadomestna={seznam} />
        <nav aria-label="Drobtinice">
          <ol className="flex flex-wrap items-center gap-1 type-small text-ink-muted">
            <li>
              <Link href={seznam} className="rounded-xs hover:text-ink hover:underline">
                {izdelek.nacinProdaje === "samo-prikaz" ? "Na kmetiji" : "Trgovina"}
              </Link>
            </li>
            <li aria-hidden="true">
              <LuChevronRight className="size-4" />
            </li>
            <li>
              <Link
                href={potSeznama({ kategorija: izdelek.kategorija.slug })}
                className="rounded-xs hover:text-ink hover:underline"
              >
                {izdelek.kategorija.ime}
              </Link>
            </li>
            <li aria-hidden="true">
              <LuChevronRight className="size-4" />
            </li>
            <li aria-current="page" className="text-ink">
              {izdelek.ime}
            </li>
          </ol>
        </nav>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <GalerijaIzdelka slike={izdelek.slike} ime={izdelek.ime} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="type-label text-accent">{izdelek.kategorija.ime}</p>
            <h1 className="type-h1 text-ink">{izdelek.ime}</h1>
            {cena && <Price cents={cena.centi} from={cena.od} size="xl" />}
            <div className="flex flex-wrap gap-1.5">
              <OznakaRazpolozljivosti razpolozljivost={razpolozljivostIzdelka(izdelek, mesec)} />
              <OznakaNacina nacin={izdelek.nacinProdaje} />
            </div>
            {izdelek.kratekOpis && <p className="type-body-lg text-ink-muted">{izdelek.kratekOpis}</p>}
          </div>

          <NakupIzdelka
            izdelekId={izdelek.id}
            ime={izdelek.ime}
            samoPrikaz={izdelek.nacinProdaje === "samo-prikaz"}
            velikosti={velikosti}
            trgovinaOdprta={trgovinaOdprta}
            telefon={kontakt.telefon}
            telefonPovezava={kontakt.telefonPovezava}
          />

          <DostavaIzdelka
            nacin={izdelek.nacinProdaje}
            postninaCenti={nastavitve.postninaCenti}
            pragBrezplacnePostnineCenti={nastavitve.pragBrezplacnePostnineCenti}
          />

          {podrobnosti.length > 0 && (
            <dl className="grid gap-4 border-t border-line pt-6 sm:grid-cols-[8rem_1fr]">
              {podrobnosti.map((p) => (
                <div key={p.naslov} className="contents">
                  <dt className="type-small font-semibold text-ink">{p.naslov}</dt>
                  <dd className="type-small text-ink-muted">{p.vsebina}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <ZgodbaIzdelka izdelek={izdelek} />
      <SorodniIzdelki izdelki={sorodniIzdelki(izdelek, vsi, mesec)} mesec={mesec} trgovinaOdprta={trgovinaOdprta} />
    </Container>
  );
}
