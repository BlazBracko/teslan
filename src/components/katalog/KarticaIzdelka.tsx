import Link from "next/link";
import { LuArrowRight, LuStore, LuTruck } from "react-icons/lu";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import type { IzdelekPogled } from "@/katalog/podatki";
import {
  cenaNaKartici,
  oznakaNacinaProdaje,
  razpolozljivostIzdelka,
  razpolozljivostVelikosti,
  type VrstaRazpolozljivosti,
} from "@/katalog/razpolozljivost";
import type { Mesec } from "@/katalog/sezona";
import { stevilo, VELIKOST } from "@/lib/sklanjanje";
import { cn } from "@/lib/utils";
import { HitroVKosarico } from "./HitroVKosarico";
import { SlikaIzdelka } from "./SlikaIzdelka";

export const potIzdelka = (slug: string) => `/products/${slug}`;

/** Barva pike ob razpoložljivosti; pomen nosi besedilo (Z13). */
const pika: Record<VrstaRazpolozljivosti, string> = {
  "na-zalogi": "bg-success",
  malo: "bg-warning",
  "ni-na-zalogi": "bg-line-strong",
  kmalu: "bg-accent",
  "izven-sezone": "bg-line-strong",
  "na-kmetiji": "bg-brand",
};

/**
 * Kartica izdelka na seznamu (Z14). Narejena je za hiter pregled, tudi v
 * dveh stolpcih na telefonu: slika, ime v pisavi vmesnika (berljivejša od
 * naslovne pri majhni velikosti), velikost, velika cena ter dve kratki
 * vrstici z razpoložljivostjo in načinom dostave namesto značk, ki so se
 * na ozki kartici lomile.
 *
 * Na telefonu je kartica še bolj zbita: brez kategorije in brez vrstice
 * „Pošljemo po pošti“ (to velja za vse v spletni trgovini); ostane samo
 * „Na voljo na kmetiji“, ki kupca opozori na izjemo.
 *
 * Cela kartica je povezava na podstran (raztegnjena povezava na imenu, da
 * bralnik zaslona prebere samo ime). Izdelek z eno samo velikostjo ima še
 * gumb, ki ga doda v košarico neposredno s seznama.
 */
export function KarticaIzdelka({
  izdelek,
  mesec,
  naslov: Naslov = "h2",
  prednostnaSlika = false,
  trgovinaOdprta = true,
  sizes = "(min-width: 1280px) 17rem, (min-width: 1024px) 22rem, (min-width: 640px) 33vw, 50vw",
}: {
  izdelek: IzdelekPogled;
  mesec: Mesec;
  naslov?: "h2" | "h3";
  prednostnaSlika?: boolean;
  /** Zaprta trgovina (Z27) nima gumba za hiter nakup. */
  trgovinaOdprta?: boolean;
  sizes?: string;
}) {
  const cena = cenaNaKartici(izdelek, mesec);
  const razpolozljivost = razpolozljivostIzdelka(izdelek, mesec);
  const nacin = oznakaNacinaProdaje(izdelek.nacinProdaje);
  const IkonaNacina = izdelek.nacinProdaje === "posta-in-prevzem" ? LuTruck : LuStore;
  const edina = izdelek.velikosti.length === 1 ? izdelek.velikosti[0] : null;
  const hitro =
    trgovinaOdprta && edina && razpolozljivostVelikosti(izdelek, edina, mesec).narocljiva ? edina : null;
  const velikost =
    izdelek.nacinProdaje === "samo-prikaz"
      ? null
      : edina
        ? edina.oznaka
        : stevilo(izdelek.velikosti.length, VELIKOST);

  return (
    <Card interactive className="h-full" data-izdelek={izdelek.slug}>
      <SlikaIzdelka
        slika={izdelek.slike[0]}
        sizes={sizes}
        prednostna={prednostnaSlika}
        className={cn("aspect-square sm:aspect-[4/3]", !razpolozljivost.narocljiva && "opacity-80")}
        nadomestnaOznaka={`${izdelek.ime}: slika še ni na voljo`}
      />
      <div className="flex flex-1 flex-col gap-1 p-3 sm:gap-2 sm:p-4">
        <p className="hidden type-caption text-ink-subtle sm:block">{izdelek.kategorija.ime}</p>
        <Naslov className="font-sans text-[0.9375rem] leading-snug font-semibold tracking-[-0.011em] text-ink sm:type-title">
          <Link href={potIzdelka(izdelek.slug)} className="outline-none after:absolute after:inset-0 after:content-['']">
            {izdelek.ime}
          </Link>
        </Naslov>
        {izdelek.kratekOpis && (
          <p className="hidden type-small text-ink-muted sm:line-clamp-2">{izdelek.kratekOpis}</p>
        )}
        <ul className="flex flex-col gap-1 type-caption text-ink-muted sm:type-small">
          <li className="flex items-baseline gap-2">
            <span aria-hidden="true" className={cn("size-2 shrink-0 translate-y-[-1px] rounded-full", pika[razpolozljivost.vrsta])} />
            <span className={cn(razpolozljivost.narocljiva && "font-medium text-ink")}>{razpolozljivost.oznaka}</span>
          </li>
          {nacin && (
            <li
              className={cn(
                "flex items-start gap-1.5",
                izdelek.nacinProdaje === "posta-in-prevzem" && "max-sm:hidden",
              )}
            >
              <IkonaNacina aria-hidden="true" className="mt-[0.15em] size-3.5 shrink-0" />
              <span>{nacin}</span>
            </li>
          )}
        </ul>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5 sm:pt-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            {velikost && <span className="type-caption text-ink-subtle">{velikost}</span>}
            {cena && <Price cents={cena.centi} from={cena.od} size="card" />}
          </div>
          {hitro ? (
            <HitroVKosarico
              izdelekId={izdelek.id}
              velikostId={hitro.id}
              ime={izdelek.ime}
              velikost={hitro.oznaka}
              zaloga={hitro.zaloga ?? 0}
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-full text-brand sm:size-11 ring-1 ring-line-strong ring-inset"
            >
              <LuArrowRight className="size-5" />
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
