import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import { LuArrowRight, LuCreditCard, LuGift, LuPackageCheck, LuShoppingBag, LuStore, LuTruck } from "react-icons/lu";
import { POT_DARIL } from "@/components/postavitev/navigacija";
import { Button } from "@/components/ui/Button";
import { POT_TRGOVINE } from "@/katalog/nakup";
import { formatirajCeno } from "@/lib/denar";

/**
 * Uvod domače strani v podobi stare (produkcijske) strani, ki je lastniku
 * ostala všeč: fotografija njive čez cel zaslon, zamegljena, čeznjo zelena
 * tančica in mreža drobnih pik, na sredini kremno besedilo.
 *
 * Fotografija je okras (prazen `alt`) in je zamegljena, zato se prenese v
 * majhni ločljivosti. Besedilo nima vstopne animacije: naslov je LCP in
 * mora biti tam takoj.
 *
 * Kontrast: tančica `brand-strong` pri 68 % je enako močna kot seštevek
 * obeh tančic stare strani, kjer je bilo za najsvetlejši del te fotografije
 * izmerjeno razmerje 5,0 : 1 za kremno besedilo.
 *
 * Na dnu je steklen trak s štirimi dejstvi o nakupu (dostava, poštnina,
 * prevzem, plačilo), ki jih kupec sicer išče po strani.
 */
export function Uvod({
  steviloIzdelkov,
  pragBrezplacnePostnineCenti,
  kartica,
}: {
  steviloIzdelkov: number;
  pragBrezplacnePostnineCenti: number;
  /** Ali je plačilo s kartico na voljo (brez Stripa se ne oglašuje). */
  kartica: boolean;
}) {
  const dejstva: Array<{ ikona: IconType; naslov: string; opis: string }> = [
    { ikona: LuTruck, naslov: "Pošiljamo po Sloveniji", opis: "Paket oddamo na pošto" },
    {
      ikona: LuPackageCheck,
      naslov: "Brezplačna poštnina",
      opis: `Pri naročilu nad ${formatirajCeno(pragBrezplacnePostnineCenti)}`,
    },
    { ikona: LuStore, naslov: "Prevzem na kmetiji", opis: "V Podgori, po dogovoru" },
    kartica
      ? { ikona: LuCreditCard, naslov: "Varno plačilo", opis: "S kartico ali ob prevzemu" }
      : { ikona: LuCreditCard, naslov: "Plačilo ob prevzemu", opis: "Brez predplačila" },
  ];
  const statistika: Array<[string, string]> = [
    ["15+", "let izkušenj"],
    [String(steviloIzdelkov), "izdelkov na spletu"],
    ["4 km", "od Novega mesta"],
  ];

  return (
    <section
      aria-labelledby="uvod-naslov"
      className="relative isolate -mt-glava flex min-h-svh flex-col overflow-hidden bg-brand-strong text-ink-inverse"
    >
      <Image
        src="/strawberryFields.jpg"
        alt=""
        fill
        preload
        sizes="(min-width: 1024px) 40vw, 60vw"
        className="-z-30 scale-110 object-cover blur-[14px]"
        style={{ objectPosition: "50% 22%" }}
      />
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-brand-strong/68" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 vzorec-pik opacity-[0.07]" />

      <div className="flex flex-1 flex-col items-center justify-center px-gutter pt-[calc(var(--spacing-glava)+1.25rem)] pb-8 text-center md:pt-[calc(var(--spacing-glava)+2rem)] md:pb-10">
        <p className="mb-5 inline-block rounded-full px-5 py-2.5 type-label text-ink-inverse ring-1 ring-ink-inverse/40 ring-inset md:mb-7">
          Domačija Tešlan · Dolenjska
        </p>
        <h1 id="uvod-naslov" className="mb-4 max-w-4xl type-display text-ink-inverse md:mb-5">
          Iz naše zemlje
          <br />
          na vašo <span className="text-brand-bright italic">mizo</span>
        </h1>
        <p className="mb-7 max-w-xl type-body-lg text-ink-inverse/85 md:mb-9">
          Zelenjava, sadje in domači izdelki s kmetije v Podgori pri Novem mestu. Naročite na spletu: pošljemo po
          pošti ali pripravimo za prevzem.
        </p>
        <div className="mb-8 flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row md:mb-10">
          <Button asChild size="lg" variant="bright">
            <Link href={POT_TRGOVINE}>
              <LuShoppingBag aria-hidden="true" />
              V spletno trgovino
              <LuArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outlineInverse">
            <Link href={POT_DARIL}>
              <LuGift aria-hidden="true" />
              Darila
            </Link>
          </Button>
        </div>
        <dl className="grid w-full max-w-2xl grid-cols-3 gap-4 md:gap-12">
          {statistika.map(([vrednost, oznaka]) => (
            <div key={oznaka} className="flex flex-col-reverse gap-1.5">
              <dt className="type-caption text-ink-inverse/75 md:type-label">{oznaka}</dt>
              <dd className="type-stat text-brand-bright">{vrednost}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="px-3 pb-11 lg:px-gutter-lg">
        <ul
          data-material=""
          aria-label="Nakup na kratko"
          className="mx-auto grid max-w-content grid-cols-2 gap-x-3 gap-y-3 rounded-[1.375rem] bg-brand/55 p-3.5 ring-1 ring-ink-inverse/15 backdrop-blur-xl ring-inset sm:gap-4 sm:p-5 lg:grid-cols-4 lg:gap-x-6"
        >
          {dejstva.map(({ ikona: Ikona, naslov, opis }) => (
            <li key={naslov} className="flex items-center gap-2.5 text-left sm:items-start sm:gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-inverse/12 text-brand-bright sm:size-10">
                <Ikona aria-hidden="true" className="size-4 sm:size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="type-caption leading-tight font-semibold text-ink-inverse sm:type-small">{naslov}</span>
                {/* Na telefonu samo naslovi, da uvod ostane na enem zaslonu. */}
                <span className="hidden type-caption text-ink-inverse/80 sm:block">{opis}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
