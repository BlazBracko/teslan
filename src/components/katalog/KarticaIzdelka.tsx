import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import type { IzdelekPogled } from "@/katalog/podatki";
import { cenaNaKartici, razpolozljivostIzdelka } from "@/katalog/razpolozljivost";
import type { Mesec } from "@/katalog/sezona";
import { OznakaNacina, OznakaRazpolozljivosti } from "./OznakaRazpolozljivosti";
import { SlikaIzdelka } from "./SlikaIzdelka";

export const potIzdelka = (slug: string) => `/products/${slug}`;

/**
 * Kartica izdelka na seznamu (Z14): slika, kategorija, ime, kratek opis,
 * najnižja naročljiva cena („od X €“) in oznaka razpoložljivosti. Cela
 * kartica je povezava na podstran (raztegnjena povezava na naslovu, da
 * bralnik zaslona prebere samo ime).
 */
export function KarticaIzdelka({
  izdelek,
  mesec,
  naslov: Naslov = "h2",
  prednostnaSlika = false,
}: {
  izdelek: IzdelekPogled;
  mesec: Mesec;
  naslov?: "h2" | "h3";
  prednostnaSlika?: boolean;
}) {
  const cena = cenaNaKartici(izdelek, mesec);
  return (
    <Card interactive className="h-full" data-izdelek={izdelek.slug}>
      <SlikaIzdelka
        slika={izdelek.slike[0]}
        sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
        prednostna={prednostnaSlika}
        className="aspect-[4/3]"
        nadomestnaOznaka={`${izdelek.ime}: slika še ni na voljo`}
      />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="type-caption text-ink-subtle">{izdelek.kategorija.ime}</p>
        <Naslov className="type-h3 text-ink">
          <Link
            href={potIzdelka(izdelek.slug)}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {izdelek.ime}
          </Link>
        </Naslov>
        {izdelek.kratekOpis && <p className="line-clamp-3 type-small text-ink-muted">{izdelek.kratekOpis}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3">
          {cena ? <Price cents={cena.centi} from={cena.od} /> : <span />}
          <div className="flex flex-wrap gap-1.5">
            <OznakaNacina nacin={izdelek.nacinProdaje} />
            <OznakaRazpolozljivosti razpolozljivost={razpolozljivostIzdelka(izdelek, mesec)} />
          </div>
        </div>
      </div>
    </Card>
  );
}
