import type { Metadata } from "next";
import Link from "next/link";
import { KonfiguratorStran, type ZacetekKonfiguratorja } from "@/components/darila/Konfigurator";
import { POT_DARIL, POT_KONFIGURATORJA, potPrograma } from "@/components/postavitev/navigacija";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { izdelkiZaSkatlo, prilagodiVsebino } from "@/darila/konfigurator";
import { naloziDarila } from "@/darila/podatki";
import { naloziKatalog, naloziKontakt, naloziNastavitve } from "@/katalog/podatki";
import { trenutniMesec } from "@/katalog/sezona";
import { metapodatkiStrani } from "@/seo/metapodatki";

export async function generateMetadata({ searchParams }: Parametri): Promise<Metadata> {
  // Pripravljen program je samostojna vsebina (v zemljevidu strani), zato ga
  // kanonični URL ohrani; ostali parametri (`tip`, `uredi`) ne.
  const slug = prvi((await searchParams).program);
  const program = slug ? (await naloziDarila()).programi.find((p) => p.slug === slug) : undefined;
  return metapodatkiStrani({
    naslov: program ? `${program.ime}: sestavite darilo` : "Sestavite darilo",
    opis: program?.opis ?? "Izberite darilno škatlo, napolnite jo z domačimi izdelki in dodajte sporočilo na kartici.",
    pot: program ? potPrograma(program.slug) : POT_KONFIGURATORJA,
    slike: program?.slika ? [{ ...program.slika, width: program.slika.sirina, height: program.slika.visina }] : undefined,
  });
}

/** Zaloga in sezone so vedno trenutne. */
export const dynamic = "force-dynamic";

type Parametri = { searchParams: Promise<{ program?: string | string[]; tip?: string | string[]; uredi?: string | string[] }> };

const prvi = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Konfigurator darilne škatle (T5 korak 2–4): `?program=<slug>` začne s
 * pripravljenim programom (nedosegljive postavke odstrani in o tem
 * obvesti, Z53), `?tip=<id>` z izbrano škatlo, `?uredi=<id>` uredi škatlo
 * iz košarice (njeno vsebino prebere brskalnik).
 */
export default async function SestaviPage({ searchParams }: Parametri) {
  const [iskanje, darila, katalog, nastavitve, kontakt] = await Promise.all([
    searchParams,
    naloziDarila(),
    naloziKatalog(),
    naloziNastavitve(),
    naloziKontakt(),
  ]);
  const izdelki = izdelkiZaSkatlo(katalog.izdelki, trenutniMesec());
  const slug = prvi(iskanje.program);
  const program = slug ? darila.programi.find((p) => p.slug === slug) : undefined;
  const tipProgramaAktiven = program && darila.tipi.some((t) => t.id === program.tipSkatleId);

  let zacetek: ZacetekKonfiguratorja = { tipSkatleId: null, vsebina: [], program: null, spremenjeni: [] };
  if (program) {
    const tip = darila.tipi.find((t) => t.id === program.tipSkatleId);
    const { vsebina, spremenjeni } = prilagodiVsebino(program.vsebina, izdelki, tip?.steviloMest);
    zacetek = {
      tipSkatleId: tipProgramaAktiven ? program.tipSkatleId : null,
      vsebina,
      program: { slug: program.slug, ime: program.ime },
      spremenjeni,
      obvestilo: tipProgramaAktiven ? undefined : "Škatle tega darila ta čas ni. Izberite drugo škatlo.",
    };
  } else if (slug) {
    zacetek.obvestilo = "Tega darila ni več v ponudbi. Sestavite svoje.";
  } else {
    const tipId = Number(prvi(iskanje.tip));
    if (darila.tipi.some((t) => t.id === tipId && t.zaloga > 0)) zacetek.tipSkatleId = tipId;
  }
  const uredi = prvi(iskanje.uredi) ?? null;

  return (
    <>
      <PageHeader
        label={
          <Link href={POT_DARIL} className="hover:underline">
            Darila
          </Link>
        }
        title={uredi ? "Uredite darilo" : program ? program.ime : "Sestavite svoje darilo"}
        description={
          program?.opis ??
          "Izberite škatlo in jo napolnite z izdelki iz naše kuhinje. Dodate lahko sporočilo na kartici."
        }
      />
      <Container className="py-10 md:py-14">
        <KonfiguratorStran
          uredi={uredi}
          zacetek={zacetek}
          tipi={darila.tipi}
          izdelki={izdelki}
          trgovinaOdprta={nastavitve.trgovinaOdprta !== false}
          telefon={kontakt.telefon}
          telefonPovezava={kontakt.telefonPovezava}
        />
      </Container>
    </>
  );
}
