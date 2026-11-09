import Link from "next/link";
import type { KategorijaPogled } from "@/katalog/podatki";
import { cn } from "@/lib/utils";

/**
 * Filter po kategoriji (Z14). Stanje je v URL (`?kategorija=<slug>`), zato
 * so izbire navadne povezave: delujejo brez JavaScripta, dajo se deliti in
 * gumb Nazaj vrne prejšnji filter. Na ozkem zaslonu se vrstica drsi
 * vodoravno; aktivna izbira ima `aria-current`.
 */
export function FilterKategorij({
  kategorije,
  izbrana,
  steviloVseh,
}: {
  kategorije: Array<KategorijaPogled & { stevilo: number }>;
  izbrana: string | null;
  steviloVseh: number;
}) {
  const moznosti = [
    { slug: null, ime: "Vse", stevilo: steviloVseh },
    ...kategorije.map((k) => ({ slug: k.slug, ime: k.ime, stevilo: k.stevilo })),
  ];
  return (
    <nav aria-label="Kategorije izdelkov" className="-mx-gutter lg:mx-0">
      <ul className="flex snap-x gap-2 overflow-x-auto px-gutter pt-1 pb-3 lg:flex-wrap lg:overflow-visible lg:px-0">
        {moznosti.map((m) => {
          const aktivna = m.slug === izbrana;
          return (
            <li key={m.slug ?? "vse"} className="shrink-0 snap-start">
              <Link
                href={m.slug ? `/products?kategorija=${encodeURIComponent(m.slug)}` : "/products"}
                scroll={false}
                aria-current={aktivna ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full px-4 type-small font-medium whitespace-nowrap",
                  "transition-[background-color,color,transform] duration-(--duration-fast)",
                  "active:scale-[0.97] motion-reduce:active:scale-100",
                  aktivna
                    ? "bg-brand text-on-brand shadow-raised"
                    : "bg-surface text-ink ring-1 ring-line-strong ring-inset hover:bg-surface-muted",
                )}
              >
                {m.ime}
                <span className={cn("type-numeric", aktivna ? "text-on-brand" : "text-ink-muted")}>
                  {m.stevilo}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
