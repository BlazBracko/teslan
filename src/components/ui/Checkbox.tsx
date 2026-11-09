"use client";

import { forwardRef, useId } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { LuCheck, LuCircleAlert } from "react-icons/lu";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, "children"> {
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
}

/**
 * Potrditveno polje z oznako (Z3). Cela vrstica z oznako je tarča klika,
 * zato je tarča večja od samega kvadratka (WCAG 2.2, velikost tarče).
 */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { label, description, error, className, id: idProp, ...props },
  ref,
) {
  const auto = useId();
  const id = idProp ?? `potrditev-${auto}`;
  const descId = description ? `${id}-opis` : undefined;
  const errId = error ? `${id}-napaka` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-start gap-3">
        <CheckboxPrimitive.Root
          ref={ref}
          id={id}
          aria-describedby={[descId, errId].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-xs bg-surface",
            "ring-1 ring-line-strong ring-inset",
            "transition-[background-color,box-shadow] duration-(--duration-fast)",
            "hover:ring-ink-muted",
            "data-[state=checked]:bg-brand data-[state=checked]:ring-brand",
            "aria-invalid:ring-2 aria-invalid:ring-danger",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          {...props}
        >
          <CheckboxPrimitive.Indicator className="text-on-brand">
            <LuCheck aria-hidden="true" className="size-3.5" strokeWidth={3} />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        <div className="flex flex-col gap-0.5">
          <label htmlFor={id} className="type-small text-ink">
            {label}
          </label>
          {description && (
            <p id={descId} className="type-caption text-ink-subtle">
              {description}
            </p>
          )}
        </div>
      </div>
      {error && (
        <p id={errId} className="flex items-start gap-1.5 pl-8 type-caption font-medium text-danger">
          <LuCircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});
