import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Oznaka (Z3), npr. razpoložljivost izdelka (Z13): „Na zalogi“,
 * „Še 2 kosa“, „Ni na zalogi“, „Kmalu“, „Na voljo na kmetiji“.
 * Pomen nikoli ni samo v barvi: besedilo oznake ga pove samo.
 */
export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 type-caption font-medium whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-ink-muted",
        brand: "bg-brand-soft text-brand",
        accent: "bg-accent-soft text-accent-strong",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info",
        outline: "bg-transparent text-ink-muted ring-1 ring-line-strong ring-inset",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Barvna pika pred besedilom. */
  dot?: boolean;
}

export function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
