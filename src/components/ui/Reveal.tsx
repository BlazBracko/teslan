'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { crossFade, revealUp, springUI } from '@/lib/motion';

type Direction = 'up' | 'left' | 'right' | 'scale' | 'fade';

const offsets: Record<Direction, Record<string, number>> = {
  up: { y: 24 },
  left: { x: -32 },
  right: { x: 32 },
  scale: { scale: 0.96 },
  fade: {},
};

interface RevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  /** Element ovoja — privzeto div, za semantiko lahko section/article. */
  as?: 'div' | 'section' | 'article' | 'li' | 'h2' | 'p' | 'span';
  amount?: number;
}

/**
 * Razkrivanje ob scrollu z enotnim springom in vgrajenim
 * spoštovanjem `prefers-reduced-motion` (§14).
 *
 * Pri reduced motion pade na navzkrižni preliv brez premika: odziv
 * ostane, vestibularnega dražljaja ni. Prej je bilo to razsuto po
 * komponentah kot fiksni `duration`/`easeOut` tween in nikjer ni
 * upoštevalo uporabnikove nastavitve.
 */
export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className,
  as = 'div',
  amount = 0.25,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as];

  const variants: Variants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { ...crossFade, delay } },
      }
    : {
        hidden: { opacity: 0, ...offsets[direction] },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          transition: { ...springUI, delay },
        },
      };

  return (
    <Component
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
    >
      {children}
    </Component>
  );
}

/**
 * Stagger vsebnik: otroci naj bodo <RevealItem>. Uporabno za mreže,
 * kjer je delay na vsakem elementu ročno preračunan iz indeksa.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.06,
  as = 'div',
  amount = 0.2,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  as?: 'div' | 'section' | 'ul';
  amount?: number;
}) {
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </Component>
  );
}

export function RevealItem({
  children,
  className,
  direction = 'up',
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
  as?: 'div' | 'li' | 'article';
}) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as];

  const variants: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: crossFade } }
    : {
        hidden: { opacity: 0, ...offsets[direction] },
        visible: { opacity: 1, x: 0, y: 0, scale: 1, transition: springUI },
      };

  return (
    <Component className={className} variants={variants}>
      {children}
    </Component>
  );
}

export { revealUp };
