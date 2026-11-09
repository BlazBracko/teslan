import { cn } from "@/lib/utils";

/**
 * Okostje (Z3) za vsebino, ki se nalaga. Utripa počasi (1,6 s, ne blizu
 * 0,2 Hz, apple-design §14); pri zmanjšanem gibanju miruje.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-shimmer rounded-md bg-surface-muted", className)}
      {...props}
    />
  );
}
