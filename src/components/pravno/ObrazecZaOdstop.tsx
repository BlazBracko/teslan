"use client";

import { useEffect, useRef, useState } from "react";
import { LuCheck, LuCopy } from "react-icons/lu";
import { Button } from "@/components/ui/Button";

/**
 * Vzorčni obrazec za odstop kot besedilo za kopiranje (Z61). Besedilo je
 * v polju samo za branje, da ga je mogoče označiti tudi brez gumba
 * (stari brskalniki, brez dovoljenja za odložišče).
 */
export function ObrazecZaOdstop({ besedilo }: { besedilo: string }) {
  const [stanje, setStanje] = useState<"" | "kopirano" | "napaka">("");
  const polje = useRef<HTMLTextAreaElement>(null);
  const casovnik = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(casovnik.current), []);

  async function kopiraj() {
    clearTimeout(casovnik.current);
    try {
      await navigator.clipboard.writeText(besedilo);
      setStanje("kopirano");
    } catch {
      // Brez dostopa do odložišča besedilo vsaj označimo za ročno kopiranje.
      polje.current?.select();
      setStanje("napaka");
    }
    casovnik.current = setTimeout(() => setStanje(""), 4000);
  }

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="obrazec-za-odstop" className="type-small font-medium text-ink">
        Obrazec za odstop od pogodbe
      </label>
      <textarea
        id="obrazec-za-odstop"
        ref={polje}
        readOnly
        value={besedilo}
        rows={besedilo.split("\n").length + 1}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full resize-none rounded-lg bg-surface p-4 font-mono type-small text-ink ring-1 ring-line focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={kopiraj}>
          {stanje === "kopirano" ? <LuCheck aria-hidden="true" /> : <LuCopy aria-hidden="true" />}
          Kopiraj besedilo
        </Button>
        <p role="status" className="type-small text-ink-muted">
          {stanje === "kopirano" && "Besedilo je kopirano. Prilepite ga v e-pošto in dopolnite."}
          {stanje === "napaka" && "Kopiranje ni uspelo. Besedilo je označeno, kopirajte ga ročno."}
        </p>
      </div>
    </div>
  );
}
