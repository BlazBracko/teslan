import { forwardRef } from "react";
import { LuLeaf } from "react-icons/lu";
import { cn } from "@/lib/utils";

/**
 * Kartica (Z3): ploskev, ki je svetlejša od podlage, z nizko senco in
 * tanko črto. `interactive` doda odziv na pritisk za kartice, ki so v
 * celoti povezava (npr. izdelek na seznamu).
 */
export const Card = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }
>(function Card({ className, interactive = false, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl bg-surface shadow-raised ring-1 ring-line",
        interactive && [
          "transition-[transform,box-shadow] duration-(--duration-base) ease-(--ease-out-soft)",
          "hover:shadow-floating active:scale-[0.985] motion-reduce:active:scale-100",
          "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus",
        ],
        className,
      )}
      {...props}
    />
  );
});

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-1 flex-col gap-2 p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between gap-3 border-t border-line px-5 py-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("type-h3 text-ink", className)} {...props} />;
}

/**
 * Nadomestna ploskev, ko izdelek nima slike (Z15). Ima razmerje stranic,
 * da se mreža ne premakne, ko slika pride.
 */
export function ImagePlaceholder({
  className,
  label = "Slika še ni na voljo",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("grid aspect-[4/3] place-items-center bg-surface-muted text-ink-subtle", className)}
    >
      <LuLeaf aria-hidden="true" className="size-8" />
    </div>
  );
}
