import { cn } from "@/lib/utils";

/**
 * Prazno stanje (Z3), npr. prazna košarica: kaj je tu, zakaj je prazno in
 * kam naprej (iskanje poti, apple-design §16).
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  titleAs: Naslov = "h2",
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** `h1`, kadar je prazno stanje edina vsebina strani (npr. 404). */
  titleAs?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl px-6 py-12 text-center",
        "bg-surface-muted/60 ring-1 ring-line ring-inset",
        className,
      )}
    >
      {icon && (
        <div className="mb-1 grid size-14 place-items-center rounded-full bg-surface text-brand shadow-raised [&_svg]:size-6">
          {icon}
        </div>
      )}
      <Naslov className="type-h3 text-ink">{title}</Naslov>
      {description && <p className="max-w-prose type-body text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
