import Image from "next/image";
import { ImagePlaceholder } from "@/components/ui/Card";
import type { SlikaPogled } from "@/katalog/podatki";
import { cn } from "@/lib/utils";

/**
 * Slika iz CMS v okvirju s stalnim razmerjem (mreža se ne premika, ko slika
 * pride). Brez slike nadomestna ploskev (Z15). Prosojni PNG-ji in izrezki z
 * belim ozadjem dobijo `contain`, fotografije `cover` z žariščem iz admina.
 */
export function SlikaIzdelka({
  slika,
  sizes,
  priority = false,
  className,
  nadomestnaOznaka,
}: {
  slika: SlikaPogled | null | undefined;
  sizes: string;
  priority?: boolean;
  className?: string;
  nadomestnaOznaka?: string;
}) {
  if (!slika) {
    return <ImagePlaceholder className={cn("w-full", className)} label={nadomestnaOznaka} />;
  }
  const izrezek = /\.png($|\?)/i.test(slika.url);
  return (
    <div className={cn("relative overflow-hidden bg-surface-muted", izrezek && "bg-surface", className)}>
      <Image
        src={slika.url}
        alt={slika.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={izrezek ? "object-contain p-4" : "object-cover"}
        style={
          !izrezek && slika.zarisce
            ? { objectPosition: `${slika.zarisce.x}% ${slika.zarisce.y}%` }
            : undefined
        }
      />
    </div>
  );
}
