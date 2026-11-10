import Link from "next/link";
import { LuArrowRight, LuChevronDown } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { Vprasanje } from "@/vsebina/vprasanja";

/**
 * Vprašanja in odgovori kot domorodni `<details>`: delujejo brez
 * JavaScripta, s tipkovnico in bralnikom zaslona, odgovor pa je v HTML tudi,
 * ko je zaprt (iskalniki). Vrstica vprašanja je visoka vsaj 56 px.
 */
export function SeznamVprasanj({
  vprasanja,
  className,
  zSidri = false,
}: {
  vprasanja: readonly Vprasanje[];
  className?: string;
  /** Vsako vprašanje dobi `id` za neposredno povezavo (`/vprasanja#postnina`). */
  zSidri?: boolean;
}) {
  return (
    <div className={cn("divide-y divide-line overflow-hidden rounded-xl bg-surface shadow-raised ring-1 ring-line", className)}>
      {vprasanja.map((v) => (
        <details key={v.id} id={zSidri ? v.id : undefined} className="group">
          <summary
            className={cn(
              "flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 type-title text-ink sm:px-6",
              "transition-colors duration-(--duration-fast) hover:bg-canvas [&::-webkit-details-marker]:hidden",
              "focus-visible:outline-offset-[-2px]",
            )}
          >
            {v.vprasanje}
            <LuChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 text-ink-muted transition-transform duration-(--duration-base) ease-(--ease-out-soft) group-open:rotate-180"
            />
          </summary>
          <div className="flex flex-col gap-3 px-4 pb-5 type-body text-ink-muted sm:px-6">
            {v.odgovor.map((odstavek) => (
              <p key={odstavek} className="max-w-prose">
                {odstavek}
              </p>
            ))}
            {v.povezava && (
              <Link
                href={v.povezava.href}
                className="inline-flex min-h-9 items-center gap-1.5 self-start rounded-xs font-medium text-brand underline underline-offset-4"
              >
                {v.povezava.oznaka}
                <LuArrowRight aria-hidden="true" className="size-4" />
              </Link>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
