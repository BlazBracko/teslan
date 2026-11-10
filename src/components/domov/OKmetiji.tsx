import Image from "next/image";
import Link from "next/link";
import { LuArrowRight, LuHandHeart, LuMapPin, LuSprout } from "react-icons/lu";
import Reveal from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const vrednote = [
  {
    ikona: LuMapPin,
    naslov: "Lokalno pridelano",
    opis: "Pridelki rastejo na naši zemlji v Podgori. Brez posrednikov, neposredno z njive k vam.",
  },
  {
    ikona: LuSprout,
    naslov: "Sveže iz sezone",
    opis: "Sveže prodajamo takrat, ko dozori. Kar ostane, posušimo, vložimo ali zmeljemo v začimbo.",
  },
  {
    ikona: LuHandHeart,
    naslov: "Ročno delo",
    opis: "Pobiramo ročno, izdelke pripravljamo v majhnih količinah in s čim manj embalaže.",
  },
];

/**
 * Kdo stoji za izdelki: fotografija nosilca kmetije, kratka zgodba in tri
 * vrednote. Kupec pri majhnem pridelovalcu kupuje tudi zaupanje, zato je
 * obraz kmetije na domači strani in ne le na strani „O nas“.
 */
export function OKmetiji() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
      <Reveal direction="left" className="lg:col-span-5">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-floating lg:aspect-[4/5]">
          <Image
            src="/sandi.jpg"
            alt="Sandi Derčar za stojnico Domačije Tešlan s svežo zelenjavo in šparglji"
            fill
            sizes="(min-width: 1024px) 30rem, 100vw"
            className="object-cover"
            style={{ objectPosition: "50% 30%" }}
          />
        </div>
      </Reveal>
      <div className="flex flex-col gap-8 lg:col-span-7">
        <SectionHeading
          label="Kdo smo"
          title="Družinska kmetija v Podgori"
          description="Že več kot 15 let pridelujemo zelenjavo in sadje ter iz njiju pripravljamo začimbe, posušeno sadje, marmelade in druge domače izdelke. Vse prodamo sami, zato veste, od kod prihaja vaša hrana."
        />
        <ul className="flex flex-col gap-5">
          {vrednote.map(({ ikona: Ikona, naslov, opis }) => (
            <li key={naslov} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <Ikona aria-hidden="true" className="size-5" />
              </span>
              <div className="flex flex-col gap-0.5">
                <h3 className="font-sans type-title text-ink">{naslov}</h3>
                <p className="type-small text-ink-muted">{opis}</p>
              </div>
            </li>
          ))}
        </ul>
        <Link
          href="/about"
          className="inline-flex min-h-11 items-center gap-2 self-start rounded-xs type-body font-medium text-brand underline underline-offset-4"
        >
          Več o kmetiji
          <LuArrowRight aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
