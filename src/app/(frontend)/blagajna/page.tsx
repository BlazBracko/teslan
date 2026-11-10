import type { Metadata } from "next";
import Link from "next/link";
import { LuChevronLeft } from "react-icons/lu";
import { Blagajna } from "@/components/blagajna/Blagajna";
import { POT_KOSARICE } from "@/components/postavitev/navigacija";
import { Container } from "@/components/ui/Container";
import { naloziKontakt, naloziNastavitve } from "@/katalog/podatki";
import { karticaNaVoljo } from "@/narocila/placila";
import { metapodatkiStrani } from "@/seo/metapodatki";

export const metadata: Metadata = metapodatkiStrani({
  naslov: "Blagajna",
  opis: "Oddaja naročila na Domačiji Tešlan.",
  pot: "/blagajna",
  brezIndeksa: true,
});

/**
 * Blagajna (Z25–Z27, T2 korak 3). Košarica je v brskalniku, zato se obrazec
 * izriše na odjemalcu; cene, zalogo in pravila dostave izračuna strežnik
 * in jih ob oddaji preveri še enkrat (v transakciji).
 *
 * `?preklic=1`: kupec se je vrnil s Stripa, ker je plačilo prekinil (T3
 * korak 4); naročilo je že preklicano, košarica ostane.
 */
export default async function BlagajnaPage({ searchParams }: { searchParams: Promise<{ preklic?: string | string[] }> }) {
  const [nastavitve, kontakt, { preklic }] = await Promise.all([naloziNastavitve(), naloziKontakt(), searchParams]);
  return (
    <Container className="flex flex-col gap-8 py-10 md:py-14">
      <div className="flex flex-col gap-3">
        <Link
          href={POT_KOSARICE}
          className="inline-flex items-center gap-1 self-start rounded-xs type-small text-ink-muted hover:text-ink hover:underline"
        >
          <LuChevronLeft aria-hidden="true" className="size-4" />
          Nazaj v košarico
        </Link>
        <h1 className="type-h1 text-ink">Blagajna</h1>
      </div>
      <Blagajna
        trgovinaOdprta={nastavitve.trgovinaOdprta !== false}
        kartica={karticaNaVoljo()}
        placiloPrekinjeno={preklic === "1"}
        navodilaZaPrevzem={nastavitve.navodilaZaPrevzem?.trim() || null}
        naslovKmetije={kontakt.naslov}
        telefon={kontakt.telefon}
        telefonPovezava={kontakt.telefonPovezava}
      />
    </Container>
  );
}
