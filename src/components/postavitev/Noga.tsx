import Image from "next/image";
import Link from "next/link";
import type { Kontakt } from "@/lib/kontakt";
import { cn } from "@/lib/utils";
import { GLAVNA_NAVIGACIJA, PRAVNE_POVEZAVE, type Povezava } from "./navigacija";

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
      <div className="mx-auto grid max-w-content gap-10 px-gutter py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-gutter-lg">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={44} height={44} className="size-11 rounded-full bg-surface object-contain" />
            <span className="type-h3 text-ink-inverse">{kontakt.ime}</span>
          </div>
          <p className="max-w-xs type-small text-ink-inverse-muted">
            Ekološka kmetija v Podgori pri Novem mestu. Šparglji, jagode, začimbe in domači izdelki.
          </p>
        </div>

        <Stolpec naslov="Strani" povezave={GLAVNA_NAVIGACIJA} />

        <div>
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
        <p className="mx-auto max-w-content px-gutter py-6 type-caption text-ink-inverse-muted lg:px-gutter-lg">
          © {new Date().getFullYear()} {kontakt.ime}. Vse pravice pridržane.
        </p>
      </div>
    </footer>
  );
}
