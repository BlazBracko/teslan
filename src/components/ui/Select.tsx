"use client";

import { forwardRef } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { LuCheck, LuChevronDown } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useFieldControlProps } from "./Field";
import { controlBase } from "./Input";

/**
 * Izbirni seznam (Z3) na Radix primitivu. Na dotik in s tipkovnico se
 * obnaša kot domorodni `<select>` (puščice, iskanje po začetnici, Esc).
 */
export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(function SelectTrigger({ className, children, ...props }, ref) {
  const p = useFieldControlProps(props);
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        controlBase,
        "flex h-11 items-center justify-between gap-2 px-3.5 text-left",
        "data-placeholder:text-ink-subtle",
        className,
      )}
      {...p}
    >
      <span className="truncate">{children}</span>
      <SelectPrimitive.Icon asChild>
        <LuChevronDown aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ className, children, position = "popper", ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={6}
        className={cn(
          "z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width)",
          "overflow-hidden rounded-lg bg-surface p-1 shadow-floating ring-1 ring-line",
          // Seznam zraste iz sprožilca (apple-design §7).
          "origin-(--radix-select-content-transform-origin)",
          "data-[state=open]:animate-vstop",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex min-h-10 cursor-default items-center rounded-md py-2 pr-3 pl-9 type-body text-ink outline-none select-none",
        "data-highlighted:bg-brand-soft",
        "data-disabled:text-ink-subtle data-disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <span className="absolute left-3 grid size-4 place-items-center">
        <SelectPrimitive.ItemIndicator>
          <LuCheck aria-hidden="true" className="size-4 text-brand" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

export const SelectLabel = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn("px-3 pt-2 pb-1 type-label text-ink-subtle", className)}
      {...props}
    />
  );
});
