import Link from "next/link";
import type { IconType } from "react-icons";
import { LuLayoutGrid, LuShoppingBag, LuStore } from "react-icons/lu";
import { potSeznama, type NacinNakupa } from "@/katalog/nakup";
import { cn } from "@/lib/utils";

const MOZNOSTI: Array<{ nacin: NacinNakupa; oznaka: string; opis: string; ikona: IconType }> = [
  {
    nacin: "splet",
    oznaka: "Spletna trgovina",
    opis: "Naročite na spletu",
    ikona: LuShoppingBag,
  },
  {
    nacin: "kmetija",
    oznaka: "Samo na kmetiji",
    opis: "Kupite v živo v Podgori",
    ikona: LuStore,
  },
  {
    nacin: "vse",
    oznaka: "Vsi izdelki",
    opis: "Celotna ponudba",
    ikona: LuLayoutGrid,
  },
];

/**
 * Izbira načina nakupa nad seznamom izdelkov: tri velike ploščice, da kupec
 * takoj loči spletno trgovino od izdelkov, ki jih prodajamo samo na
 * kmetiji. Povezave ohranijo izbrano kategorijo samo, če je v novem načinu
 * kaj izdelkov te kategorije; sicer bi kupec pristal na prazni strani.
 */
export function FilterNakupa({
  izbran,
  stevila,
  kategorija,
  kategorijeNacinov,
}: {
  izbran: NacinNakupa;
  stevila: Record<NacinNakupa, number>;
  kategorija: string | null;
  /** Kategorije z vsaj enim izdelkom v posameznem načinu. */
  kategorijeNacinov: Record<NacinNakupa, ReadonlySet<string>>;
}) {
  return (
    <nav aria-label="Način nakupa">
      <ul className="grid grid-cols-3 gap-2 sm:gap-3">
        {MOZNOSTI.map(({ nacin, oznaka, opis, ikona: Ikona }) => {
          const aktivna = nacin === izbran;
          const ohraniKategorijo = kategorija && kategorijeNacinov[nacin].has(kategorija);
          return (
            <li key={nacin} className="min-w-0">
              <Link
                href={potSeznama({ nakup: nacin, kategorija: ohraniKategorijo ? kategorija : null })}
                scroll={false}
                aria-current={aktivna ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col gap-1 rounded-xl p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4",
                  "transition-[background-color,color,box-shadow,transform] duration-(--duration-fast)",
                  "active:scale-[0.98] motion-reduce:active:scale-100",
                  aktivna
                    ? "bg-brand text-on-brand shadow-floating"
                    : "bg-surface text-ink shadow-raised ring-1 ring-line ring-inset hover:bg-surface-muted",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full sm:size-11",
                    aktivna ? "bg-on-brand/15" : "bg-brand-soft text-brand",
                  )}
                >
                  <Ikona aria-hidden="true" className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="type-small font-semibold sm:type-title">
                    {oznaka} <span className={cn("type-numeric font-normal", aktivna ? "text-on-brand" : "text-ink-muted")}>{stevila[nacin]}</span>
                  </span>
                  <span className={cn("hidden type-caption sm:block", aktivna ? "text-on-brand" : "text-ink-muted")}>
                    {opis}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
