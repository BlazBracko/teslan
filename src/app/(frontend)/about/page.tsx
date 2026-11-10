import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  LuArrowRight,
  LuCalendarClock,
  LuCookingPot,
  LuGift,
  LuHandHeart,
  LuMail,
  LuMapPin,
  LuNavigation,
  LuPhone,
  LuRecycle,
  LuShoppingBag,
  LuSprout,
  LuStore,
} from "react-icons/lu";
import { KoledarSezone } from "@/components/domov/KoledarSezone";
import { POT_DARIL } from "@/components/postavitev/navigacija";
import { OznakaOsnutka } from "@/components/vsebina/OznakaOsnutka";
import { POT_TRGOVINE } from "@/katalog/nakup";
import { trenutniMesec } from "@/katalog/sezona";
import { Button } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { naloziKatalog, naloziKontakt } from "@/katalog/podatki";
import type { VrsticaKontakta } from "@/lib/kontakt";
import { JsonLd } from "@/components/seo/JsonLd";
import { okolje } from "@/env";
import { izvorStrani } from "@/seo/izvor";
import { lokalnoPodjetje } from "@/seo/json-ld";
import { metapodatkiStrani } from "@/seo/metapodatki";

export const metadata: Metadata = metapodatkiStrani({
  naslov: "O nas",
  opis: "Domačija Tešlan v Podgori pri Novem mestu že več kot 15 let prideluje zelenjavo in sadje ter pripravlja domače izdelke.",
  pot: "/about",
});

/** Kontakt je iz nastavitev trgovine, koledar sezone iz kataloga (baza). */
export const dynamic = "force-dynamic";

const vrednote = [
  {
    ikona: LuHandHeart,
    naslov: "Ročno delo",
    opis: "Pridelke negujemo in pobiramo ročno, izdelke pripravimo v domači kuhinji, v majhnih količinah.",
  },
  {
    ikona: LuMapPin,
    naslov: "Lokalno",
    opis: "Vse pridelamo na naši kmetiji v Podgori. Kratka pot od njive do vaše mize.",
  },
  {
    ikona: LuRecycle,
    naslov: "Trajnostno",
    opis: "Skrbimo za zemljo, ki nas hrani, in uporabljamo čim manj embalaže.",
  },
];

/** Pot pridelka od njive do kupca. OSNUTEK za lastnikov pregled. */
const pot = [
  {
    ikona: LuSprout,
    naslov: "Pridelamo",
    opis: "Šparglje, jagode, česen, krompir in drugo zelenjavo pridelamo na svojih njivah v Podgori. Sveže prodajamo, ko dozori.",
  },
  {
    ikona: LuCookingPot,
    naslov: "Predelamo",
    opis: "Kar ne gre sveže s kmetije, posušimo, liofiliziramo, zmeljemo v začimbo ali vložimo. V majhnih količinah, da okus ostane.",
  },
  {
    ikona: LuStore,
    naslov: "Prodamo sami",
    opis: "Na kmetiji in v spletni trgovini, brez posrednikov. Paket pošljemo po pošti ali ga pripravimo za prevzem.",
  },
];

export default async function AboutPage() {
  const [kontakt, katalog] = await Promise.all([naloziKontakt(), naloziKatalog()]);
  const mesec = trenutniMesec();
  const imaSezone = katalog.izdelki.some((i) => i.sezona !== null);

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
    { ikona: LuCalendarClock, oznaka: "Odprtost", vsebina: "Po dogovoru, pokličite pred obiskom" },
  ];
  const vrsticeKontakta = kandidati.filter((v): v is VrsticaKontakta => Boolean(v));

  return (
    <>
      <JsonLd podatki={lokalnoPodjetje(kontakt, izvorStrani(okolje()))} />
      <PageHeader
        label="Naša zgodba"
        title="O nas"
        description="Spoznajte Domačijo Tešlan in našo strast do kmetovanja in domače hrane."
      />

      <Section>
        <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="flex flex-col gap-4">
            <h2 className="type-h2 text-ink">Domačija Tešlan</h2>
            <p className="type-body-lg text-ink-muted">
              Kmetija Tešlan se nahaja na čudovitem območju Dolenjske, v vasi Podgora pri Novem mestu. Že več
              kot 15 let se ukvarjamo s kmetovanjem in pridelavo kakovostne hrane.
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
          <ul className="grid gap-4 md:grid-cols-3 md:gap-5">
            {vrednote.map(({ ikona: Ikona, naslov, opis }) => (
              <li key={naslov} className="flex gap-4 rounded-xl bg-canvas p-5 ring-1 ring-line md:flex-col md:gap-3 md:p-6">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <Ikona aria-hidden="true" className="size-6" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="type-h3 text-ink">{naslov}</h3>
                  <p className="type-small text-ink-muted">{opis}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section aria-labelledby="pot-naslov">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            id="pot-naslov"
            label="Kako delamo"
            title="Od njive do vaše mize"
            description="Vse, kar prodajamo, gre skozi naše roke."
          />
          <OznakaOsnutka>Opis dela na kmetiji je predlog. Popravite, kar ne drži ali bi radi povedali drugače.</OznakaOsnutka>
          <ol className="grid gap-4 md:grid-cols-3 md:gap-5">
            {pot.map(({ ikona: Ikona, naslov, opis }, i) => (
              <li key={naslov} className="flex gap-4 rounded-xl bg-surface p-5 shadow-raised ring-1 ring-line md:flex-col md:p-6">
                <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <Ikona aria-hidden="true" className="size-6" />
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-brand type-caption leading-none font-semibold text-on-brand"
                  >
                    {i + 1}
                  </span>
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-sans type-title text-ink">{naslov}</h3>
                  <p className="type-small text-ink-muted">{opis}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {imaSezone && (
        <Section tone="surface" className="border-y border-line" aria-labelledby="sezona-naslov">
          <Container className="flex flex-col gap-8 md:gap-10">
            <SectionHeading
              id="sezona-naslov"
              label="Sveže s kmetije"
              title="Koledar sezone"
              description="Kdaj so na kmetiji sveži pridelki. Pred obiskom nas pokličite, da vam jih pripravimo."
            />
            <KoledarSezone izdelki={katalog.izdelki} mesec={mesec} />
          </Container>
        </Section>
      )}

      <Section>
        <Container size="prose" className="flex flex-col gap-5 text-center">
          <h2 className="type-label text-accent">Naša misija</h2>
          <blockquote className="type-h3 text-ink">
            »Podpirati trajnostno kmetijstvo in ohranjanje okolja, ob tem pa nuditi kakovostno hrano in prijazno
            izkušnjo za vse, ki nas obiščejo.«
          </blockquote>
        </Container>
      </Section>

      <Section tone="muted" id="kontakt" aria-labelledby="kontakt-naslov">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            id="kontakt-naslov"
            title="Kontakt"
            description="Vedno smo veseli novih obrazov na kmetiji. Pokličite pred obiskom, da vas zagotovo pričakamo."
          />
          <ul className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
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

      <Section aria-labelledby="naprej-naslov">
        <Container className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <h2 id="naprej-naslov" className="type-h2 text-ink">
              Okusite, kar pridelamo
            </h2>
            <p className="type-body-lg text-ink-muted">
              Izdelke naročite v spletni trgovini ali sestavite darilo za nekoga, ki ima rad domače.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={POT_TRGOVINE}>
                <LuShoppingBag aria-hidden="true" />
                V spletno trgovino
                <LuArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={POT_DARIL}>
                <LuGift aria-hidden="true" />
                Darila
              </Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
