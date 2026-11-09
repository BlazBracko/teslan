import { cn } from "@/lib/utils";

/**
 * Vrteči se kazalnik za stanje, ki traja (povratna informacija o stanju).
 * Pri zmanjšanem gibanju obstane (globals.css), besedilo za bralnike ostane.
 */
export function Spinner({
  className,
  label = "Nalaganje",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" className={cn("inline-flex", className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="size-[1.1em] animate-spin"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
