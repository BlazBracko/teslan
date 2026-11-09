"use client";

import Link from "next/link";
import { LuShoppingBag } from "react-icons/lu";
import { buttonVariants } from "@/components/ui/Button";
import { POT_KOSARICE } from "@/components/postavitev/navigacija";
import { useSteviloKosov } from "@/kosarica/shramba";
import { KOS, stevilo } from "@/lib/sklanjanje";
import { cn } from "@/lib/utils";

/**
 * Ikona košarice v glavi (Z7) s številom kosov. Število pride iz
 * `localStorage`, zato ga strežnik ne pozna: do hidracije je ikona brez
 * značke, nato se posodobi ob vsaki spremembi košarice (tudi v drugem
 * zavihku).
 */
export function IkonaKosarice({ aktivna }: { aktivna: boolean }) {
  const kosi = useSteviloKosov();
  const opis =
    kosi === null ? "Košarica" : kosi === 0 ? "Košarica je prazna" : `Košarica, ${stevilo(kosi, KOS)}`;

  return (
    <Link
      href={POT_KOSARICE}
      aria-label={opis}
      aria-current={aktivna ? "page" : undefined}
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), aktivna && "bg-surface-muted")}
    >
      <LuShoppingBag aria-hidden="true" />
      {kosi !== null && kosi > 0 && (
        <span
          aria-hidden="true"
          data-testid="stevilo-v-kosarici"
          className={cn(
            "absolute top-0.5 right-0.5 grid h-5 min-w-5 place-items-center rounded-full px-1",
            "bg-brand text-on-brand type-caption type-numeric leading-none font-semibold",
            "ring-2 ring-canvas",
          )}
        >
          {kosi > 99 ? "99+" : kosi}
        </span>
      )}
    </Link>
  );
}
