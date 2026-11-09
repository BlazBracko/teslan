"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { LuCircleAlert, LuCircleCheck, LuInfo, LuX } from "react-icons/lu";
import { crossFade, shouldCommit, springUI } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Obvestila (toast, Z3) na Radix primitivu: bralniki zaslona jih preberejo
 * (živa regija), F8 skoči vanje, čas se ustavi, ko je miška ali fokus na
 * obvestilu.
 *
 * Obvestilo je mogoče odriniti v desno: sledi prstu 1 : 1, ob spustu
 * odloči projekcija momenta (apple-design §6). Uporaba:
 *
 *   const { toast } = useToast();
 *   toast({ title: "Dodano v košarico", variant: "success" });
 */

type Vrsta = "neutral" | "success" | "danger" | "info";

export interface ToastOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  variant?: Vrsta;
  /** Trajanje v ms; privzeto 5000. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface Obvestilo extends ToastOptions {
  id: number;
}

const ToastCtx = createContext<{ toast: (o: ToastOptions) => number; dismiss: (id: number) => void } | null>(
  null,
);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast potrebuje <ToastProvider> višje v drevesu.");
  return ctx;
}

const ikona: Record<Vrsta, React.ReactNode> = {
  neutral: null,
  success: <LuCircleCheck aria-hidden="true" className="size-5 text-success" />,
  danger: <LuCircleAlert aria-hidden="true" className="size-5 text-danger" />,
  info: <LuInfo aria-hidden="true" className="size-5 text-info" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [seznam, setSeznam] = useState<Obvestilo[]>([]);
  const naslednji = useRef(1);

  const dismiss = useCallback((id: number) => {
    setSeznam((s) => s.filter((o) => o.id !== id));
  }, []);

  const toast = useCallback((o: ToastOptions) => {
    const id = naslednji.current++;
    // Največ trije hkrati; najstarejše odide.
    setSeznam((s) => [...s, { ...o, id }].slice(-3));
    return id;
  }, []);

  const vrednost = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastCtx.Provider value={vrednost}>
      <ToastPrimitive.Provider label="Obvestilo" swipeDirection="right" swipeThreshold={Number.MAX_SAFE_INTEGER}>
        {children}
        <AnimatePresence initial={false}>
          {seznam.map((o) => (
            <EnoObvestilo key={o.id} obvestilo={o} onClose={() => dismiss(o.id)} />
          ))}
        </AnimatePresence>
        <ToastPrimitive.Viewport
          className={cn(
            "fixed inset-x-0 bottom-0 z-[60] m-0 flex list-none flex-col items-center gap-2 p-gutter outline-none",
            "sm:inset-x-auto sm:right-0 sm:items-end sm:p-6",
          )}
        />
      </ToastPrimitive.Provider>
    </ToastCtx.Provider>
  );
}

function EnoObvestilo({ obvestilo, onClose }: { obvestilo: Obvestilo; onClose: () => void }) {
  const reduce = useReducedMotion();
  const { title, description, variant = "neutral", duration = 5000, action } = obvestilo;

  return (
    <ToastPrimitive.Root
      asChild
      forceMount
      duration={duration}
      type={variant === "danger" ? "foreground" : "background"}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <motion.li
        layout={!reduce}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, x: 64, transition: springUI }}
        transition={reduce ? crossFade : springUI}
        drag={reduce ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.05, right: 1 }}
        onDragEnd={(_e: PointerEvent, info: PanInfo) => {
          if (shouldCommit(info.offset.x, info.velocity.x, 96)) onClose();
        }}
        className={cn(
          "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg bg-surface p-4 pr-2",
          "shadow-floating ring-1 ring-line",
        )}
      >
        {ikona[variant]}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <ToastPrimitive.Title className="type-small font-semibold text-ink">{title}</ToastPrimitive.Title>
          {description && (
            <ToastPrimitive.Description className="type-small text-ink-muted">
              {description}
            </ToastPrimitive.Description>
          )}
          {action && (
            <ToastPrimitive.Action
              altText={action.label}
              onClick={action.onClick}
              className="mt-1 self-start type-small font-semibold text-brand underline underline-offset-4"
            >
              {action.label}
            </ToastPrimitive.Action>
          )}
        </div>
        <ToastPrimitive.Close className="grid size-8 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink">
          <LuX aria-hidden="true" className="size-4" />
          <span className="sr-only">Zapri obvestilo</span>
        </ToastPrimitive.Close>
      </motion.li>
    </ToastPrimitive.Root>
  );
}
