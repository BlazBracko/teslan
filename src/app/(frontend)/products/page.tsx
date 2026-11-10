import type { Metadata } from "next";
import Link from "next/link";
import { LuSprout } from "react-icons/lu";
import { FilterKategorij } from "@/components/katalog/FilterKategorij";
import { KarticaIzdelka } from "@/components/katalog/KarticaIzdelka";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { naloziKatalog } from "@/katalog/podatki";
import { trenutniMesec } from "@/katalog/sezona";
import { IZDELEK, stevilo } from "@/lib/sklanjanje";
import { metapodatkiStrani } from "@/seo/metapodatki";

export const metadata: Metadata = metapodatkiStrani({
  naslov: "Naši izdelki",
  opis: "Izdelki Domačije Tešlan: šparglji, začimbe, jajca, liofilizirano sadje, marmelade, olja in sokovi.",
  // Filter kategorije (`?kategorija=`) je ista stran, zato kanonični URL nima parametra.
  pot: "/products",
});

/**
 * Seznam vseh objavljenih izdelkov (Z14) s filtrom po kategoriji v URL.
 * Podatki so iz CMS (predpomnjeni, Z17), mesec za sezone je vedno trenuten.
 */
export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ kategorija?: string | string[] }>;
}) {
  const [katalog, { kategorija }] = await Promise.all([naloziKatalog(), searchParams]);
  const mesec = trenutniMesec();

  // Kategorije v vrstnem redu iz CMS, samo tiste z vsaj enim izdelkom.
  const kategorije = katalog.kategorije
    .map((k) => ({ ...k, stevilo: katalog.izdelki.filter((i) => i.kategorija.id === k.id).length }))
    .filter((k) => k.stevilo > 0);

  // Neznana kategorija (stara povezava, tipkarska napaka) pokaže vse izdelke.
  const iskana = Array.isArray(kategorija) ? kategorija[0] : kategorija;
  const izbrana = kategorije.find((k) => k.slug === iskana) ?? null;
  const izdelki = izbrana
    ? katalog.izdelki.filter((i) => i.kategorija.id === izbrana.id)
    : katalog.izdelki;

  return (
    <>
      <PageHeader
        label="Ponudba"
        title="Naši izdelki"
        description="Vse, kar pridelamo in predelamo na kmetiji v Podgori. Sveže iz sezone, začimbe, sadje, olja in domači izdelki."
      />

      <Container className="flex flex-col gap-6 py-10 md:py-14">
        <FilterKategorij kategorije={kategorije} izbrana={izbrana?.slug ?? null} steviloVseh={katalog.izdelki.length} />

        <p aria-live="polite" className="type-small text-ink-muted">
          {izbrana?.ime ?? "Vse kategorije"} · {stevilo(izdelki.length, IZDELEK)}
        </p>

        {izdelki.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {izdelki.map((izdelek, i) => (
              <li key={izdelek.id}>
                <KarticaIzdelka izdelek={izdelek} mesec={mesec} prednostnaSlika={i < 3} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<LuSprout />}
            title="V katalogu še ni izdelkov"
            description="Izdelke trenutno pripravljamo. Pokličite nas ali pridite na kmetijo."
            action={
              <Button asChild variant="secondary">
                <Link href="/about">Kontakt</Link>
              </Button>
            }
          />
        )}
      </Container>
    </>
  );
}
