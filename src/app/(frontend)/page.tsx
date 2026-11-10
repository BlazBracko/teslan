import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LuArrowRight, LuGift, LuHandHeart, LuMapPin, LuShoppingBag, LuSprout } from "react-icons/lu";
import { DarilniProgram } from "@/components/domov/DarilniProgram";
import { Obisk } from "@/components/domov/Obisk";
import { SkupinePonudbe, type SkupinaZaPrikaz } from "@/components/domov/SkupinePonudbe";
import { Button } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { POT_DARIL } from "@/components/postavitev/navigacija";
import { naloziDarila } from "@/darila/podatki";
import { prazniskiCas, programiZaPrikaz } from "@/darila/predstavitev";
import { POT_TRGOVINE } from "@/katalog/nakup";
import { naloziKatalog, naloziKontakt } from "@/katalog/podatki";
import { najnizjaNarocljivaCena } from "@/katalog/razpolozljivost";
import { trenutniMesec } from "@/katalog/sezona";
import { JsonLd } from "@/components/seo/JsonLd";
import { okolje } from "@/env";
import { izvorStrani } from "@/seo/izvor";
import { lokalnoPodjetje } from "@/seo/json-ld";
import { metapodatkiStrani } from "@/seo/metapodatki";

export const metadata: Metadata = metapodatkiStrani({
  naslov: null,
  opis: "Spletna trgovina Domačije Tešlan iz Podgore pri Novem mestu: šparglji, jagode, začimbe, liofilizirano sadje, darilne škatle in domači izdelki. Pošljemo po pošti ali pripravimo za prevzem na kmetiji.",
  pot: "/",
});

/** Ponudba in sezone so iz CMS (predpomnjeni, Z17). */
export const dynamic = "force-dynamic";

const vrednote = [
  {
    ikona: LuMapPin,
    naslov: "Lokalno pridelano",
    opis: "Vsak pridelek raste na naši zemlji v Podgori. Brez posrednikov, neposredno z njive k vam.",
  },
  {
    ikona: LuSprout,
    naslov: "Vedno sveže",
    opis: "Pobrano zjutraj, pri vas popoldne. Naši izdelki ne potujejo po skladiščih in trgovinah.",
  },
  {
    ikona: LuHandHeart,
    naslov: "Ročno delo",
    opis: "Pridelke negujemo in pobiramo ročno, izdelke pripravimo v majhnih količinah in z uporabo čim manj embalaže.",
  },
];

/**
 * Domača stran (Z16, T1): uvod s potjo v spletno trgovino, takoj pod njim
 * darilni program (v novembru in decembru prazničen), skupine ponudbe iz
 * CMS z najnižjo naročljivo ceno, vrednote in obisk kmetije.
 */
export default async function HomePage() {
  const [katalog, kontakt, darila] = await Promise.all([naloziKatalog(), naloziKontakt(), naloziDarila()]);
  const mesec = trenutniMesec();
  const danes = new Date();
  const programi = programiZaPrikaz(darila, katalog.izdelki, mesec);
  const narocljivih = katalog.izdelki.filter((i) => i.nacinProdaje !== "samo-prikaz").length;
  const skupine: SkupinaZaPrikaz[] = katalog.skupine.map((skupina) => {
    const izdelki = katalog.izdelki.filter((i) => skupina.kategorije.includes(i.kategorija.id));
    const cene = izdelki.map((i) => najnizjaNarocljivaCena(i, mesec)).filter((c): c is number => c !== null);
    return {
      ...skupina,
      odCenti: cene.length > 0 ? Math.min(...cene) : null,
      kategorijeSkupine: katalog.kategorije.filter(
        (k) => skupina.kategorije.includes(k.id) && izdelki.some((i) => i.kategorija.id === k.id),
      ),
    };
  });

  return (
    <>
      <JsonLd podatki={lokalnoPodjetje(kontakt, izvorStrani(okolje()))} />
      {/* Uvod: velik naslov in fotografija njive. Brez vstopne animacije:
          naslov in slika sta LCP in morata biti tam takoj. */}
      <section className="bg-surface">
        <Container className="grid items-center gap-10 py-12 md:py-16 lg:grid-cols-12 lg:gap-14 lg:py-20">
          <div className="flex flex-col items-start gap-6 lg:col-span-6">
            <p className="type-label text-accent">Domačija Tešlan · Podgora, Dolenjska</p>
            <h1 className="type-display text-ink">
              Iz naše zemlje <span className="text-brand italic">na vašo mizo</span>
            </h1>
            <p className="max-w-xl type-body-lg text-ink-muted">
              Zelenjava, sadje in domači izdelki iz naše kuhinje, neposredno s kmetije pri Novem mestu. Naročite v
              spletni trgovini: pošljemo po pošti ali pripravimo za prevzem na kmetiji.
            </p>
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
            <dl className="mt-4 grid grid-cols-3 gap-6 border-t border-line pt-6 sm:gap-10">
              {[
                ["15+", "let izkušenj"],
                [String(narocljivih), "izdelkov za naročilo na spletu"],
                ["4 km", "od Novega mesta"],
              ].map(([vrednost, oznaka]) => (
                <div key={oznaka} className="flex flex-col-reverse gap-1">
                  <dt className="type-caption text-ink-muted">{oznaka}</dt>
                  <dd className="type-stat text-brand">{vrednost}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-floating sm:aspect-[4/3] lg:col-span-6 lg:aspect-[4/5]">
            <Image
              src="/strawberryFields.jpg"
              alt="Nasad jagod na njivi Domačije Tešlan"
              fill
              preload
              fetchPriority="high"
              sizes="(min-width: 1024px) 40rem, 100vw"
              className="object-cover"
            />
          </div>
        </Container>
      </section>

      {(programi.length > 0 || darila.tipi.length > 0) && (
        <DarilniProgram
          programi={programi}
          kontakt={kontakt}
          praznicno={prazniskiCas(danes)}
          leto={danes.getFullYear()}
        />
      )}

      <Section tone="surface" className="border-y border-line">
        <Container>
          <SkupinePonudbe skupine={skupine} steviloIzdelkov={katalog.izdelki.length} />
        </Container>
      </Section>

      <Section>
        <Container className="flex flex-col gap-10">
          <SectionHeading label="Kdo smo" title="Naše vrednote" />
          <ul className="grid gap-5 md:grid-cols-3">
            {vrednote.map(({ ikona: Ikona, naslov, opis }) => (
              <li key={naslov} className="flex flex-col gap-3 rounded-xl bg-surface p-6 shadow-raised ring-1 ring-line">
                <span className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
                  <Ikona aria-hidden="true" className="size-6" />
                </span>
                <h3 className="type-h3 text-ink">{naslov}</h3>
                <p className="type-small text-ink-muted">{opis}</p>
              </li>
            ))}
          </ul>
          <Link href="/about" className="inline-flex items-center gap-2 self-start rounded-xs type-body font-medium text-brand underline underline-offset-4">
            Več o kmetiji
            <LuArrowRight aria-hidden="true" />
          </Link>
        </Container>
      </Section>

      <Section id="obisk" tone="muted" aria-labelledby="obisk-naslov">
        <Container>
          <Obisk kontakt={kontakt} />
        </Container>
      </Section>
    </>
  );
}
