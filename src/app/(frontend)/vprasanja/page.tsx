import type { Metadata } from "next";
import Link from "next/link";
import { LuMail, LuPhone } from "react-icons/lu";
import { POT_DOSTAVE } from "@/components/postavitev/navigacija";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { OznakaOsnutka } from "@/components/vsebina/OznakaOsnutka";
import { SeznamVprasanj } from "@/components/vsebina/SeznamVprasanj";
import { naloziKontakt, naloziNastavitve } from "@/katalog/podatki";
import { metapodatkiStrani } from "@/seo/metapodatki";
import { pogostaVprasanja, vprasanjaJsonLd } from "@/vsebina/vprasanja";

export const metadata: Metadata = metapodatkiStrani({
  naslov: "Pogosta vprašanja",
  opis: "Odgovori na pogosta vprašanja o naročilu, dostavi, prevzemu na kmetiji, plačilu, darilih in izdelkih Domačije Tešlan.",
  pot: "/vprasanja",
});

/** Zneski in kontakt so iz nastavitev trgovine (baza). */
export const dynamic = "force-dynamic";

/**
 * Pogosta vprašanja: sklopi z odgovori, kazalo sklopov in kontakt za vse,
 * česar tu ni. Besedila so osnutek (gl. `src/vsebina/vprasanja.ts`).
 */
export default async function VprasanjaPage() {
  const [nastavitve, kontakt] = await Promise.all([naloziNastavitve(), naloziKontakt()]);
  const sklopi = pogostaVprasanja({
    postninaCenti: nastavitve.postninaCenti,
    pragBrezplacnePostnineCenti: nastavitve.pragBrezplacnePostnineCenti,
    telefon: kontakt.telefon,
    email: kontakt.email,
    naslov: kontakt.naslov,
  });

  return (
    <>
      <JsonLd podatki={vprasanjaJsonLd(sklopi)} />
      <PageHeader
        label="Pomoč pri nakupu"
        title="Pogosta vprašanja"
        description="Kratki odgovori o naročilu, dostavi, plačilu in darilih. Če odgovora ne najdete, nas pokličite."
      />
      <Container className="grid gap-8 py-8 md:py-14 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14">
        <nav aria-label="Sklopi vprašanj" className="-mx-gutter lg:mx-0">
          <ul className="flex gap-2 overflow-x-auto px-gutter py-1 brez-drsnika lg:sticky lg:top-24 lg:flex-col lg:gap-1 lg:px-0">
            {sklopi.map((s) => (
              <li key={s.id} className="shrink-0">
                <Link
                  href={`#${s.id}`}
                  className="inline-flex h-10 items-center rounded-full bg-surface px-4 type-small font-medium whitespace-nowrap text-ink ring-1 ring-line-strong ring-inset hover:bg-surface-muted lg:w-full lg:rounded-lg lg:bg-transparent lg:ring-0"
                >
                  {s.naslov}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-10">
          <OznakaOsnutka>
            Odgovore je po pravilih trgovine pripravil razvijalec. Preverite predvsem roke pošiljanja in nasvete za
            shranjevanje.
          </OznakaOsnutka>

          {sklopi.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-naslov`} className="flex flex-col gap-4">
              <h2 id={`${s.id}-naslov`} className="type-h3 text-ink">
                {s.naslov}
              </h2>
              <SeznamVprasanj vprasanja={s.vprasanja} zSidri />
            </section>
          ))}

          <section
            aria-labelledby="vprasajte-naslov"
            className="flex flex-col gap-4 rounded-2xl bg-brand-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <div className="flex flex-col gap-1">
              <h2 id="vprasajte-naslov" className="type-h3 text-ink">
                Niste našli odgovora?
              </h2>
              <p className="type-body text-ink-muted">
                Pokličite ali pišite, z veseljem pomagamo. Vse o poštnini in prevzemu je na strani{" "}
                <Link href={POT_DOSTAVE} className="font-medium text-brand underline underline-offset-4">
                  Dostava in plačilo
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {kontakt.telefon && kontakt.telefonPovezava && (
                <Button asChild>
                  <a href={kontakt.telefonPovezava}>
                    <LuPhone aria-hidden="true" />
                    {kontakt.telefon}
                  </a>
                </Button>
              )}
              {kontakt.email && (
                <Button asChild variant="secondary">
                  <a href={`mailto:${kontakt.email}`}>
                    <LuMail aria-hidden="true" />
                    Pišite nam
                  </a>
                </Button>
              )}
            </div>
          </section>
        </div>
      </Container>
    </>
  );
}
