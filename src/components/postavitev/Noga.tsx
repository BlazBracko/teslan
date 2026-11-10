import Image from "next/image";
import Link from "next/link";
import type { Kontakt } from "@/lib/kontakt";
import { cn } from "@/lib/utils";
import { GLAVNA_NAVIGACIJA, POMOC_POVEZAVE, PRAVNE_POVEZAVE, type Povezava } from "./navigacija";

/**
 * Noga (Z8): kontakt, naslov s povezavo na zemljevid in pravne povezave.
 * Podatki so iz nastavitev trgovine (`prodajalec`); prazna polja se ne
 * prikažejo.
 *
 * Temna ploskev: obroč fokusa je tu svetel, ker modri obroč na temno zeleni
 * ne doseže 3 : 1.
 */
const povezava = cn(
  "-mx-1 inline-flex min-h-11 items-center rounded-xs px-1 type-small text-ink-inverse-muted",
  "transition-colors duration-(--duration-fast) hover:text-ink-inverse",
  "focus-visible:outline-ink-inverse",
);

function Stolpec({ naslov, povezave }: { naslov: string; povezave: Povezava[] }) {
  return (
    <nav aria-label={naslov}>
      <h2 className="mb-2 type-label text-ink-inverse-muted">{naslov}</h2>
      <ul>
        {povezave.map((p) => (
          <li key={p.href}>
            <Link href={p.href} className={povezava}>
              {p.oznaka}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Noga({ kontakt }: { kontakt: Kontakt }) {
  return (
    <footer className="bg-surface-inverse text-ink-inverse">
      <div className="mx-auto grid max-w-content grid-cols-2 gap-x-6 gap-y-10 px-gutter py-14 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr_1fr] lg:px-gutter-lg">
        <div className="col-span-2 flex flex-col gap-3 lg:col-span-1">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={44} height={44} className="size-11 rounded-full bg-surface object-contain" />
            <span className="type-h3 text-ink-inverse">{kontakt.ime}</span>
          </div>
          <p className="max-w-xs type-small text-ink-inverse-muted">
            Družinska kmetija v Podgori pri Novem mestu. Šparglji, jagode, začimbe, darilne škatle in domači izdelki.
          </p>
        </div>

        <Stolpec naslov="Strani" povezave={GLAVNA_NAVIGACIJA} />
        <Stolpec naslov="Pomoč pri nakupu" povezave={POMOC_POVEZAVE} />

        <div className="col-span-2 sm:col-span-1">
          <h2 className="mb-2 type-label text-ink-inverse-muted">Kontakt</h2>
          <address className="not-italic">
            <ul>
              {kontakt.naslov && kontakt.zemljevid && (
                <li>
                  <a href={kontakt.zemljevid} target="_blank" rel="noopener noreferrer" className={cn(povezava, "py-1")}>
                    <span>
                      {kontakt.naslovVrstice.map((v) => (
                        <span key={v} className="block">
                          {v}
                        </span>
                      ))}
                      <span className="sr-only"> (zemljevid se odpre v novem zavihku)</span>
                    </span>
                  </a>
                </li>
              )}
              {kontakt.telefon && kontakt.telefonPovezava && (
                <li>
                  <a href={kontakt.telefonPovezava} className={povezava}>
                    {kontakt.telefon}
                  </a>
                </li>
              )}
              {kontakt.email && (
                <li>
                  <a href={`mailto:${kontakt.email}`} className={cn(povezava, "break-all")}>
                    {kontakt.email}
                  </a>
                </li>
              )}
            </ul>
          </address>
        </div>

        <Stolpec naslov="Pravno" povezave={PRAVNE_POVEZAVE} />
      </div>

      <div className="border-t border-ink-inverse/15">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-x-6 gap-y-2 px-gutter py-6 lg:px-gutter-lg">
          <p className="type-caption text-ink-inverse-muted">
            © {new Date().getFullYear()} {kontakt.ime}. Vse pravice pridržane.
          </p>
          {/* Diskreten vstop v urejanje trgovine. Admin je zaščiten s prijavo,
              pot /admin pa je pri Payloadu tako ali tako znana; iskalnikom
              jo zapre robots.txt. Brez predhodnega nalaganja: admin je ločena
              aplikacija z lastno postavitvijo. */}
          <Link href="/admin" prefetch={false} rel="nofollow" className={cn(povezava, "min-h-8 type-caption")}>
            Urejanje trgovine
          </Link>
        </div>
      </div>
    </footer>
  );
}
