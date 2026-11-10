import Link from "next/link";
import { potIzdelka } from "@/components/katalog/KarticaIzdelka";
import type { IzdelekPogled } from "@/katalog/podatki";
import { imeMeseca, MESECI, oznakaSezone, vSezoni, type Mesec } from "@/katalog/sezona";
import { cn } from "@/lib/utils";

const KRATICE = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"] as const;

/**
 * Koledar sezone: kdaj so na kmetiji sveži pridelki. Podatki so sezone
 * izdelkov iz CMS (polje „Sezona“), zato se koledar posodobi sam, ko
 * urednik spremeni sezono ali doda sezonski izdelek.
 *
 * Prava tabela (bralnik zaslona prebere „Šparglji, april: v sezoni“);
 * trenutni mesec je označen. Na telefonu so stolpci ozki, zato imajo
 * glave samo začetnico, celotno ime pa je v `abbr`.
 */
export function KoledarSezone({ izdelki, mesec }: { izdelki: readonly IzdelekPogled[]; mesec: Mesec }) {
  const sezonski = izdelki.filter((i) => i.sezona !== null);
  if (sezonski.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-raised ring-1 ring-line">
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">Koledar sezone svežih pridelkov po mesecih</caption>
        <thead>
          <tr>
            <th scope="col" className="w-[30%] px-3 py-3 text-left type-label text-ink-muted sm:w-48 sm:px-5">
              Pridelek
            </th>
            {MESECI.map((ime, i) => {
              const zdaj = i + 1 === mesec;
              return (
                <th
                  key={ime}
                  scope="col"
                  aria-current={zdaj ? "date" : undefined}
                  className={cn("px-0 py-3 text-center type-caption font-semibold", zdaj ? "text-brand" : "text-ink-muted")}
                >
                  <abbr title={ime} className="no-underline">
                    <span className="sm:hidden">{KRATICE[i].charAt(0).toUpperCase()}</span>
                    <span className="hidden sm:inline">{KRATICE[i]}</span>
                  </abbr>
                  {zdaj && <span className="sr-only"> (zdaj)</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sezonski.map((izdelek) => {
            const sezona = izdelek.sezona!;
            return (
              <tr key={izdelek.id} className="border-t border-line">
                <th scope="row" className="px-3 py-3 text-left sm:px-5">
                  <Link
                    href={potIzdelka(izdelek.slug)}
                    className="rounded-xs type-small font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-brand sm:type-body"
                  >
                    {izdelek.ime}
                  </Link>
                  <span className="hidden type-caption font-normal text-ink-muted sm:block">{oznakaSezone(sezona)}</span>
                </th>
                {MESECI.map((_, i) => {
                  const m = (i + 1) as Mesec;
                  const vSez = vSezoni(sezona, m);
                  return (
                    <td key={m} className={cn("p-0.5 sm:p-1", m === mesec && "bg-brand-soft/60")}>
                      <span
                        className={cn(
                          "block h-7 rounded-md sm:h-8",
                          vSez ? "bg-brand" : "bg-surface-muted/70",
                        )}
                      >
                        <span className="sr-only">
                          {imeMeseca(m)}: {vSez ? "v sezoni" : "ni v sezoni"}
                        </span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
