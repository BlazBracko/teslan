import { LuBriefcase, LuMail, LuPhone } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import type { Kontakt } from "@/lib/kontakt";
import { cn } from "@/lib/utils";

/**
 * Poslovna darila: večja naročila za sodelavce, partnerje in stranke se
 * dogovorijo po telefonu ali e-pošti (spletna košarica je za posamezna
 * darila). `temno` je za temno ploskev na domači strani.
 */
export function PoslovnaDarila({ kontakt, temno = false }: { kontakt: Kontakt; temno?: boolean }) {
  const zadeva = encodeURIComponent("Poslovna darila");
  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-xl p-6 md:p-8",
        !temno && "md:flex-row md:items-center md:justify-between",
        temno ? "bg-ink-inverse/8 ring-1 ring-ink-inverse/20 ring-inset" : "bg-surface shadow-raised ring-1 ring-line",
      )}
    >
      <div className="flex gap-4">
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-full",
            temno ? "bg-ink-inverse/12 text-ink-inverse" : "bg-accent-soft text-accent",
          )}
        >
          <LuBriefcase aria-hidden="true" className="size-6" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h3 className={cn("type-h3", temno ? "text-ink-inverse" : "text-ink")}>Poslovna darila</h3>
          <p className={cn("max-w-lg type-small", temno ? "text-ink-inverse-muted" : "text-ink-muted")}>
            Za sodelavce, poslovne partnerje in stranke pripravimo več škatel hkrati, z vsebino in sporočilom po
            vaši želji. Pokličite ali pišite, pa vam pripravimo ponudbo.
          </p>
        </div>
      </div>
      {(kontakt.telefonPovezava || kontakt.email) && (
        <div className={cn("flex shrink-0 flex-wrap gap-2", temno && "sm:pl-16")}>
          {kontakt.telefon && kontakt.telefonPovezava && (
            <Button asChild variant="secondary">
              <a href={kontakt.telefonPovezava}>
                <LuPhone aria-hidden="true" />
                {kontakt.telefon}
              </a>
            </Button>
          )}
          {kontakt.email && (
            <Button asChild variant="secondary">
              <a href={`mailto:${kontakt.email}?subject=${zadeva}`} aria-label={`Pišite nam za poslovna darila (${kontakt.email})`}>
                <LuMail aria-hidden="true" />
                Pišite nam
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
