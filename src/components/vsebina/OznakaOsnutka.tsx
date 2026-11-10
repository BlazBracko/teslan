import { connection } from "next/server";
import { LuFileWarning } from "react-icons/lu";
import { okolje } from "@/env";
import { cn } from "@/lib/utils";

/**
 * Na stagingu (`NOINDEX=1`) označi besedila, ki jih je napisal agent in jih
 * lastnik še ni pregledal (enako kot „Osnutek – v pregledu“ na pravnih
 * straneh). V produkciji se ne izriše.
 */
export async function OznakaOsnutka({ children, className }: { children?: React.ReactNode; className?: string }) {
  // Okolje beremo ob zahtevi: ista gradnja teče na stagingu in v produkciji.
  await connection();
  if (okolje().NOINDEX !== "1") return null;
  return (
    <div
      role="note"
      className={cn("flex gap-3 rounded-lg bg-warning-soft p-4 type-small text-warning ring-1 ring-warning/30", className)}
    >
      <LuFileWarning aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <p>
        <strong className="font-semibold">Osnutek besedila – za pregled.</strong>{" "}
        {children ?? "Besedilo je pripravljeno kot predlog. Lastnik ga pred objavo trgovine pregleda in popravi."}
      </p>
    </div>
  );
}
