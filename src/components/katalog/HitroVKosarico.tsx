"use client";

import { useRouter } from "next/navigation";
import { LuPlus } from "react-icons/lu";
import { POT_KOSARICE } from "@/components/postavitev/navigacija";
import { useToast } from "@/components/ui/Toast";
import { NAJVEC_KOSOV } from "@/kosarica/postavke";
import { dodajVKosarico, kolicinaVKosarici } from "@/kosarica/shramba";
import { KOS, stevilo } from "@/lib/sklanjanje";
import { cn } from "@/lib/utils";

/**
 * „V košarico“ neposredno s kartice na seznamu, za izdelke z eno samo
 * naročljivo velikostjo (pri več velikostih kupec izbere na podstrani).
 * Doda en kos; količina iste velikosti ne preseže zaloge in 20 kosov,
 * enako kot na podstrani izdelka.
 *
 * Gumb je nad raztegnjeno povezavo kartice (`z-10`), tarča je 44 px.
 */
export function HitroVKosarico({
  izdelekId,
  velikostId,
  ime,
  velikost,
  zaloga,
  className,
}: {
  izdelekId: number;
  velikostId: string;
  ime: string;
  velikost: string;
  zaloga: number;
  className?: string;
}) {
  const { toast } = useToast();
  const router = useRouter();

  const dodaj = () => {
    const dodano = dodajVKosarico({ izdelekId, velikostId, kolicina: 1 }, Math.min(zaloga, NAJVEC_KOSOV));
    const odpri = { label: "Odpri košarico", onClick: () => router.push(POT_KOSARICE) };
    if (dodano === 0) {
      toast({
        variant: "info",
        title: "Več kosov ni mogoče dodati",
        description: `V košarici je že ${stevilo(kolicinaVKosarici(izdelekId, velikostId), KOS)}, kar je največ, kolikor jih lahko naročite.`,
        action: odpri,
      });
      return;
    }
    toast({ variant: "success", title: "Dodano v košarico", description: `${ime}, ${velikost}: 1 kos.`, action: odpri });
  };

  return (
    <button
      type="button"
      onClick={dodaj}
      aria-label={`Dodaj v košarico: ${ime}, ${velikost}`}
      className={cn(
        "relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-brand text-on-brand shadow-raised",
        "transition-[transform,background-color] duration-(--duration-press) ease-(--ease-out-soft)",
        "hover:bg-brand-strong active:scale-[0.94] motion-reduce:active:scale-100",
        className,
      )}
    >
      <LuPlus aria-hidden="true" className="size-5" />
    </button>
  );
}
