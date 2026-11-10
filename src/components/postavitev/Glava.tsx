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
import { useSteviloKosov } from "@/kosarica/shramba";
import { GLAVNA_NAVIGACIJA, jeAktivna, POMOC_POVEZAVE, POT_KOSARICE } from "./navigacija";
import { zabeleziPot } from "./zgodovina";

/** Nad to višino glava ostane vidna ne glede na smer scrolla. */
const VEDNO_VIDNA_DO = 96;

/**
 * Mrtvi pas, preden scroll šteje za spremembo smeri: sledilna ploščica in
 * iOS gumitrak dajeta drobne nasprotne odmike, ob katerih bi glava utripala.
 * Odmiki pod pragom se seštevajo, ker se izhodišče premakne šele ob
 * priznani spremembi.
 */
const MRTVI_PAS = 6;

/** Toliko časa po spremembi košarice scroll glave ne umakne. */
const ZADRZI_PO_DODAJANJU_MS = 800;

/**
 * Glava (Z7): logotip, glavna navigacija, ikona košarice s številom kosov
 * (vedno vidna, tudi na mobilnem), na mobilnem meni v predalu (Radix
 * dialog prek `Sheet`: past fokusa, Esc, vrnitev fokusa).
 *
 * Oblika je plavajoči otok s stare strani, ki je lastniku ostal všeč:
 * temno zelena prosojna plast z zameglitvijo (apple-design §12), ki lebdi
 * nad fotografijo v uvodu in nad svetlimi podstranmi. Ker je `fixed`, mu
 * postavitev rezervira prostor (`pt-glava` na `main`); uvod domače strani
 * in glave podstrani segajo podenj.
 *
 * Ob scrollu navzdol se umakne, ob scrollu navzgor ali ko kupec doda
 * izdelek v košarico, se vrne. Umik je
 * `transform`, zato teče na compositorju; pri zmanjšanem gibanju glava
 * ostane na mestu. Fokus s tipkovnico jo vedno vrne.
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

  // Ko kupec doda izdelek v košarico, se umaknjena glava vrne: številka na
  // ikoni košarice je potrditev dejanja in pot do košarice mora biti pri roki.
  const kosi = useSteviloKosov();
  const [prejsnjiKosi, setPrejsnjiKosi] = useState(kosi);
  if (kosi !== prejsnjiKosi) {
    setPrejsnjiKosi(kosi);
    if (kosi !== null && prejsnjiKosi !== null && kosi > prejsnjiKosi) setSkrita(false);
  }
  // Klik na „V košarico“ pogosto sledi scrollu do gumba; dogodek scrolla, ki
  // še čaka na izris, glave ne sme takoj spet umakniti.
  const zadrziDo = useRef(0);
  useEffect(() => {
    zadrziDo.current = performance.now() + ZADRZI_PO_DODAJANJU_MS;
  }, [kosi]);

  // Za gumb „Nazaj“ na podstrani izdelka.
  useEffect(() => zabeleziPot(pot), [pot]);

  useEffect(() => {
    izhodisce.current = window.scrollY;
    let okvir = 0;
    const obScrollu = () => {
      cancelAnimationFrame(okvir);
      okvir = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < VEDNO_VIDNA_DO || performance.now() < zadrziDo.current) {
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

  const umaknjena = skrita && !odprt;

  return (
    // Ovoj ne prestreza klikov, da ostane stran ob otoku klikljiva.
    <header
      onFocusCapture={() => setSkrita(false)}
      data-skrita={umaknjena ? "" : undefined}
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 lg:px-gutter-lg",
        "transition-transform duration-(--duration-base) ease-(--ease-out-soft)",
        "data-skrita:-translate-y-[130%] motion-reduce:data-skrita:translate-y-0",
      )}
    >
      <div
        data-material=""
        className={cn(
          "pointer-events-auto mx-auto flex h-14 max-w-content items-center justify-between gap-3 rounded-[1.375rem] pr-2 pl-3 md:h-16 md:pr-3 md:pl-4",
          "bg-brand/92 text-ink-inverse shadow-floating ring-1 ring-ink-inverse/20 ring-inset backdrop-blur-xl backdrop-saturate-150",
        )}
      >
        <Link
          href="/"
          aria-label="Domačija Tešlan, na domačo stran"
          className="flex min-w-0 items-center gap-2.5 rounded-xl py-1 pr-2 focus-visible:outline-ink-inverse"
        >
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            loading="eager"
            className="size-9 shrink-0 rounded-full bg-surface object-contain md:size-10"
          />
          <span className="truncate font-display type-title text-ink-inverse">Domačija Tešlan</span>
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
                      "relative inline-flex h-10 items-center rounded-xl px-3.5 type-nav",
                      "transition-colors duration-(--duration-fast) focus-visible:outline-ink-inverse",
                      // Aktivna stran: kremno besedilo in svetlo zelena črta. Svetlo
                      // zeleno besedilo na prosojnem otoku nad svetlo stranjo ne
                      // doseže 4,5 : 1, črta (ni besedilo) pa potrebuje le 3 : 1.
                      aktivna ? "font-semibold text-ink-inverse" : "text-ink-inverse hover:bg-ink-inverse/12",
                      aktivna &&
                        "after:absolute after:inset-x-3.5 after:bottom-1 after:h-0.5 after:rounded-full after:bg-brand-bright",
                    )}
                  >
                    {p.oznaka}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-0.5">
          <IkonaKosarice aktivna={jeAktivna(POT_KOSARICE, pot)} />
          <Sheet open={odprt} onOpenChange={setOdprt}>
            <SheetTrigger asChild>
              <Button variant="ghostInverse" size="icon" className="md:hidden" aria-label="Odpri meni">
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
              <nav aria-label="Pomoč pri nakupu" className="border-t border-line pt-3">
                <ul className="flex flex-col">
                  {POMOC_POVEZAVE.map((p) => (
                    <li key={p.href}>
                      <Link
                        href={p.href}
                        onClick={() => setOdprt(false)}
                        className="flex min-h-11 items-center rounded-lg px-3 type-body text-ink-muted hover:bg-surface-muted hover:text-ink"
                      >
                        {p.oznaka}
                      </Link>
                    </li>
                  ))}
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
