"use client";

import { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  AnimatePresence,
  m,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { crossFade, shouldCommit, springMove } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { CloseButton, Dialog, Scrim, useDialogState } from "./Dialog";

/**
 * Predal (sheet), npr. mobilni meni (Z7) ali košarica. Isti Radix dialog
 * kot `Dialog`, le da pride z roba zaslona in tja tudi odide (prostorska
 * doslednost, apple-design §7).
 *
 * Predal je mogoče odvleči: sledi prstu 1 : 1, ob spustu pa se odločimo
 * glede na projekcijo momenta, ne glede na položaj (§6), in vzmet
 * nadaljuje s hitrostjo prsta (§5). Spodnji predal se vleče samo za ročaj,
 * da vlečenje ne tekmuje z drsenjem vsebine.
 */

export const Sheet = Dialog;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

type Stran = "left" | "right" | "bottom";

const postavitev: Record<Stran, string> = {
  right: "inset-y-0 right-0 h-dvh w-[min(26rem,calc(100vw-3rem))] rounded-l-xl",
  left: "inset-y-0 left-0 h-dvh w-[min(26rem,calc(100vw-3rem))] rounded-r-xl",
  bottom: "inset-x-0 bottom-0 max-h-[90dvh] w-full rounded-t-2xl",
};

const izven: Record<Stran, { x?: string; y?: string }> = {
  right: { x: "100%" },
  left: { x: "-100%" },
  bottom: { y: "100%" },
};

export interface SheetContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "asChild" | "forceMount"> {
  side?: Stran;
}

export const SheetContent = forwardRef<HTMLDivElement, SheetContentProps>(function SheetContent(
  { side = "right", className, children, ...props },
  ref,
) {
  const { open: odprt, setOpen } = useDialogState();
  const reduce = useReducedMotion();
  const dragControls = useDragControls();
  const os = side === "bottom" ? "y" : "x";
  // Smer zapiranja: +1 pomeni proti pozitivni osi (desno, navzdol).
  const smer = side === "left" ? -1 : 1;

  return (
    <AnimatePresence>
      {odprt && (
        <DialogPrimitive.Portal forceMount>
          <Scrim />
          <DialogPrimitive.Content ref={ref} asChild forceMount {...props}>
            <m.div
              className={cn(
                "fixed z-50 flex flex-col bg-surface shadow-overlay outline-none",
                postavitev[side],
                className,
              )}
              initial={reduce ? { opacity: 0 } : izven[side]}
              animate={reduce ? { opacity: 1 } : { x: 0, y: 0 }}
              exit={reduce ? { opacity: 0 } : izven[side]}
              transition={reduce ? crossFade : springMove}
              drag={reduce ? false : os}
              dragListener={side !== "bottom"}
              dragControls={dragControls}
              dragDirectionLock
              dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
              dragElastic={
                side === "bottom"
                  ? { top: 0.05, bottom: 1 }
                  : side === "right"
                    ? { left: 0.05, right: 1 }
                    : { left: 1, right: 0.05 }
              }
              onDragEnd={(_e: PointerEvent, info: PanInfo) => {
                const odmik = info.offset[os] * smer;
                const hitrost = info.velocity[os] * smer;
                const sirina = side === "bottom" ? window.innerHeight : window.innerWidth;
                // Sicer se predal z vzmetjo vrne na mesto (dragConstraints).
                if (shouldCommit(odmik, hitrost, sirina * 0.25)) setOpen(false);
              }}
            >
              {side === "bottom" && (
                <div
                  className="flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-1 active:cursor-grabbing"
                  onPointerDown={(e) => dragControls.start(e)}
                  aria-hidden="true"
                >
                  <span className="h-1.5 w-10 rounded-full bg-line" />
                </div>
              )}
              <CloseButton className="absolute top-3 right-3 z-10" />
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6 pt-5">
                {children}
              </div>
            </m.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
});

export const SheetTitle = forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function SheetTitle({ className, ...props }, ref) {
  return <DialogPrimitive.Title ref={ref} className={cn("type-h3 pr-10 text-ink", className)} {...props} />;
});

export const SheetDescription = forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function SheetDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description ref={ref} className={cn("type-body text-ink-muted", className)} {...props} />
  );
});
