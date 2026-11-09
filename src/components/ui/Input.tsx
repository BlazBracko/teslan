"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useFieldControlProps } from "./Field";

/**
 * Skupni videz vnosnih kontrolnikov. Rob `line-strong` dosega 3 : 1 proti
 * ploskvi (Z6), napaka je izražena z barvo roba in z besedilom v `Field`,
 * nikoli samo z barvo.
 */
export const controlBase = cn(
  "w-full rounded-lg bg-surface text-ink type-body",
  "ring-1 ring-line-strong ring-inset",
  "transition-[box-shadow,background-color] duration-(--duration-fast)",
  "placeholder:text-ink-subtle",
  "hover:ring-ink-muted",
  "focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none",
  "aria-invalid:ring-2 aria-invalid:ring-danger",
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle disabled:ring-line",
);

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  const p = useFieldControlProps(props);
  return <input ref={ref} type={type} className={cn(controlBase, "h-11 px-3.5", className)} {...p} />;
});

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  const p = useFieldControlProps(props);
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlBase, "min-h-24 resize-y px-3.5 py-2.5", className)}
      {...p}
    />
  );
});
