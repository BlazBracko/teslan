"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuMenu, LuPhone } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { cn } from "@/lib/utils";
import { IkonaKosarice } from "@/components/kosarica/IkonaKosarice";
import { GLAVNA_NAVIGACIJA, jeAktivna, POT_KOSARICE } from "./navigacija";

/** Nad to višino glava ostane vidna ne glede na smer scrolla. */
const VEDNO_VIDNA_DO = 96;

/**
 * Mrtvi pas, preden scroll šteje za spremembo smeri: sledilna ploščica in
 * iOS gumitrak dajeta drobne nasprotne odmike, ob katerih bi glava utripala.
 * Odmiki pod pragom se seštevajo, ker se izhodišče premakne šele ob
 * priznani spremembi.
 */
const MRTVI_PAS = 6;

/**
 * Glava (Z7): logotip, glavna navigacija, ikona košarice s številom kosov
 * (vedno vidna, tudi na mobilnem), na mobilnem meni v predalu (Radix
 * dialog prek `Sheet`: past fokusa, Esc, vrnitev fokusa).
 *
 * Ob scrollu navzdol se umakne, ob scrollu navzgor vrne (vedenje stare
 * strani, ki je lastniku ostalo všeč). Umik je `transform`, zato teče na
 * compositorju; pri zmanjšanem gibanju glava ostane na mestu. Fokus s
 * tipkovnico jo vedno vrne.
 */
export function Glava({ telefon, telefonPovezava }: { telefon: string | null; telefonPovezava: string | null }) {
  const pot = usePathname();
  const [odprt, setOdprt] = useState(false);
  const [skrita, setSkrita] = useState(false);
  const izhodisce = useRef(0);

  // Ob menjavi strani: predal se zapre, glava se vrne (vzorec „prilagodi
  // stanje med renderjem“ namesto efekta).
  const [prejsnjaPot, setPrejsnjaPot] = useState(pot);
  if (pot !== prejsnjaPot) {
    setPrejsnjaPot(pot);
    setOdprt(false);
    setSkrita(false);
  }

  useEffect(() => {
    izhodisce.current = window.scrollY;
    let okvir = 0;
    const obScrollu = () => {
      cancelAnimationFrame(okvir);
      okvir = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < VEDNO_VIDNA_DO) {
          izhodisce.current = y;
          setSkrita(false);
          return;
        }
        const razlika = y - izhodisce.current;
        if (Math.abs(razlika) < MRTVI_PAS) return;
        izhodisce.current = y;
        setSkrita(razlika > 0);
      });
    };
    window.addEventListener("scroll", obScrollu, { passive: true });
    return () => {
      cancelAnimationFrame(okvir);
      window.removeEventListener("scroll", obScrollu);
    };
  }, [pot]);

  return (
    <header
      onFocusCapture={() => setSkrita(false)}
      data-skrita={skrita && !odprt ? "" : undefined}
      className={cn(
        "sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md",
        "transition-transform duration-(--duration-base) ease-(--ease-out-soft)",
        "data-skrita:-translate-y-full motion-reduce:data-skrita:translate-y-0",
      )}
    >
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-gutter lg:px-gutter-lg">
        <Link
          href="/"
          aria-label="Domačija Tešlan, na domačo stran"
          className="-mx-1 flex items-center gap-2.5 rounded-md px-1"
        >
          <Image src="/logo.png" alt="" width={40} height={40} priority className="size-10 object-contain" />
          <span className="type-title font-display text-ink">Domačija Tešlan</span>
        </Link>

        <nav aria-label="Glavna navigacija" className="hidden md:ml-auto md:block">
          <ul className="flex items-center gap-1">
            {GLAVNA_NAVIGACIJA.map((p) => {
              const aktivna = jeAktivna(p.href, pot);
              return (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    aria-current={aktivna ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-10 items-center rounded-md px-3 type-nav",
                      "transition-colors duration-(--duration-fast)",
                      aktivna ? "text-ink" : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                      aktivna &&
                        "after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-brand",
                    )}
                  >
                    {p.oznaka}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <IkonaKosarice aktivna={jeAktivna(POT_KOSARICE, pot)} />
          <Sheet open={odprt} onOpenChange={setOdprt}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Odpri meni">
                <LuMenu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" aria-describedby={undefined}>
              <SheetTitle>Meni</SheetTitle>
              <nav aria-label="Glavna navigacija">
                <ul className="flex flex-col gap-1">
                  {GLAVNA_NAVIGACIJA.map((p) => {
                    const aktivna = jeAktivna(p.href, pot);
                    return (
                      <li key={p.href}>
                        <Link
                          href={p.href}
                          onClick={() => setOdprt(false)}
                          aria-current={aktivna ? "page" : undefined}
                          className={cn(
                            "flex min-h-12 items-center rounded-lg px-3 type-title",
                            "transition-colors duration-(--duration-fast)",
                            aktivna ? "bg-brand-soft text-brand" : "text-ink hover:bg-surface-muted",
                          )}
                        >
                          {p.oznaka}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              {telefon && telefonPovezava && (
                <div className="mt-auto flex flex-col gap-2 border-t border-line pt-4">
                  <p className="type-small text-ink-muted">Naročila in obiski po dogovoru</p>
                  <Button asChild variant="secondary" block>
                    <a href={telefonPovezava}>
                      <LuPhone aria-hidden="true" />
                      {telefon}
                    </a>
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
