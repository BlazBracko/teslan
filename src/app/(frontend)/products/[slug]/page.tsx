import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { LuChevronRight } from "react-icons/lu";
import { GalerijaIzdelka } from "@/components/katalog/GalerijaIzdelka";
import { NakupIzdelka, type VelikostZaNakup } from "@/components/katalog/NakupIzdelka";
import { OznakaNacina, OznakaRazpolozljivosti } from "@/components/katalog/OznakaRazpolozljivosti";
import { Container } from "@/components/ui/Container";
import { Price } from "@/components/ui/Price";
import { naloziKatalog, naloziKontakt, naloziNastavitve, type IzdelekPogled } from "@/katalog/podatki";
import { cenaNaKartici, razpolozljivostIzdelka, razpolozljivostVelikosti } from "@/katalog/razpolozljivost";
import { oznakaSezone, trenutniMesec } from "@/katalog/sezona";

/** Izdelki in zaloga so iz CMS (predpomnjeni, Z17); mesec je vedno trenuten. */
export const dynamic = "force-dynamic";

type Parametri = { params: Promise<{ slug: string }> };

/** Objavljen izdelek po slugu; neobjavljeni sploh niso v katalogu (Z14). */
async function najdiIzdelek(slug: string): Promise<IzdelekPogled | undefined> {
  const katalog = await naloziKatalog();
  return katalog.izdelki.find((i) => i.slug === slug);
}

export async function generateMetadata({ params }: Parametri): Promise<Metadata> {
  const izdelek = await najdiIzdelek((await params).slug);
  if (!izdelek) return { title: "Izdelka ni mogoče najti — Domačija Tešlan" };
  return {
    title: `${izdelek.ime} — Domačija Tešlan`,
    description: izdelek.kratekOpis ?? `${izdelek.ime} z Domačije Tešlan v Podgori pri Novem mestu.`,
  };
}

/**
 * Podstran izdelka (Z15): galerija, opis, sestavine in alergeni, izbira
 * velikosti in količine. Neobstoječ ali neobjavljen slug vrne 404.
 */
export default async function ProductPage({ params }: Parametri) {
  const { slug } = await params;
  const [izdelek, nastavitve, kontakt] = await Promise.all([
    najdiIzdelek(slug),
    naloziNastavitve(),
    naloziKontakt(),
  ]);
  if (!izdelek) notFound();

  const mesec = trenutniMesec();
  const cena = cenaNaKartici(izdelek, mesec);
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
    <Container className="py-8 md:py-12">
      <nav aria-label="Drobtinice" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1 type-small text-ink-muted">
          <li>
            <Link href="/products" className="rounded-xs hover:text-ink hover:underline">
              Izdelki
            </Link>
          </li>
          <li aria-hidden="true">
            <LuChevronRight className="size-4" />
          </li>
          <li>
            <Link
              href={`/products?kategorija=${encodeURIComponent(izdelek.kategorija.slug)}`}
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

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <GalerijaIzdelka slike={izdelek.slike} ime={izdelek.ime} />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="type-label text-accent">{izdelek.kategorija.ime}</p>
            <h1 className="type-h1 text-ink">{izdelek.ime}</h1>
            <div className="flex flex-wrap gap-1.5">
              <OznakaRazpolozljivosti razpolozljivost={razpolozljivostIzdelka(izdelek, mesec)} />
              <OznakaNacina nacin={izdelek.nacinProdaje} />
            </div>
            {cena && <Price cents={cena.centi} from={cena.od} size="lg" />}
            {izdelek.kratekOpis && <p className="type-body-lg text-ink-muted">{izdelek.kratekOpis}</p>}
          </div>

          <NakupIzdelka
            izdelekId={izdelek.id}
            ime={izdelek.ime}
            samoPrikaz={izdelek.nacinProdaje === "samo-prikaz"}
            velikosti={velikosti}
            trgovinaOdprta={nastavitve.trgovinaOdprta !== false}
            telefon={kontakt.telefon}
            telefonPovezava={kontakt.telefonPovezava}
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

      {izdelek.opis && (
        <section aria-labelledby="opis-izdelka" className="mt-14 max-w-prose border-t border-line pt-10">
          <h2 id="opis-izdelka" className="mb-4 type-h2 text-ink">
            O izdelku
          </h2>
          <RichText
            data={izdelek.opis as Parameters<typeof RichText>[0]["data"]}
            className="besedilo-cms"
          />
        </section>
      )}
    </Container>
  );
}
