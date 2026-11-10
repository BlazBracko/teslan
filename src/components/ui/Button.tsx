import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

/**
 * Gumb (Z3). Odziv je na pritisk, ne na spust (apple-design §1): `:active`
 * se sproži ob pointer-down in gumb se v 100 ms rahlo pomanjša. Pri
 * zmanjšanem gibanju ostane samo sprememba barve.
 */
export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap select-none",
    "font-medium tracking-[-0.006em]",
    "transition-[transform,background-color,border-color,color,box-shadow]",
    "duration-(--duration-press) ease-(--ease-out-soft)",
    "active:scale-[0.97] motion-reduce:active:scale-100",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-busy:pointer-events-none",
    "[&_svg]:size-[1.15em] [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-on-brand shadow-raised hover:bg-brand-strong active:bg-brand-strong",
        secondary:
          "bg-surface text-ink shadow-raised ring-1 ring-line ring-inset hover:bg-surface-muted",
        outline:
          "bg-transparent text-brand ring-1 ring-line-strong ring-inset hover:bg-brand-soft",
        ghost: "bg-transparent text-ink hover:bg-surface-muted",
        accent:
          "bg-accent text-on-accent shadow-raised hover:bg-accent-strong active:bg-accent-strong",
        danger:
          "bg-danger text-on-accent shadow-raised hover:bg-danger-strong active:bg-danger-strong",
        // Na temnih ploskvah (uvod domače strani, plavajoča glava, darila):
        // obroč fokusa je svetel, ker modri na temno zeleni ne doseže 3 : 1.
        bright:
          "bg-brand-bright text-brand-strong shadow-raised hover:bg-ink-inverse active:bg-ink-inverse focus-visible:outline-ink-inverse",
        outlineInverse:
          "bg-transparent text-ink-inverse ring-1 ring-ink-inverse/55 ring-inset hover:bg-ink-inverse/12 focus-visible:outline-ink-inverse",
        ghostInverse:
          "bg-transparent text-ink-inverse hover:bg-ink-inverse/12 focus-visible:outline-ink-inverse",
        link: "h-auto! rounded-none! px-0! text-brand underline decoration-1 underline-offset-4 hover:decoration-2 active:scale-100",
      },
      size: {
        sm: "h-9 rounded-md px-3.5 type-small",
        md: "h-11 rounded-lg px-5 type-body",
        lg: "h-13 rounded-xl px-7 type-body-lg",
        icon: "size-11 rounded-full",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Upodobi otroka (npr. `<Link>`) z videzom gumba. */
  asChild?: boolean;
  /** Dejanje teče: gumb je onemogočen, besedilo ostane, doda se kazalnik. */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, asChild = false, loading = false, disabled, children, type, ...props },
  ref,
) {
  const razredi = cn(buttonVariants({ variant, size, block }), className);

  if (asChild) {
    return (
      <Slot ref={ref} className={razredi} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={razredi}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner label="Počakajte" />}
      {children}
    </button>
  );
});
