"use client";

import { useFormFields } from "@payloadcms/ui";
import { formatirajCeno } from "@/lib/denar";

/**
 * Pod poljem s centi pokaže znesek v evrih („550 = 5,50 €“), da se pri
 * vpisu cene ni treba preštevati ničel (`admin.components.afterInput`).
 */
export function ZnesekVEvrih({ path }: { path: string }) {
  const vrednost = useFormFields(([polja]) => polja[path]?.value);
  if (typeof vrednost !== "number" || !Number.isInteger(vrednost)) return null;
  return (
    <p className="teslan-evri" aria-live="polite">
      = <strong>{formatirajCeno(vrednost)}</strong>
    </p>
  );
}
