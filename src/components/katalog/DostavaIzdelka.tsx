import Link from "next/link";
import { LuStore, LuTruck } from "react-icons/lu";
import { POT_DOSTAVE } from "@/components/postavitev/navigacija";
import type { NacinProdaje } from "@/katalog/razpolozljivost";
import { formatirajCeno } from "@/lib/denar";

/**
 * Kako kupec pride do izdelka, že na podstrani izdelka: pošta s ceno in
 * pragom brezplačne poštnine ter prevzem na kmetiji. Pri izdelku samo za
 * prevzem jasno pove, da se ne pošilja in kaj to pomeni za celo naročilo,
 * da kupca to ne preseneti šele v košarici (T4).
 */
export function DostavaIzdelka({
  nacin,
  postninaCenti,
  pragBrezplacnePostnineCenti,
}: {
  nacin: NacinProdaje;
  postninaCenti: number;
  pragBrezplacnePostnineCenti: number;
}) {
  if (nacin === "samo-prikaz") return null;
  return (
    <section aria-label="Dostava in prevzem" className="flex flex-col gap-3 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5">
      <ul className="flex flex-col gap-3 type-small text-ink-muted">
        {nacin === "posta-in-prevzem" ? (
          <li className="flex gap-3">
            <LuTruck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
            <span>
              <strong className="font-semibold text-ink">Po pošti po Sloveniji.</strong> Poštnina{" "}
              {formatirajCeno(postninaCenti)}, pri naročilu nad {formatirajCeno(pragBrezplacnePostnineCenti)} brezplačno.
            </span>
          </li>
        ) : (
          <li className="flex gap-3">
            <LuTruck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-subtle" />
            <span>
              <strong className="font-semibold text-ink">Tega izdelka ne pošiljamo po pošti.</strong> Če ga dodate v
              košarico, celotno naročilo prevzamete na kmetiji.
            </span>
          </li>
        )}
        <li className="flex gap-3">
          <LuStore aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
          <span>
            <strong className="font-semibold text-ink">Prevzem na kmetiji v Podgori.</strong> Brezplačno, termin se
            dogovorimo po telefonu.
          </span>
        </li>
      </ul>
      <Link
        href={POT_DOSTAVE}
        className="inline-flex min-h-9 items-center self-start rounded-xs type-small font-medium text-brand underline underline-offset-4"
      >
        Več o dostavi in plačilu
      </Link>
    </section>
  );
}
