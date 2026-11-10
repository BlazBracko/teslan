"use client";

import { useState } from "react";
import Image from "next/image";
import type { SlikaPogled } from "@/katalog/podatki";
import { cn } from "@/lib/utils";
import { SlikaIzdelka } from "./SlikaIzdelka";

/**
 * Galerija na podstrani izdelka (Z15): velika slika in sličice za izbiro.
 * Brez slik nadomestna ploskev, z eno sliko brez sličic. Menjava slike je
 * takojšnja (brez prehoda), da ne zadržuje.
 */
export function GalerijaIzdelka({ slike, ime }: { slike: SlikaPogled[]; ime: string }) {
  const [izbrana, setIzbrana] = useState(0);
  const slika = slike[izbrana] ?? slike[0];

  return (
    <div className="flex flex-col gap-3">
      <SlikaIzdelka
        slika={slika}
        sizes="(min-width: 1024px) 36rem, 100vw"
        prednostna={izbrana === 0}
        className="aspect-[4/3] rounded-xl ring-1 ring-line sm:aspect-square"
        nadomestnaOznaka={`${ime}: slika še ni na voljo`}
      />
      {slike.length > 1 && (
        <ul className="flex flex-wrap gap-2" aria-label="Slike izdelka">
          {slike.map((s, i) => (
            <li key={`${s.url}-${i}`}>
              <button
                type="button"
                onClick={() => setIzbrana(i)}
                aria-pressed={i === izbrana}
                aria-label={`Pokaži sliko ${i + 1} od ${slike.length}: ${s.alt}`}
                className={cn(
                  "relative block size-18 overflow-hidden rounded-md bg-surface-muted",
                  "ring-1 ring-line transition-[box-shadow] duration-(--duration-fast)",
                  i === izbrana ? "ring-2 ring-brand" : "hover:ring-line-strong",
                )}
              >
                <Image src={s.url} alt="" fill sizes="4.5rem" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
