import Link from "next/link";
import type { IconType } from "react-icons";
import { LuLayoutGrid, LuShoppingBag, LuStore } from "react-icons/lu";
import { potSeznama, type NacinNakupa } from "@/katalog/nakup";
import { cn } from "@/lib/utils";

const MOZNOSTI: Array<{ nacin: NacinNakupa; oznaka: string; ikona: IconType }> = [
  { nacin: "splet", oznaka: "Spletna trgovina", ikona: LuShoppingBag },
  { nacin: "kmetija", oznaka: "Na kmetiji", ikona: LuStore },
  { nacin: "vse", oznaka: "Vsi izdelki", ikona: LuLayoutGrid },
];

/**
 * Izbira načina nakupa nad seznamom izdelkov: preklopnik s tremi izbirami,
 * da kupec takoj loči spletno trgovino od izdelkov, ki jih prodajamo samo
 * na kmetiji, in da izdelki pridejo na vrsto že na prvem zaslonu telefona
 * (prej so tri velike ploščice in opisi zavzeli ves zaslon).
 *
 * Povezave ohranijo izbrano kategorijo samo, če je v novem načinu kaj
 * izdelkov te kategorije; sicer bi kupec pristal na prazni strani.
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
      <ul className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-muted p-1 sm:inline-grid sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none">
        {MOZNOSTI.map(({ nacin, oznaka, ikona: Ikona }) => {
          const aktivna = nacin === izbran;
          const ohraniKategorijo = kategorija && kategorijeNacinov[nacin].has(kategorija);
          return (
            <li key={nacin} className="min-w-0">
              <Link
                href={potSeznama({ nakup: nacin, kategorija: ohraniKategorijo ? kategorija : null })}
                scroll={false}
                aria-current={aktivna ? "page" : undefined}
                className={cn(
                  "flex h-full min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-center",
                  "sm:flex-row sm:gap-2 sm:px-5",
                  "transition-[background-color,color,box-shadow,transform] duration-(--duration-fast)",
                  "active:scale-[0.98] motion-reduce:active:scale-100",
                  aktivna ? "bg-surface text-ink shadow-raised" : "text-ink-muted hover:text-ink",
                )}
              >
                <Ikona aria-hidden="true" className={cn("hidden size-4.5 shrink-0 sm:block", aktivna && "text-brand")} />
                <span className="type-caption leading-tight font-semibold sm:type-small">{oznaka}</span>
                <span className="type-caption type-numeric text-ink-muted sm:type-small">{stevila[nacin]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
