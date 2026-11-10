import type { Metadata } from "next";
import Link from "next/link";
import { LuInfo, LuSprout } from "react-icons/lu";
import { FilterKategorij } from "@/components/katalog/FilterKategorij";
import { FilterNakupa } from "@/components/katalog/FilterNakupa";
import { KarticaIzdelka } from "@/components/katalog/KarticaIzdelka";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  NACINI_NAKUPA,
  nacinNakupaIzParametra,
  potSeznama,
  ustrezaNacinuNakupa,
  type NacinNakupa,
} from "@/katalog/nakup";
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

/** Podatki so iz CMS (predpomnjeni, Z17), mesec za sezone je vedno trenuten. */
export const dynamic = "force-dynamic";

const GLAVE: Record<NacinNakupa, { oznaka: string; naslov: string; opis: string; namig?: string }> = {
  vse: {
    oznaka: "Ponudba",
    naslov: "Naši izdelki",
    opis: "Vse, kar pridelamo in predelamo na kmetiji v Podgori. Zgoraj izberite, ali želite naročiti na spletu ali kupiti na kmetiji.",
  },
  splet: {
    oznaka: "Spletna trgovina",
    naslov: "Naročite na spletu",
    opis: "Izdelki, ki jih lahko naročite takoj: pošljemo jih po pošti ali pripravimo za prevzem na kmetiji.",
    namig: "Izdelki z oznako »Samo prevzem na kmetiji« se ne pošiljajo; naročite jih na spletu in prevzamete v Podgori.",
  },
  kmetija: {
    oznaka: "V živo na kmetiji",
    naslov: "Samo na kmetiji",
    opis: "Sveže iz sezone, ki ga ne pošiljamo. Kupite ga na kmetiji v Podgori pri Novem mestu.",
    namig: "Teh izdelkov ni mogoče naročiti na spletu. Pred obiskom nas pokličite, da vam jih pripravimo.",
  },
};

/**
 * Seznam objavljenih izdelkov (Z14) s filtrom po načinu nakupa (spletna
 * trgovina, samo na kmetiji, vse) in kategoriji; oboje je v URL.
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ kategorija?: string | string[]; nakup?: string | string[] }>;
}) {
  const [katalog, iskanje] = await Promise.all([naloziKatalog(), searchParams]);
  const mesec = trenutniMesec();
  const nakup = nacinNakupaIzParametra(iskanje.nakup);
  const glava = GLAVE[nakup];

  const vNacinu = (n: NacinNakupa) => katalog.izdelki.filter((i) => ustrezaNacinuNakupa(i, n));
  const izdelkiNacina = vNacinu(nakup);
  const stevila = Object.fromEntries(NACINI_NAKUPA.map((n) => [n, vNacinu(n).length])) as Record<NacinNakupa, number>;
  const kategorijeNacinov = Object.fromEntries(
    NACINI_NAKUPA.map((n) => [n, new Set(vNacinu(n).map((i) => i.kategorija.slug))]),
  ) as Record<NacinNakupa, Set<string>>;

  // Kategorije v vrstnem redu iz CMS, samo tiste z vsaj enim izdelkom v izbranem načinu.
  const kategorije = katalog.kategorije
    .map((k) => ({ ...k, stevilo: izdelkiNacina.filter((i) => i.kategorija.id === k.id).length }))
    .filter((k) => k.stevilo > 0);

  // Neznana kategorija (stara povezava, tipkarska napaka) pokaže vse izdelke.
  const iskana = Array.isArray(iskanje.kategorija) ? iskanje.kategorija[0] : iskanje.kategorija;
  const izbrana = katalog.kategorije.find((k) => k.slug === iskana && kategorijeNacinov.vse.has(k.slug)) ?? null;
  const izdelki = izbrana ? izdelkiNacina.filter((i) => i.kategorija.id === izbrana.id) : izdelkiNacina;

  return (
    <>
      <PageHeader label={glava.oznaka} title={glava.naslov} description={glava.opis} />

      <Container className="flex flex-col gap-6 py-10 md:py-14">
        <FilterNakupa
          izbran={nakup}
          stevila={stevila}
          kategorija={izbrana?.slug ?? null}
          kategorijeNacinov={kategorijeNacinov}
        />

        {glava.namig && (
          <p className="flex items-start gap-2 rounded-lg bg-brand-soft px-4 py-3 type-small text-brand">
            <LuInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {glava.namig}
          </p>
        )}

        {kategorije.length > 1 && (
          <FilterKategorij
            kategorije={kategorije}
            izbrana={izbrana?.slug ?? null}
            steviloVseh={izdelkiNacina.length}
            nakup={nakup}
          />
        )}

        <p aria-live="polite" className="type-small text-ink-muted">
          {izbrana?.ime ?? "Vse kategorije"} · {stevilo(izdelki.length, IZDELEK)}
        </p>

        {izdelki.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {izdelki.map((izdelek, i) => (
              <li key={izdelek.id}>
                <KarticaIzdelka izdelek={izdelek} mesec={mesec} prednostnaSlika={i === 0} />
              </li>
            ))}
          </ul>
        ) : katalog.izdelki.length > 0 ? (
          <EmptyState
            icon={<LuSprout />}
            title="V tem izboru ni izdelkov"
            description="Poskusite z drugim načinom nakupa ali si oglejte celotno ponudbo."
            action={
              <Button asChild variant="secondary">
                <Link href={potSeznama({ kategorija: izbrana?.slug })}>Pokaži vse izdelke</Link>
              </Button>
            }
          />
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
