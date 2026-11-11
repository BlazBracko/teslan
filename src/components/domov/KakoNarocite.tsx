import Link from "next/link";
import { LuArrowRight, LuMousePointerClick, LuPackageCheck, LuTruck } from "react-icons/lu";
import { POT_DOSTAVE } from "@/components/postavitev/navigacija";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatirajCeno } from "@/lib/denar";

/**
 * Kako poteka naročilo, v treh korakih. Kupec, ki kmetije ne pozna, tu izve,
 * kaj se zgodi po kliku „V košarico“, koliko stane poštnina in da lahko
 * naročilo prevzame tudi sam. Zneski so iz nastavitev trgovine.
 */
export function KakoNarocite({
  postninaCenti,
  pragBrezplacnePostnineCenti,
}: {
  postninaCenti: number;
  pragBrezplacnePostnineCenti: number;
}) {
  const koraki = [
    {
      ikona: LuMousePointerClick,
      naslov: "Izberite izdelke",
      opis: "Dodajte jih v košarico. Račun in prijava nista potrebna, košarica vas počaka tudi do naslednjič.",
    },
    {
      ikona: LuTruck,
      naslov: "Izberite dostavo",
      opis: `Po pošti za ${formatirajCeno(postninaCenti)} (nad ${formatirajCeno(pragBrezplacnePostnineCenti)} brezplačno) ali brezplačen prevzem na kmetiji v Podgori.`,
    },
    {
      ikona: LuPackageCheck,
      naslov: "Pripravimo naročilo",
      opis: "Potrdilo dobite na e-pošto. Sporočimo vam, ko paket oddamo na pošto ali ko je pripravljen za prevzem.",
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <SectionHeading
        label="Nakup"
        title="Naročilo v treh korakih"
        action={
          <Link
            href={POT_DOSTAVE}
            className="inline-flex min-h-11 items-center gap-2 rounded-xs type-body font-medium text-brand underline underline-offset-4"
          >
            Dostava in plačilo
            <LuArrowRight aria-hidden="true" />
          </Link>
        }
      />
      <ol className="grid gap-4 md:grid-cols-3 md:gap-5">
        {koraki.map(({ ikona: Ikona, naslov, opis }, i) => (
          <li key={naslov} className="flex gap-4 rounded-xl bg-surface p-4 shadow-raised ring-1 ring-line sm:p-5 md:flex-col md:p-6">
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
              <h3 className="font-sans type-title text-ink">
                <span className="sr-only">{i + 1}. korak: </span>
                {naslov}
              </h3>
              <p className="type-small text-ink-muted">{opis}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
