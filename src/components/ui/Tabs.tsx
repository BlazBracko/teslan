"use client";

import { createContext, forwardRef, useContext, useId } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion, useReducedMotion } from "framer-motion";
import { springMove } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useControllableState } from "@/lib/use-controllable-state";

/**
 * Zavihki (Z3) na Radix primitivu: puščice premikajo med zavihki, Tab skoči
 * v vsebino. Podčrtaj se premakne z vzmetjo do izbranega zavihka in tako
 * pokaže, od kod in kam (apple-design §8).
 */

const TabsCtx = createContext<{ value: string; skupina: string }>({ value: "", skupina: "" });

export interface TabsProps
  extends Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>, "value" | "defaultValue" | "onValueChange"> {
  value?: string;
  defaultValue: string;
  onValueChange?: (v: string) => void;
}

export function Tabs({ value, defaultValue, onValueChange, className, ...props }: TabsProps) {
  const [v, nastavi] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const skupina = useId();
  return (
    <TabsCtx.Provider value={{ value: v, skupina }}>
      <TabsPrimitive.Root
        value={v}
        onValueChange={nastavi}
        className={cn("flex flex-col gap-4", className)}
        {...props}
      />
    </TabsCtx.Provider>
  );
}

export const TabsList = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn("flex gap-1 overflow-x-auto border-b border-line", className)}
      {...props}
    />
  );
});

export const TabsTrigger = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, children, value, ...props }, ref) {
  const { value: izbran, skupina } = useContext(TabsCtx);
  const reduce = useReducedMotion();
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(
        "relative -mb-px flex h-11 shrink-0 items-center px-3 type-nav text-ink-muted",
        "transition-colors duration-(--duration-fast) hover:text-ink",
        "data-[state=active]:text-ink",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {izbran === value && (
        <motion.span
          layoutId={reduce ? undefined : `podcrtaj-${skupina}`}
          transition={springMove}
          aria-hidden="true"
          className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand"
        />
      )}
    </TabsPrimitive.Trigger>
  );
});

export const TabsContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return <TabsPrimitive.Content ref={ref} className={cn("outline-none", className)} {...props} />;
});
