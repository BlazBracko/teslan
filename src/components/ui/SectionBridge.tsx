/**
 * Mehak prehod med dvema sekcijama.
 *
 * Stran menja svetlo in temno podlago, kar je zavestna izbira. Brez tega
 * pasu meja pade na eno vrstico pikslov in se bere kot trd rob — skill to
 * pokriva v §12: scroll edge effects, ne trdi delilniki.
 *
 * Dvoje, kar naredi prehod res neopazen:
 *
 *  1. Krivulja, ne premica. Linearen gradient ima na obeh koncih prelom v
 *     hitrosti spremembe (iz nič v konstantno), in oko ta prelom vidi kot
 *     tanko črto na robu prelivа. Smoothstep ima na obeh koncih odvod nič,
 *     zato se preliv v ploskev vtopi brez vidne meje.
 *
 *  2. Interpolacija v oklab. Ravna sRGB pot med kremo in temno zeleno pade
 *     skozi sivino in se bere kot umazan preliv; oklab drži ton zelene.
 */

/** Število vmesnih postank. Več jih je, manj je stopničenja v 8-bitni barvi. */
const STOPS = 16;

/** t²(3−2t): klasični smoothstep — odvod je nič pri t=0 in t=1. */
const smoothstep = (t: number) => t * t * (3 - 2 * t);

function easedGradient(from: string, to: string): string {
  const stops = Array.from({ length: STOPS + 1 }, (_, i) => {
    const t = i / STOPS;
    const delez = Math.round(smoothstep(t) * 1000) / 10;
    const mesto = Math.round(t * 1000) / 10;
    return `color-mix(in oklab, ${to} ${delez}%, ${from}) ${mesto}%`;
  });
  return `linear-gradient(to bottom in oklab, ${stops.join(', ')})`;
}

/** Barve sekcij na enem mestu, da prehodi ne uganjujejo odtenkov. */
export const surface = {
  dark: 'var(--color-green-deep)',
  mid: 'var(--color-green-mid)',
  light: 'var(--color-cream)',
} as const;

export default function SectionBridge({
  from,
  to,
  className,
}: {
  /** CSS barva zgornje sekcije, npr. `surface.dark`. */
  from: string;
  /** CSS barva spodnje sekcije. */
  to: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      /* 80px na mobilnem, 112px na namizju. Gladkost prinaša krivulja, ne
         dolžina, zato pas ni treba, da je širok — 17 postank in oklab
         držita preliv brez stopničenja tudi na tej razdalji. */
      className={className ?? 'h-20 md:h-28'}
      style={{ backgroundImage: easedGradient(from, to) }}
    />
  );
}
