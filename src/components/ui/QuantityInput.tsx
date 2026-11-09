"use client";

import { LuMinus, LuPlus } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useFieldControlProps } from "./Field";

/**
 * Količina (Z15: 1 do min(zaloga, 20)). Gumba na mejah sta onemogočena,
 * vpisana vrednost se ob izhodu iz polja omeji na dovoljeno območje.
 */
export function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 20,
  disabled,
  className,
  id,
  "aria-describedby": describedBy,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-describedby"?: string;
}) {
  const p = useFieldControlProps({ id, disabled, "aria-describedby": describedBy });
  const omeji = (v: number) => Math.min(max, Math.max(min, Number.isFinite(v) ? Math.round(v) : min));

  const gumb = cn(
    "grid size-11 place-items-center text-ink",
    "transition-[background-color,transform] duration-(--duration-press)",
    "hover:bg-surface-muted active:scale-[0.92] motion-reduce:active:scale-100",
    "disabled:pointer-events-none disabled:text-ink-subtle disabled:opacity-50",
  );

  return (
    <div
      className={cn(
        "inline-flex h-11 w-fit items-center self-start overflow-hidden rounded-lg bg-surface ring-1 ring-line-strong ring-inset",
        className,
      )}
    >
      <button
        type="button"
        className={gumb}
        onClick={() => onChange(omeji(value - 1))}
        disabled={p.disabled || value <= min}
        aria-label="Zmanjšaj količino"
        aria-controls={p.id}
      >
        <LuMinus aria-hidden="true" className="size-4" />
      </button>
      <input
        {...p}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const v = e.target.valueAsNumber;
          if (Number.isFinite(v)) onChange(v);
        }}
        onBlur={(e) => onChange(omeji(e.target.valueAsNumber))}
        className={cn(
          "h-full w-12 bg-transparent text-center type-body font-medium text-ink type-numeric",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          "focus-visible:outline-2 focus-visible:-outline-offset-2",
        )}
      />
      <button
        type="button"
        className={gumb}
        onClick={() => onChange(omeji(value + 1))}
        disabled={p.disabled || value >= max}
        aria-label="Povečaj količino"
        aria-controls={p.id}
      >
        <LuPlus aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
