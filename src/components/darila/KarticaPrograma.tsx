import Link from "next/link";
import { LuArrowRight, LuGift } from "react-icons/lu";
import { SlikaIzdelka } from "@/components/katalog/SlikaIzdelka";
import { potPrograma } from "@/components/postavitev/navigacija";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import type { ProgramZaPrikaz } from "@/darila/predstavitev";
import { MESTO, stevilo } from "@/lib/sklanjanje";

/**
 * Kartica pripravljenega darila (domača stran in Darila): slika, škatla,
 * vsebina kot oznake in cena. Cela kartica vodi v konfigurator s tem
 * programom (raztegnjena povezava na imenu).
 */
export function KarticaPrograma({
  program: p,
  naslov: Naslov = "h3",
  prednostnaSlika = false,
}: {
  program: ProgramZaPrikaz;
  naslov?: "h2" | "h3";
  prednostnaSlika?: boolean;
}) {
  return (
    <Card interactive className="group h-full" data-program={p.slug}>
      <div className="relative">
        <SlikaIzdelka
          slika={p.slika}
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
          prednostna={prednostnaSlika}
          className="aspect-[4/3]"
          nadomestnaOznaka={`${p.ime}: slika še ni na voljo`}
        />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1 type-caption font-medium text-ink shadow-raised">
          <LuGift aria-hidden="true" className="size-3.5 text-accent" />
          {p.tip.ime} · {stevilo(p.tip.steviloMest, MESTO)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <Naslov className="type-h3 text-ink">
          <Link href={potPrograma(p.slug)} className="outline-none after:absolute after:inset-0 after:content-['']">
            {p.ime}
          </Link>
        </Naslov>
        {p.opis && <p className="type-small text-ink-muted">{p.opis}</p>}
        {p.prikaz.length > 0 && (
          <ul aria-label={`V škatli: ${p.ime}`} className="flex flex-wrap gap-1.5">
            {p.prikaz.map((v) => (
              <li
                key={`${v.izdelekId}:${v.velikostId}`}
                className="rounded-full bg-surface-muted px-2.5 py-1 type-caption text-ink-muted"
              >
                {v.kolicina > 1 && `${v.kolicina} × `}
                {v.ime}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3">
          <Price cents={p.cena} />
          {p.nepopolno ? (
            <Badge variant="warning">Nekaj izdelkov ta čas ni</Badge>
          ) : (
            <span className="inline-flex items-center gap-1 type-small font-medium text-brand">
              Izberite
              <LuArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-0.5"
              />
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
