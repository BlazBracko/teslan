import type { Metadata } from "next";
import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";
import { DarilniProgram } from "@/components/domov/DarilniProgram";
import { KakoNarocite } from "@/components/domov/KakoNarocite";
import { KoledarSezone } from "@/components/domov/KoledarSezone";
import { Obisk } from "@/components/domov/Obisk";
import { OKmetiji } from "@/components/domov/OKmetiji";
import { SkupinePonudbe, type SkupinaZaPrikaz } from "@/components/domov/SkupinePonudbe";
import { Uvod } from "@/components/domov/Uvod";
import { KarticaIzdelka } from "@/components/katalog/KarticaIzdelka";
import { POT_VPRASANJ } from "@/components/postavitev/navigacija";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/Button";
import { Container, Section } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SeznamVprasanj } from "@/components/vsebina/SeznamVprasanj";
import { naloziDarila } from "@/darila/podatki";
import { prazniskiCas, programiZaPrikaz } from "@/darila/predstavitev";
import { okolje } from "@/env";
import { POT_TRGOVINE, potSeznama, ustrezaNacinuNakupa } from "@/katalog/nakup";
import { naloziKatalog, naloziKontakt, naloziNastavitve } from "@/katalog/podatki";
import { najnizjaNarocljivaCena } from "@/katalog/razpolozljivost";
import { izborZaDomov } from "@/katalog/razvrscanje";
import { trenutniMesec } from "@/katalog/sezona";
import { karticaNaVoljo } from "@/narocila/placila";
import { izvorStrani } from "@/seo/izvor";
import { lokalnoPodjetje } from "@/seo/json-ld";
import { metapodatkiStrani } from "@/seo/metapodatki";
import { izpostavljenaVprasanja, pogostaVprasanja } from "@/vsebina/vprasanja";

export const metadata: Metadata = metapodatkiStrani({
  naslov: null,
  opis: "Spletna trgovina Domačije Tešlan iz Podgore pri Novem mestu: šparglji, jagode, začimbe, liofilizirano sadje, darilne škatle in domači izdelki. Pošljemo po pošti ali pripravimo za prevzem na kmetiji.",
  pot: "/",
});

/** Ponudba in sezone so iz CMS (predpomnjeni, Z17). */
export const dynamic = "force-dynamic";

/** Koliko izdelkov pokaže izbor na domači strani (2 vrstici na telefonu, 1 na namizju). */
const IZBOR = 4;

/**
 * Domača stran (Z16, T1). Vrstni red sledi poti kupca:
 *
 *   uvod (fotografija čez cel zaslon)  kdo smo in kam naprej
 *   darilni program                    takoj pod uvodom, v novembru in decembru prazničen
 *   izbor iz trgovine                  izdelki, ki jih je mogoče naročiti takoj
 *   skupine ponudbe iz CMS             vstop v katalog po kategorijah
 *   naročilo v treh korakih            kaj se zgodi po kliku, poštnina, prevzem
 *   kdo smo                            obraz kmetije in vrednote
 *   koledar sezone                     kdaj so sveži pridelki
 *   obisk kmetije
 *   pogosta vprašanja (izbor)
 */
export default async function HomePage() {
  const [katalog, kontakt, darila, nastavitve] = await Promise.all([
    naloziKatalog(),
    naloziKontakt(),
    naloziDarila(),
    naloziNastavitve(),
  ]);
  const mesec = trenutniMesec();
  const danes = new Date();
  const trgovinaOdprta = nastavitve.trgovinaOdprta !== false;
  const programi = programiZaPrikaz(darila, katalog.izdelki, mesec);
  const narocljivih = katalog.izdelki.filter((i) => ustrezaNacinuNakupa(i, "splet")).length;
  const izbor = izborZaDomov(katalog.izdelki, mesec, IZBOR);
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
  const vprasanja = izpostavljenaVprasanja(
    pogostaVprasanja({
      postninaCenti: nastavitve.postninaCenti,
      pragBrezplacnePostnineCenti: nastavitve.pragBrezplacnePostnineCenti,
      telefon: kontakt.telefon,
      email: kontakt.email,
      naslov: kontakt.naslov,
    }),
  );
  const imaSezone = katalog.izdelki.some((i) => i.sezona !== null);

  return (
    <>
      <JsonLd podatki={lokalnoPodjetje(kontakt, izvorStrani(okolje()))} />
      <Uvod
        steviloIzdelkov={narocljivih}
        pragBrezplacnePostnineCenti={nastavitve.pragBrezplacnePostnineCenti}
        kartica={karticaNaVoljo()}
      />

      {(programi.length > 0 || darila.tipi.length > 0) && (
        <DarilniProgram
          programi={programi}
          kontakt={kontakt}
          praznicno={prazniskiCas(danes)}
          leto={danes.getFullYear()}
        />
      )}

      {izbor.length > 0 && (
        <Section aria-labelledby="izbor-naslov">
          <Container className="flex flex-col gap-8 md:gap-10">
            <SectionHeading
              id="izbor-naslov"
              label="Spletna trgovina"
              title="Iz naše kuhinje na vaš naslov"
              description="Izdelki, ki jih lahko naročite takoj. Pošljemo jih po pošti ali pripravimo za prevzem na kmetiji."
              action={
                <Button asChild variant="outline">
                  <Link href={POT_TRGOVINE}>
                    Vsa spletna trgovina
                    <LuArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              }
            />
            <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {izbor.map((izdelek) => (
                <li key={izdelek.id}>
                  <KarticaIzdelka
                    izdelek={izdelek}
                    mesec={mesec}
                    naslov="h3"
                    trgovinaOdprta={trgovinaOdprta}
                    sizes="(min-width: 1024px) 17rem, 50vw"
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      <Section tone="surface" className="border-y border-line">
        <Container>
          <SkupinePonudbe skupine={skupine} steviloIzdelkov={katalog.izdelki.length} />
        </Container>
      </Section>

      <Section>
        <Container>
          <KakoNarocite
            postninaCenti={nastavitve.postninaCenti}
            pragBrezplacnePostnineCenti={nastavitve.pragBrezplacnePostnineCenti}
          />
        </Container>
      </Section>

      <Section tone="surface" className="border-y border-line">
        <Container>
          <OKmetiji />
        </Container>
      </Section>

      {imaSezone && (
        <Section aria-labelledby="sezona-naslov">
          <Container className="flex flex-col gap-8 md:gap-10">
            <SectionHeading
              id="sezona-naslov"
              label="Sveže s kmetije"
              title="Koledar sezone"
              description="Sveže pridelke prodajamo na kmetiji, ko dozorijo. Pred obiskom nas pokličite, da vam jih pripravimo."
              action={
                <Button asChild variant="outline">
                  <Link href={potSeznama({ nakup: "kmetija" })}>
                    Na kmetiji
                    <LuArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              }
            />
            <KoledarSezone izdelki={katalog.izdelki} mesec={mesec} />
          </Container>
        </Section>
      )}

      <Section id="obisk" tone="muted" aria-labelledby="obisk-naslov">
        <Container>
          <Obisk kontakt={kontakt} />
        </Container>
      </Section>

      {vprasanja.length > 0 && (
        <Section aria-labelledby="vprasanja-naslov">
          <Container className="grid gap-8 lg:grid-cols-12 lg:gap-14">
            <SectionHeading
              id="vprasanja-naslov"
              className="lg:col-span-4"
              label="Pomoč pri nakupu"
              title="Pogosta vprašanja"
              description="Poštnina, prevzem, plačilo in darila na kratko."
            />
            <div className="flex flex-col items-start gap-5 lg:col-span-8">
              <SeznamVprasanj vprasanja={vprasanja} className="w-full" />
              <Link
                href={POT_VPRASANJ}
                className="inline-flex min-h-11 items-center gap-2 rounded-xs type-body font-medium text-brand underline underline-offset-4"
              >
                Vsa vprašanja in odgovori
                <LuArrowRight aria-hidden="true" />
              </Link>
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
