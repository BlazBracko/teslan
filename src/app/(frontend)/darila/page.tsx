import type { Metadata } from "next";
import Link from "next/link";
import { LuArrowRight, LuGift } from "react-icons/lu";
import { SlikaIzdelka } from "@/components/katalog/SlikaIzdelka";
import { POT_KONFIGURATORJA, potPrograma } from "@/components/postavitev/navigacija";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Price } from "@/components/ui/Price";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cenaSkatle, izdelkiZaSkatlo, prilagodiVsebino, vsebinaZaPrikaz } from "@/darila/konfigurator";
import { naloziDarila } from "@/darila/podatki";
import { naloziKatalog } from "@/katalog/podatki";
import { trenutniMesec } from "@/katalog/sezona";
import { MESTO, stevilo } from "@/lib/sklanjanje";
import { metapodatkiStrani } from "@/seo/metapodatki";

export const metadata: Metadata = metapodatkiStrani({
  naslov: "Darila",
  opis: "Darilne škatle z domačimi izdelki Domačije Tešlan: izberite pripravljeno darilo ali sestavite svoje in ga pošljite obdarovancu.",
  pot: "/darila",
});

/** Programi, škatle in zaloga so iz CMS (predpomnjeni, Z17). */
export const dynamic = "force-dynamic";

/**
 * Darila (T5 korak 1): pripravljeni programi z vsebino in ceno ter
 * „Sestavi svoje darilo“ s tipi škatel. Cena programa upošteva samo
 * izdelke, ki so ta čas na voljo (enako kot konfigurator, Z53).
 */
export default async function DarilaPage() {
  const [darila, katalog] = await Promise.all([naloziDarila(), naloziKatalog()]);
  const izdelki = izdelkiZaSkatlo(katalog.izdelki, trenutniMesec());
  const tipi = new Map(darila.tipi.map((t) => [t.id, t]));

  const programi = darila.programi.flatMap((p) => {
    const tip = p.tipSkatleId != null ? tipi.get(p.tipSkatleId) : undefined;
    if (!tip) return [];
    const { vsebina, spremenjeni } = prilagodiVsebino(p.vsebina, izdelki, tip.steviloMest);
    const prikaz = vsebinaZaPrikaz(vsebina, izdelki);
    return [{ ...p, tip, prikaz, cena: cenaSkatle(tip.cenaCenti, prikaz), nepopolno: spremenjeni.length > 0 }];
  });

  return (
    <>
      <PageHeader
        label="Darila"
        title="Podarite domače"
        description="Darilne škatle z izdelki iz naše kuhinje. Izberite pripravljeno darilo ali sestavite svoje, dodajte sporočilo na kartici in ga pošljite neposredno obdarovancu."
      >
        <div className="order-last pt-2">
          <Button asChild size="lg">
            <Link href={POT_KONFIGURATORJA}>
              Sestavi svoje darilo
              <LuArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </PageHeader>

      <Container className="flex flex-col gap-14 py-10 md:py-14">
        {programi.length === 0 && darila.tipi.length === 0 ? (
          <EmptyState
            icon={<LuGift aria-hidden="true" />}
            title="Darila pripravljamo"
            description="Darilnih škatel ta čas ni. Pokličite nas, pa se dogovorimo za darilo po vaši želji."
          />
        ) : (
          <>
            {programi.length > 0 && (
              <section aria-labelledby="programi" className="flex flex-col gap-6">
                <SectionHeading id="programi" title="Pripravljena darila" description="Vsebino lahko pred nakupom spremenite." />
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {programi.map((p, i) => (
                    <li key={p.id}>
                      <Card interactive className="h-full" data-program={p.slug}>
                        <SlikaIzdelka
                          slika={p.slika}
                          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
                          prednostna={i === 0}
                          className="aspect-[4/3]"
                          nadomestnaOznaka={`${p.ime}: slika še ni na voljo`}
                        />
                        <div className="flex flex-1 flex-col gap-3 p-5">
                          <p className="type-caption text-ink-subtle">
                            {p.tip.ime} · {stevilo(p.tip.steviloMest, MESTO)}
                          </p>
                          <h3 className="type-h3 text-ink">
                            <Link
                              href={potPrograma(p.slug)}
                              className="outline-none after:absolute after:inset-0 after:content-['']"
                            >
                              {p.ime}
                            </Link>
                          </h3>
                          {p.opis && <p className="type-small text-ink-muted">{p.opis}</p>}
                          {p.prikaz.length > 0 && (
                            <ul className="flex flex-col gap-0.5 type-small text-ink-muted">
                              {p.prikaz.map((v) => (
                                <li key={`${v.izdelekId}:${v.velikostId}`}>
                                  {v.kolicina} × {v.ime}, {v.velikost}
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3">
                            <Price cents={p.cena} />
                            {p.nepopolno && <Badge variant="warning">Nekaj izdelkov ta čas ni</Badge>}
                          </div>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {darila.tipi.length > 0 && (
              <section aria-labelledby="sestavi" className="flex flex-col gap-6">
                <SectionHeading
                  id="sestavi"
                  title="Sestavite svoje darilo"
                  description="Izberite škatlo in jo napolnite z izdelki po svoji izbiri. Cena je cena škatle in izbranih izdelkov."
                />
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {darila.tipi.map((t) => (
                    <li key={t.id}>
                      <Card interactive className="h-full">
                        <div className="flex flex-1 flex-col gap-3 p-5">
                          <p className="flex items-center gap-2 type-caption text-ink-subtle">
                            <LuGift aria-hidden="true" className="size-4" />
                            {stevilo(t.steviloMest, MESTO)}
                          </p>
                          <h3 className="type-h3 text-ink">
                            <Link
                              href={`${POT_KONFIGURATORJA}?tip=${t.id}`}
                              className="outline-none after:absolute after:inset-0 after:content-['']"
                            >
                              {t.ime}
                            </Link>
                          </h3>
                          {t.opis && <p className="type-small text-ink-muted">{t.opis}</p>}
                          <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3">
                            <span className="type-small text-ink-muted">
                              Škatla <Price cents={t.cenaCenti} size="sm" /> + izdelki
                            </span>
                            {t.zaloga <= 0 && <Badge variant="neutral">Ni na zalogi</Badge>}
                          </div>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </Container>
    </>
  );
}
