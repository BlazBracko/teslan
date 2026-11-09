"use client";

import { createContext, forwardRef, useContext } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LuX } from "react-icons/lu";
import { crossFade, springUI } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useControllableState } from "@/lib/use-controllable-state";

/**
 * Dialog (Z3) na Radix primitivu: past fokusa, Esc zapre, fokus se vrne na
 * sprožilec, ozadje je zatemnjeno (modalna naloga, apple-design §12).
 *
 * Gibanje je vzmet brez prekoračitve, zato je prekinljivo: če dialog
 * zaprete med odpiranjem, se obrne iz trenutnega položaja (§3). Pri
 * zmanjšanem gibanju ostane le preliv.
 *
 * Stanje odprtosti hrani `Dialog` sam (ali ga dobi od zunaj), ker mora
 * vsebina vedeti, kdaj zapreti z animacijo izhoda.
 */

const OdprtCtx = createContext<{ open: boolean; setOpen: (open: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

/** Stanje najbližjega `Dialog`/`Sheet` (za animacijo izhoda in zapiranje z gesto). */
export function useDialogState() {
  return useContext(OdprtCtx);
}

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const [odprt, nastavi] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  return (
    <DialogPrimitive.Root open={odprt} onOpenChange={nastavi}>
      <OdprtCtx.Provider value={{ open: odprt, setOpen: nastavi }}>{children}</OdprtCtx.Provider>
    </DialogPrimitive.Root>
  );
}

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/** Zatemnitev za modalne plasti (dialog, predal). */
export function Scrim() {
  const reduce = useReducedMotion();
  return (
    <DialogPrimitive.Overlay asChild forceMount>
      <motion.div
        className="fixed inset-0 z-50 bg-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reduce ? crossFade : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      />
    </DialogPrimitive.Overlay>
  );
}

/** Gumb za zapiranje v kotu plasti. */
export function CloseButton({ className }: { className?: string }) {
  return (
    <DialogPrimitive.Close
      className={cn(
        "grid size-10 place-items-center rounded-full text-ink-muted",
        "transition-[background-color,transform] duration-(--duration-press)",
        "hover:bg-surface-muted hover:text-ink active:scale-[0.94] motion-reduce:active:scale-100",
        className,
      )}
    >
      <LuX aria-hidden="true" className="size-5" />
      <span className="sr-only">Zapri</span>
    </DialogPrimitive.Close>
  );
}

export interface DialogContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "asChild" | "forceMount"> {
  /** Skrije gumb za zapiranje (npr. ko ima dialog svoje gumbe). */
  hideClose?: boolean;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(function DialogContent(
  { className, children, hideClose = false, ...props },
  ref,
) {
  const { open: odprt } = useDialogState();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {odprt && (
        <DialogPrimitive.Portal forceMount>
          <Scrim />
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-gutter">
            <DialogPrimitive.Content ref={ref} asChild forceMount {...props}>
              <motion.div
                className={cn(
                  "pointer-events-auto relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col gap-4 overflow-y-auto",
                  "rounded-xl bg-surface p-6 shadow-overlay outline-none sm:p-8",
                  className,
                )}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
                transition={reduce ? crossFade : springUI}
              >
                {children}
                {!hideClose && <CloseButton className="absolute top-3 right-3" />}
              </motion.div>
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
});

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 pr-8", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export const DialogTitle = forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return <DialogPrimitive.Title ref={ref} className={cn("type-h3 text-ink", className)} {...props} />;
});

export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("type-body text-ink-muted", className)}
      {...props}
    />
  );
});
