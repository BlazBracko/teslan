"use client";

import { forwardRef } from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";
import { useField } from "./Field";

/**
 * Izbirni gumbi (Z3) na Radix primitivu: puščice premikajo izbiro, Tab
 * vstopi v skupino in iz nje. V `Field group` se skupina sama poveže z
 * legendo, opisom in napako.
 *
 * Dve obliki: `RadioItem` (krog in oznaka) in `RadioCard` (kartica z
 * naslovom, opisom in dodatkom na desni, npr. velikost in cena ali način
 * dostave).
 */
export const RadioGroup = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(function RadioGroup({ className, ...props }, ref) {
  const f = useField();
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      aria-labelledby={props["aria-labelledby"] ?? f?.labelId}
      aria-describedby={props["aria-describedby"] ?? f?.describedBy}
      aria-invalid={props["aria-invalid"] ?? (f?.invalid || undefined)}
      required={props.required ?? f?.required}
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
});

function Krog({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-full bg-surface ring-1 ring-line-strong ring-inset",
        "transition-[box-shadow] duration-(--duration-fast)",
        "group-data-[state=checked]:ring-[6px] group-data-[state=checked]:ring-brand",
        "group-hover:ring-ink-muted group-data-[state=checked]:group-hover:ring-brand",
        "group-aria-invalid:ring-danger",
        className,
      )}
    />
  );
}

type ItemProps = Omit<React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>, "children">;

export const RadioItem = forwardRef<HTMLButtonElement, ItemProps & { label: React.ReactNode }>(
  function RadioItem({ className, label, ...props }, ref) {
    return (
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn(
          "group flex min-h-11 items-center gap-3 rounded-md text-left type-body text-ink",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <Krog />
        <span>{label}</span>
      </RadioGroupPrimitive.Item>
    );
  },
);

export const RadioCard = forwardRef<
  HTMLButtonElement,
  ItemProps & {
    title: React.ReactNode;
    description?: React.ReactNode;
    /** Vsebina na desni, npr. cena. */
    aside?: React.ReactNode;
  }
>(function RadioCard({ className, title, description, aside, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "group flex w-full items-start gap-3 rounded-lg bg-surface p-4 text-left",
        "ring-1 ring-line-strong ring-inset",
        "transition-[box-shadow,background-color] duration-(--duration-fast)",
        "hover:bg-canvas",
        "data-[state=checked]:bg-brand-soft data-[state=checked]:ring-2 data-[state=checked]:ring-brand",
        "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <Krog className="mt-0.5" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="type-body font-medium text-ink">{title}</span>
        {description && <span className="type-small text-ink-muted">{description}</span>}
      </span>
      {aside && <span className="shrink-0 type-body font-medium text-ink type-numeric">{aside}</span>}
    </RadioGroupPrimitive.Item>
  );
});
