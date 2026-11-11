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
    // Ploskev sega pod plavajočo glavo, da nad njo ni pasu druge barve.
    <header className={cn("-mt-glava border-b border-line bg-surface pt-glava", className)}>
      <Container className="flex flex-col gap-2 py-6 sm:gap-3 sm:py-8 md:py-14">
        {children}
        {label && <p className="type-label text-accent">{label}</p>}
        <h1 className="type-h1 max-w-3xl text-ink">{title}</h1>
        {description && <p className="type-body-lg max-w-2xl text-ink-muted">{description}</p>}
      </Container>
    </header>
  );
}
