import type { Metadata } from "next";
import Link from "next/link";
import { LuChevronLeft } from "react-icons/lu";
import { Blagajna } from "@/components/blagajna/Blagajna";
import { POT_KOSARICE } from "@/components/postavitev/navigacija";
import { Container } from "@/components/ui/Container";
import { naloziKontakt, naloziNastavitve } from "@/katalog/podatki";
import { karticaNaVoljo } from "@/narocila/placila";

export const metadata: Metadata = {
  title: "Blagajna — Domačija Tešlan",
  description: "Oddaja naročila na Domačiji Tešlan.",
  robots: { index: false },
};

/**
 * Blagajna (Z25–Z27, T2 korak 3). Košarica je v brskalniku, zato se obrazec
 * izriše na odjemalcu; cene, zalogo in pravila dostave izračuna strežnik
 * in jih ob oddaji preveri še enkrat (v transakciji).
 */
export default async function BlagajnaPage() {
  const [nastavitve, kontakt] = await Promise.all([naloziNastavitve(), naloziKontakt()]);
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
        navodilaZaPrevzem={nastavitve.navodilaZaPrevzem?.trim() || null}
        naslovKmetije={kontakt.naslov}
        telefon={kontakt.telefon}
        telefonPovezava={kontakt.telefonPovezava}
      />
    </Container>
  );
}
