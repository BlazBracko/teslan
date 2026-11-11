import { cn } from "@/lib/utils";

/**
 * Naslov sekcije (Z3): neobvezna oznaka, naslov in opis. Hierarhija nastane
 * iz velikosti, teže in razmika (apple-design §15), ne iz barve.
 */
export function SectionHeading({
  label,
  title,
  description,
  align = "start",
  as: Naslov = "h2",
  id,
  className,
  action,
}: {
  label?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "start" | "center";
  as?: "h1" | "h2";
  id?: string;
  className?: string;
  /** Povezava ali gumb ob naslovu (npr. „Vsi izdelki“). */
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:gap-4",
        action && "md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <div className={cn("flex max-w-2xl flex-col gap-2 sm:gap-3", align === "center" && "items-center")}>
        {label && <p className="type-label text-accent">{label}</p>}
        <Naslov id={id} className={cn(Naslov === "h1" ? "type-h1" : "type-h2", "text-ink")}>
          {title}
        </Naslov>
        {description && <p className="type-body-lg text-ink-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
