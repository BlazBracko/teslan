import Image from "next/image";
import { LuCalendarClock, LuMapPin, LuNavigation, LuPhone } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Kontakt, VrsticaKontakta } from "@/lib/kontakt";

/**
 * Obisk kmetije: naslov, telefon, odprtost in pot. Namesto vgrajenega
 * Google zemljevida je povezava nanj, ker vgrajen zemljevid nastavi
 * piškotke tretje strani, stran pa uporablja samo nujne (Z60).
 */
export function Obisk({ kontakt }: { kontakt: Kontakt }) {
  const kandidati: Array<VrsticaKontakta | null | false | ""> = [
    kontakt.naslov && {
      ikona: LuMapPin,
      oznaka: "Naslov",
      vsebina: kontakt.zemljevid ? (
        <a href={kontakt.zemljevid} target="_blank" rel="noopener noreferrer" className="rounded-xs hover:underline">
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
          <a href={kontakt.telefonPovezava} className="rounded-xs hover:underline">
            {kontakt.telefon}
          </a>
        ),
      },
    { ikona: LuCalendarClock, oznaka: "Odprtost", vsebina: "Po dogovoru, pokličite pred obiskom" },
  ];
  const vrstice = kandidati.filter((v): v is VrsticaKontakta => Boolean(v));

  return (
    <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
      <Reveal direction="left" className="lg:col-span-6">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-floating">
          <Image
            src="/slika1.jpeg"
            alt="Šparglji z Domačije Tešlan na žaru, v ozadju vas Podgora"
            fill
            sizes="(min-width: 1024px) 40rem, 100vw"
            className="object-cover"
            style={{ objectPosition: "50% 100%" }}
          />
        </div>
      </Reveal>
      <div className="flex flex-col gap-8 lg:col-span-6">
        <SectionHeading
          id="obisk-naslov"
          label="Obiščite nas"
          title="Pridite na kmetijo v Podgoro"
          description="Pridelke in izdelke lahko kupite tudi na kmetiji. Pokličite pred obiskom, da vas zagotovo pričakamo."
        />
        <ul className="flex flex-col gap-5">
          {vrstice.map(({ ikona: Ikona, oznaka, vsebina }) => (
            <li key={oznaka} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <Ikona aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="type-caption text-ink-subtle">{oznaka}</p>
                <div className="type-body font-medium text-ink">{vsebina}</div>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          {kontakt.pot && (
            <Button asChild>
              <a href={kontakt.pot} target="_blank" rel="noopener noreferrer">
                <LuNavigation aria-hidden="true" />
                Navodila za pot
                <span className="sr-only"> (odpre se v novem zavihku)</span>
              </a>
            </Button>
          )}
          {kontakt.telefon && kontakt.telefonPovezava && (
            <Button asChild variant="secondary">
              <a href={kontakt.telefonPovezava}>
                <LuPhone aria-hidden="true" />
                Pokličite {kontakt.telefon}
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
