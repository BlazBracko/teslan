import type { Metadata } from "next";
import Image from "next/image";
import { LuLeaf, LuMail, LuMapPin, LuNavigation, LuPhone, LuRecycle } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { naloziKontakt } from "@/katalog/podatki";
import type { VrsticaKontakta } from "@/lib/kontakt";
import { JsonLd } from "@/components/seo/JsonLd";
import { okolje } from "@/env";
import { izvorStrani } from "@/seo/izvor";
import { lokalnoPodjetje } from "@/seo/json-ld";
import { metapodatkiStrani } from "@/seo/metapodatki";

export const metadata: Metadata = metapodatkiStrani({
  naslov: "O nas",
  opis: "Domačija Tešlan v Podgori pri Novem mestu se že več kot 15 let ukvarja z ekološkim kmetovanjem.",
  pot: "/about",
});

/** Kontakt je iz nastavitev trgovine (baza). */
export const dynamic = "force-dynamic";

const vrednote = [
  {
    ikona: LuLeaf,
    naslov: "Ekološko",
    opis: "Pridelujemo brez uporabe pesticidov in umetnih gnojil. Skrbimo za zdravo zemljo in zdravo hrano.",
  },
  {
    ikona: LuMapPin,
    naslov: "Lokalno",
    opis: "Vse pridelamo na naši kmetiji v Podgori. Kratka pot od njive do vaše mize.",
  },
  {
    ikona: LuRecycle,
    naslov: "Trajnostno",
    opis: "Spoštujemo naravo in uporabljamo trajnostne metode pridelave. Za boljši jutri.",
  },
];

export default async function AboutPage() {
  const kontakt = await naloziKontakt();

  const kandidati: Array<VrsticaKontakta | null | false | ""> = [
    kontakt.naslov && {
      ikona: LuMapPin,
      oznaka: "Naslov",
      vsebina: kontakt.zemljevid ? (
        <a href={kontakt.zemljevid} target="_blank" rel="noopener noreferrer" className="rounded-xs text-brand underline underline-offset-4">
          {kontakt.naslovVrstice.map((v) => (
            <span key={v} className="block">
              {v}
            </span>
          ))}
          <span className="sr-only"> (zemljevid se odpre v novem zavihku)</span>
        </a>
      ) : (
        kontakt.naslov
      ),
    },
    kontakt.telefon &&
      kontakt.telefonPovezava && {
        ikona: LuPhone,
        oznaka: "Telefon",
        vsebina: (
          <a href={kontakt.telefonPovezava} className="rounded-xs text-brand underline underline-offset-4">
            {kontakt.telefon}
          </a>
        ),
      },
    kontakt.email && {
      ikona: LuMail,
      oznaka: "E-pošta",
      vsebina: (
        <a href={`mailto:${kontakt.email}`} className="rounded-xs break-all text-brand underline underline-offset-4">
          {kontakt.email}
        </a>
      ),
    },
  ];
  const vrsticeKontakta = kandidati.filter((v): v is VrsticaKontakta => Boolean(v));

  return (
    <>
      <JsonLd podatki={lokalnoPodjetje(kontakt, izvorStrani(okolje()))} />
      <PageHeader
        label="Naša zgodba"
        title="O nas"
        description="Spoznajte Domačijo Tešlan in našo strast do ekološkega kmetovanja."
      />

      <Section>
        <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="flex flex-col gap-4">
            <h2 className="type-h2 text-ink">Domačija Tešlan</h2>
            <p className="type-body-lg text-ink-muted">
              Kmetija Tešlan se nahaja na čudovitem območju Dolenjske, v vasi Podgora pri Novem mestu. Že več
              kot 15 let se ukvarjamo z ekološkim kmetovanjem in pridelavo kakovostne hrane.
            </p>
            <p className="type-body text-ink-muted">
              Naša kmetija ponuja širok spekter lokalno pridelanih proizvodov, od svežih špargljev in zelenjave do
              liofiliziranega sadja, domačih testenin in naravnih začimb.
            </p>
            <p className="type-body text-ink-muted">
              Vse izdelke prodajamo neposredno strankam, brez posrednikov. Tako zagotavljamo svežino in
              kakovost, vi pa točno veste, od kod prihaja vaša hrana.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-floating">
            <Image
              src="/sandi.jpg"
              alt="Sandi Derčar za stojnico Domačije Tešlan s svežo zelenjavo in šparglji"
              fill
              preload
              fetchPriority="high"
              sizes="(min-width: 1024px) 36rem, 100vw"
              className="object-cover"
              /* Izvirnik je pokončen, okvir ležeč: obraz je na ~27 % višine. */
              style={{ objectPosition: "50% 32%" }}
            />
          </div>
        </Container>
      </Section>

      <Section tone="surface" className="border-y border-line">
        <Container className="flex flex-col gap-10">
          <SectionHeading title="Naše vrednote" />
          <ul className="grid gap-5 md:grid-cols-3">
            {vrednote.map(({ ikona: Ikona, naslov, opis }) => (
              <li key={naslov} className="flex flex-col gap-3 rounded-xl bg-canvas p-6 ring-1 ring-line">
                <span className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
                  <Ikona aria-hidden="true" className="size-6" />
                </span>
                <h3 className="type-h3 text-ink">{naslov}</h3>
                <p className="type-small text-ink-muted">{opis}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container size="prose" className="flex flex-col gap-5 text-center">
          <h2 className="type-label text-accent">Naša misija</h2>
          <blockquote className="type-h3 text-ink">
            »Podpirati trajnostno kmetijstvo in ohranjanje okolja, ob tem pa nuditi kakovostno hrano in prijazno
            izkušnjo za vse, ki nas obiščejo.«
          </blockquote>
        </Container>
      </Section>

      <Section tone="muted">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            title="Kontakt"
            description="Vedno smo veseli novih obrazov na kmetiji. Pokličite pred obiskom, da vas zagotovo pričakamo."
          />
          <ul className="grid gap-5 md:grid-cols-3">
            {vrsticeKontakta.map(({ ikona: Ikona, oznaka, vsebina }) => (
              <li key={oznaka} className="flex gap-4 rounded-xl bg-surface p-5 shadow-raised ring-1 ring-line">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <Ikona aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="type-caption text-ink-subtle">{oznaka}</p>
                  <div className="type-body font-medium text-ink">{vsebina}</div>
                </div>
              </li>
            ))}
          </ul>
          {kontakt.pot && (
            <Button asChild className="self-start">
              <a href={kontakt.pot} target="_blank" rel="noopener noreferrer">
                <LuNavigation aria-hidden="true" />
                Navodila za pot
                <span className="sr-only"> (odpre se v novem zavihku)</span>
              </a>
            </Button>
          )}
        </Container>
      </Section>
    </>
  );
}
