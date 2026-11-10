import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";
import { SlikaIzdelka } from "@/components/katalog/SlikaIzdelka";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { KategorijaPogled, SkupinaPogled } from "@/katalog/podatki";
import { IZDELEK, stevilo } from "@/lib/sklanjanje";

export interface SkupinaZaPrikaz extends SkupinaPogled {
  /** Najnižja cena naročljivih izdelkov skupine (Z16) ali `null`. */
  odCenti: number | null;
  /** Kategorije skupine, ki imajo vsaj en objavljen izdelek. */
  kategorijeSkupine: KategorijaPogled[];
}

/**
 * Skupine ponudbe iz CMS (Z16): ime, opis, slika in „od X €“. Kategorije
 * skupine so povezave na filtriran seznam izdelkov, zato ploščica ni le
 * okras, ampak vstop v katalog.
 */
export function SkupinePonudbe({ skupine, steviloIzdelkov }: { skupine: SkupinaZaPrikaz[]; steviloIzdelkov: number }) {
  if (skupine.length === 0) return null;
  return (
    <div className="flex flex-col gap-10">
      <SectionHeading
        label="Naša ponudba"
        title="Več kot le sveža zelenjava"
        description={`Na ceniku je ${stevilo(steviloIzdelkov, IZDELEK)}: od špargljev z njive do začimb, posušenega sadja, olj in marmelad.`}
        action={
          <Button asChild variant="outline">
            <Link href="/products">
              Vsi izdelki
              <LuArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <ul className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {skupine.map((s) => (
          <li key={s.id}>
            {/* Na telefonu ležeča kartica (slika levo), da štiri skupine ne
                zavzamejo štirih zaslonov. */}
            <Card className="h-full flex-row sm:flex-col">
              <SlikaIzdelka
                slika={s.slika}
                sizes="(min-width: 1024px) 18rem, (min-width: 640px) 50vw, 7rem"
                className="aspect-auto w-28 shrink-0 self-stretch sm:aspect-[4/3] sm:w-full sm:self-auto"
                nadomestnaOznaka={`${s.ime}: slika še ni na voljo`}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4 sm:gap-2 sm:p-5">
                <h3 className="type-h3 text-ink">{s.ime}</h3>
                {s.opis && <p className="line-clamp-3 type-small text-ink-muted sm:line-clamp-none">{s.opis}</p>}
                {s.odCenti !== null && <Price cents={s.odCenti} from size="sm" className="mt-1" />}
                {s.kategorijeSkupine.length > 0 && (
                  <ul className="mt-auto flex flex-wrap gap-x-3 pt-2 sm:pt-3" aria-label={`Kategorije: ${s.ime}`}>
                    {s.kategorijeSkupine.map((k) => (
                      <li key={k.id}>
                        <Link
                          href={`/products?kategorija=${encodeURIComponent(k.slug)}`}
                          className="inline-flex min-h-8 items-center rounded-xs type-small font-medium text-brand underline decoration-line-strong underline-offset-4 hover:decoration-brand"
                        >
                          {k.ime}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
