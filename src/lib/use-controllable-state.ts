"use client";

import { useCallback, useState } from "react";

/**
 * Stanje, ki je lahko nadzorovano (`value` + `onChange`) ali nenadzorovano
 * (`defaultValue`). Komponente knjižnice UI ga uporabljajo, ko morajo
 * same poznati vrednost (npr. odprt dialog za animacijo izhoda).
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (v: T) => void;
}): [T, (v: T) => void] {
  const [notranja, setNotranja] = useState(defaultValue);
  const nadzorovano = value !== undefined;

  const nastavi = useCallback(
    (v: T) => {
      if (!nadzorovano) setNotranja(v);
      onChange?.(v);
    },
    [nadzorovano, onChange],
  );

  return [nadzorovano ? value : notranja, nastavi];
}
