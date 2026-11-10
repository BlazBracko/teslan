'use client';

import { MotionConfig, m, type Variants } from 'framer-motion';
import { revealUp, springUI } from '@/lib/motion';

type Direction = 'up' | 'left' | 'right' | 'scale' | 'fade';

const offsets: Record<Direction, Record<string, number>> = {
  up: { y: 24 },
  left: { x: -32 },
  right: { x: 32 },
  scale: { scale: 0.96 },
  fade: {},
};

const varianteRazkritja = (direction: Direction, delay = 0): Variants => ({
  hidden: { opacity: 0, ...offsets[direction] },
  visible: { opacity: 1, x: 0, y: 0, scale: 1, transition: { ...springUI, delay } },
});

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
 * Pri zmanjšanem gibanju `MotionConfig reducedMotion="user"` premike
 * preskoči, preliv prosojnosti pa ostane: odziv ostane, vestibularnega
 * dražljaja ni. Variante so na strežniku in odjemalcu enake (prej jih je
 * izbiral `useReducedMotion` med renderjem, kar je pri uporabnikih z
 * zmanjšanim gibanjem povzročilo neujemanje hidracije).
 */
export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className,
  as = 'div',
  amount = 0.25,
}: RevealProps) {
  const Component = m[as];
  return (
    <MotionConfig reducedMotion="user">
      <Component
        className={className}
        variants={varianteRazkritja(direction, delay)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount }}
      >
        {children}
      </Component>
    </MotionConfig>
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
  const Component = m[as];

  return (
    <MotionConfig reducedMotion="user">
      <Component
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger } } }}
      >
        {children}
      </Component>
    </MotionConfig>
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
  const Component = m[as];
  return (
    <Component className={className} variants={varianteRazkritja(direction)}>
      {children}
    </Component>
  );
}

export { revealUp };
