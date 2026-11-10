"use client";

import { createContext, useContext, useId } from "react";
import * as Label from "@radix-ui/react-label";
import { LuCircleAlert } from "react-icons/lu";
import { cn } from "@/lib/utils";

/**
 * Polje obrazca (Z3, Z6): oznaka, neobvezen opis in napaka. Kontrolnik v
 * njem (Input, Textarea, Select, RadioGroup, QuantityInput) prek konteksta
 * sam dobi `id`, `aria-describedby`, `aria-invalid` in `required`, zato se
 * povezave med oznako, opisom in napako ne more pozabiti.
 *
 * `group` upodobi `<fieldset>` z `<legend>` za skupine (izbirni gumbi).
 */

interface FieldContext {
  id: string;
  labelId: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
}

const FieldCtx = createContext<FieldContext | null>(null);

export function useField() {
  return useContext(FieldCtx);
}

/** Lastnosti, ki jih kontrolnik dobi iz `Field`; izrecne lastnosti imajo prednost. */
export function useFieldControlProps<
  P extends {
    id?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: React.AriaAttributes["aria-invalid"];
    required?: boolean;
    disabled?: boolean;
  },
>(props: P): P {
  const f = useField();
  if (!f) return props;
  return {
    ...props,
    id: props.id ?? f.id,
    "aria-describedby":
      [props["aria-describedby"], f.describedBy].filter(Boolean).join(" ") || undefined,
    "aria-invalid": props["aria-invalid"] ?? (f.invalid || undefined),
    required: props.required ?? (f.required || undefined),
    disabled: props.disabled ?? (f.disabled || undefined),
  };
}

export interface FieldProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Sporočilo o napaki; ko je nastavljeno, je polje neveljavno. */
  error?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** Oznaka je samo za bralnike zaslona. */
  hideLabel?: boolean;
  group?: boolean;
  id?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  description,
  error,
  required = false,
  disabled = false,
  hideLabel = false,
  group = false,
  id: idProp,
  className,
  children,
}: FieldProps) {
  const auto = useId();
  const id = idProp ?? `polje-${auto}`;
  const labelId = `${id}-oznaka`;
  const descId = description ? `${id}-opis` : undefined;
  const errId = error ? `${id}-napaka` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(" ") || undefined;

  const oznaka = (
    <>
      {label}
      {required && (
        <span aria-hidden="true" className="text-danger">
          {" "}*
        </span>
      )}
    </>
  );
  const razredOznake = cn("type-small font-medium text-ink", hideLabel && "sr-only");

  const vsebina = (
    <>
      {description && (
        <p id={descId} className="type-caption text-ink-subtle">
          {description}
        </p>
      )}
      <FieldCtx.Provider
        value={{ id, labelId, describedBy, invalid: !!error, required, disabled }}
      >
        {children}
      </FieldCtx.Provider>
      {error && (
        <p id={errId} className="flex items-start gap-1.5 type-caption font-medium text-danger">
          <LuCircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </>
  );

  if (group) {
    return (
      <fieldset
        aria-describedby={describedBy}
        disabled={disabled}
        className={cn("flex min-w-0 flex-col gap-2", className)}
      >
        <legend id={labelId} className={cn(razredOznake, !hideLabel && "mb-2 float-left w-full")}>
          {oznaka}
        </legend>
        {vsebina}
      </fieldset>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label.Root id={labelId} htmlFor={id} className={razredOznake}>
        {oznaka}
      </Label.Root>
      {vsebina}
    </div>
  );
}
