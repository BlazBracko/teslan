import Reveal from '@/components/ui/Reveal';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  label?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Nad temno podlago prosojnost besedila zniža berljivost (§12). */
  onDark?: boolean;
  align?: 'center' | 'start';
  className?: string;
}

/**
 * Naslov sekcije: oznaka + naslov + opis.
 *
 * Ta trojica se je ponavljala v petih datotekah, vsakič z drugačnim
 * ročno preračunanim `delay` in drugačnim odtenkom. Hierarhijo tu
 * gradimo iz velikosti, teže in leadinga kot iz enega seta (§15).
 */
export default function SectionHeading({
  label,
  title,
  description,
  onDark = false,
  align = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {label && (
        <Reveal delay={0}>
          <span className={cn('type-label', onDark ? 'text-green-bright' : 'text-green-light')}>
            {label}
          </span>
        </Reveal>
      )}

      <Reveal delay={0.05}>
        <h2 className={cn('type-h2', onDark && 'text-cream')}>{title}</h2>
      </Reveal>

      {description && (
        <Reveal delay={0.1}>
          <p
            className={cn(
              'type-body max-w-2xl',
              onDark ? 'on-material text-cream/85' : 'text-ink-mid',
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
