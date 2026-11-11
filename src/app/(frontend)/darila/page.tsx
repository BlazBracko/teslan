import type { Metadata } from "next";
import Link from "next/link";
import { LuArrowRight, LuGift, LuMessageSquareHeart, LuPackageOpen, LuSparkles, LuTruck } from "react-icons/lu";
import { KarticaPrograma } from "@/components/darila/KarticaPrograma";
import { PoslovnaDarila } from "@/components/darila/PoslovnaDarila";
import { RenderDarilneSkatle } from "@/components/darila/RenderDarilneSkatle";
import { POT_KONFIGURATORJA } from "@/components/postavitev/navigacija";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Price } from "@/components/ui/Price";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { naloziDarila } from "@/darila/podatki";
import { prazniskiCas, programiZaPrikaz } from "@/darila/predstavitev";
import { naloziKatalog, naloziKontakt } from "@/katalog/podatki";
import { trenutniMesec } from "@/katalog/sezona";
import { MESTO, stevilo } from "@/lib/sklanjanje";
import { metapodatkiStrani } from "@/seo/metapodatki";

export const metadata: Metadata = metapodatkiStrani({
  naslov: "Darila",
  opis: "Darilne škatle z domačimi izdelki Domačije Tešlan za praznike, poslovna darila in obiske: izberite pripravljeno darilo ali sestavite svoje in ga pošljite obdarovancu.",
  pot: "/darila",
});

/** Programi, škatle in zaloga so iz CMS (predpomnjeni, Z17). */
export const dynamic = "force-dynamic";

const KORAKI = [
  { ikona: LuPackageOpen, naslov: "Izberite škatlo", opis: "Pripravljeno darilo ali prazno škatlo za tri ali več izdelkov." },
  { ikona: LuGift, naslov: "Napolnite jo", opis: "S klikom na izdelek ga dodate v škatlo; sproti vidite prosta mesta in ceno." },
  { ikona: LuMessageSquareHeart, naslov: "Dodajte sporočilo", opis: "Vaše besede napišemo na kartico, ki jo priložimo v škatlo." },
  { ikona: LuTruck, naslov: "Pošljemo", opis: "Po pošti vam ali neposredno obdarovancu, ali pa jo prevzamete na kmetiji." },
];

/**
 * Darila (T5 korak 1): uvod z ilustracijo darilne škatle, kako
 * poteka nakup, pripravljeni programi z vsebino in ceno, škatle za lastno
 * sestavo in poslovna darila. Cena programa upošteva samo izdelke, ki so
 * ta čas na voljo (enako kot konfigurator, Z53).
 */
export default async function DarilaPage() {
  const [darila, katalog, kontakt] = await Promise.all([naloziDarila(), naloziKatalog(), naloziKontakt()]);
  const mesec = trenutniMesec();
  const danes = new Date();
  const praznicno = prazniskiCas(danes);
  const programi = programiZaPrikaz(darila, katalog.izdelki, mesec);

  return (
    <>
      {/* Ploskev sega pod plavajočo glavo (gl. PageHeader). */}
      <header className="relative isolate -mt-glava overflow-hidden border-b border-line bg-surface pt-glava">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 text-accent/10">
          <LuSparkles className="absolute top-8 left-[46%] size-16 rotate-12" />
          <LuSparkles className="absolute bottom-6 left-[4%] size-10 -rotate-12" />
        </div>
        <Container className="grid items-center gap-10 py-8 md:py-14 lg:grid-cols-12 lg:gap-14">
          <div className="flex flex-col items-start gap-5 lg:col-span-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 type-label text-accent-strong">
              <LuSparkles aria-hidden="true" className="size-4" />
              {praznicno ? `Prazniki ${danes.getFullYear()}` : "Darila"}
            </p>
            <h1 className="type-display text-ink">
              Podarite <span className="text-brand italic">domače</span>
            </h1>
            <p className="max-w-xl type-body-lg text-ink-muted">
              {praznicno
                ? "Darilne škatle z izdelki iz naše kuhinje za božič, novo leto in poslovna darila. Izberite pripravljeno darilo ali sestavite svoje, dodajte sporočilo na kartici in ga pošljite neposredno obdarovancu."
                : "Darilne škatle z izdelki iz naše kuhinje. Izberite pripravljeno darilo ali sestavite svoje, dodajte sporočilo na kartici in ga pošljite neposredno obdarovancu."}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="lg">
                <Link href={POT_KONFIGURATORJA}>
                  Sestavi svoje darilo
                  <LuArrowRight aria-hidden="true" />
                </Link>
              </Button>
              {programi.length > 0 && (
                <Button asChild size="lg" variant="secondary">
                  <Link href="#programi">Pripravljena darila</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm lg:col-span-6 lg:max-w-lg">
            <RenderDarilneSkatle oznaka="Ilustracija: odprta darilna škatla z domačimi izdelki, prevezana s trakom" />
          </div>
        </Container>
      </header>

      <Container className="flex flex-col gap-16 py-12 md:py-16">
        {programi.length === 0 && darila.tipi.length === 0 ? (
          <EmptyState
            icon={<LuGift aria-hidden="true" />}
            title="Darila pripravljamo"
            description="Darilnih škatel ta čas ni. Pokličite nas, pa se dogovorimo za darilo po vaši želji."
          />
        ) : (
          <>
            <section aria-labelledby="kako" className="flex flex-col gap-6">
              <h2 id="kako" className="sr-only">
                Kako poteka nakup darila
              </h2>
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {KORAKI.map(({ ikona: Ikona, naslov, opis }, i) => (
                  <li key={naslov} className="flex gap-4 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5">
                    <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                      <Ikona aria-hidden="true" className="size-5" />
                      <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-brand type-caption font-semibold text-on-brand">
                        {i + 1}
                      </span>
                    </span>
                    <div className="flex flex-col gap-1">
                      <h3 className="type-title text-ink">{naslov}</h3>
                      <p className="type-small text-ink-muted">{opis}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {programi.length > 0 && (
              <section aria-labelledby="programi" className="flex scroll-mt-24 flex-col gap-6">
                <SectionHeading
                  id="programi"
                  label="Izbrali smo za vas"
                  title="Pripravljena darila"
                  description="Vsebino lahko pred nakupom spremenite ali dopolnite."
                />
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {programi.map((p, i) => (
                    <li key={p.id}>
                      <KarticaPrograma program={p} prednostnaSlika={i === 0} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {darila.tipi.length > 0 && (
              <section aria-labelledby="sestavi" className="flex flex-col gap-6">
                <SectionHeading
                  id="sestavi"
                  label="Po vaši meri"
                  title="Sestavite svoje darilo"
                  description="Izberite škatlo in jo napolnite z izdelki po svoji izbiri. Cena je cena škatle in izbranih izdelkov."
                />
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {darila.tipi.map((t) => (
                    <li key={t.id}>
                      <Card interactive className="group h-full">
                        <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                          <Mesta stevilo={t.steviloMest} />
                          <div className="flex flex-col gap-1.5">
                            <p className="type-caption text-ink-subtle">{stevilo(t.steviloMest, MESTO)}</p>
                            <h3 className="type-h3 text-ink">
                              <Link
                                href={`${POT_KONFIGURATORJA}?tip=${t.id}`}
                                className="outline-none after:absolute after:inset-0 after:content-['']"
                              >
                                {t.ime}
                              </Link>
                            </h3>
                            {t.opis && <p className="type-small text-ink-muted">{t.opis}</p>}
                          </div>
                          <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-2">
                            <span className="type-small text-ink-muted">
                              Škatla <Price cents={t.cenaCenti} size="sm" /> + izdelki
                            </span>
                            {t.zaloga <= 0 ? (
                              <Badge variant="neutral">Ni na zalogi</Badge>
                            ) : (
                              <span className="inline-flex items-center gap-1 type-small font-medium text-brand">
                                Napolnite
                                <LuArrowRight
                                  aria-hidden="true"
                                  className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-0.5"
                                />
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <PoslovnaDarila kontakt={kontakt} />
          </>
        )}
      </Container>
    </>
  );
}

/** Prazna mesta škatle kot mreža kvadratkov (vizualni namig velikosti). */
function Mesta({ stevilo: n }: { stevilo: number }) {
  return (
    <div aria-hidden="true" className="flex flex-wrap gap-1.5 rounded-lg bg-surface-muted p-3">
      {Array.from({ length: Math.min(n, 24) }, (_, i) => (
        <span key={i} className="size-7 rounded-xs border-2 border-dashed border-line-strong bg-surface" />
      ))}
    </div>
  );
}
