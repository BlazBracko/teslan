import { formatirajCeno } from "@/lib/denar";
import { cn } from "@/lib/utils";

/**
 * Cena (Z3). Vedno iz celih centov, vedno z DDV (Z24). Števke so
 * enakomerne širine, da se zneski v stolpcu poravnajo.
 */
export function Price({
  cents,
  from = false,
  previousCents,
  size = "md",
  className,
}: {
  cents: number;
  /** „od 5,00 €“ za izdelke z več velikostmi (Z14). */
  from?: boolean;
  /** Prejšnja cena, prečrtana. */
  previousCents?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1.5 text-ink type-numeric",
        size === "sm" && "type-small font-medium",
        size === "md" && "type-body font-semibold",
        size === "lg" && "type-h3 font-display",
        className,
      )}
    >
      {from && <span className="font-normal text-ink-muted">od</span>}
      <span>{formatirajCeno(cents)}</span>
      {previousCents !== undefined && (
        <s className="type-small font-normal text-ink-subtle">
          <span className="sr-only">prej </span>
          {formatirajCeno(previousCents)}
        </s>
      )}
    </span>
  );
}
