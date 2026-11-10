"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";
import { imaPrejsnjoStran } from "@/components/postavitev/zgodovina";
import { cn } from "@/lib/utils";

/**
 * Gumb „Nazaj“ (podstran izdelka). Če je kupec prišel z druge strani
 * trgovine, ga vrne tja (z istim filtrom in položajem na seznamu); sicer
 * odpre seznam `nadomestna`. Brez JavaScripta je navadna povezava.
 */
export function GumbNazaj({
  nadomestna,
  oznaka = "Nazaj",
  className,
}: {
  nadomestna: string;
  oznaka?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <Link
      href={nadomestna}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !imaPrejsnjoStran()) return;
        e.preventDefault();
        router.back();
      }}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full bg-surface pr-4 pl-3 type-small font-medium text-ink",
        "shadow-raised ring-1 ring-line ring-inset transition-[background-color,transform] duration-(--duration-fast)",
        "hover:bg-surface-muted active:scale-[0.97] motion-reduce:active:scale-100",
        className,
      )}
    >
      <LuArrowLeft aria-hidden="true" className="size-4" />
      {oznaka}
    </Link>
  );
}
