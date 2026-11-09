import { cn } from "@/lib/utils";
import { Container } from "./Container";

/**
 * Glava podstrani (Z3): oznaka, naslov `h1` in opis na mirni podlagi.
 * Brez vstopne animacije: naslov je prva stvar, ki jo obiskovalec bere,
 * zato mora biti tam takoj (in LCP ne čaka na JavaScript).
 */
export function PageHeader({
  label,
  title,
  description,
  children,
  className,
}: {
  label?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Npr. drobtinice nad oznako. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b border-line bg-surface", className)}>
      <Container className="flex flex-col gap-3 py-12 md:py-16">
        {children}
        {label && <p className="type-label text-accent">{label}</p>}
        <h1 className="type-h1 max-w-3xl text-ink">{title}</h1>
        {description && <p className="type-body-lg max-w-2xl text-ink-muted">{description}</p>}
      </Container>
    </header>
  );
}
