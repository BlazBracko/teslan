'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { springSnap } from '@/lib/motion';
import { cn } from '@/lib/utils';

const MotionLink = motion.create(Link);

/**
 * Odziv na pritisk (§1, §10).
 *
 * Odzovemo se na **pointer-down, ne na spust**. Čakanje na `click`
 * se bere kot mrtvo. Poleg tega dovolimo preklic z vlečenjem stran in
 * ponovno aktivacijo z vrnitvijo nazaj — s ~10px histereze okoli tarče.
 *
 * Zavestno ne uporabljamo `setPointerCapture`: brez nje ostane
 * domorodna semantika `click` (navigacija, tipkovnica, sredinski klik)
 * nedotaknjena, mejni dogodki pa se sprožijo tudi pri dotiku, ker
 * brskalnik ob dotiku vzpostavi implicitno zajemanje.
 */
export function usePress(hysteresis = 10) {
  const [pressed, setPressed] = useState(false);
  const holdingRef = useRef(false);

  const onPointerDown = useCallback(() => {
    holdingRef.current = true;
    setPressed(true);
  }, []);

  const release = useCallback(() => {
    holdingRef.current = false;
    setPressed(false);
  }, []);

  // Vlečenje stran prekliče pritisk; vrnitev nazaj ga obnovi.
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!holdingRef.current) return;
      const r = e.currentTarget.getBoundingClientRect();
      const inside =
        e.clientX >= r.left - hysteresis &&
        e.clientX <= r.right + hysteresis &&
        e.clientY >= r.top - hysteresis &&
        e.clientY <= r.bottom + hysteresis;
      setPressed(inside);
    },
    [hysteresis],
  );

  return {
    pressed,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: release,
      onPointerCancel: release,
      onPointerLeave: release,
      onBlur: release,
    },
  };
}

type Variant = 'primary' | 'secondary' | 'onDark' | 'ghost';

const variantClass: Record<Variant, string> = {
  primary: 'bg-green-bright text-green-deep shadow-lg shadow-green-deep/15',
  secondary: 'bg-green-deep text-cream shadow-lg shadow-green-deep/20',
  onDark: 'border-2 border-cream/50 text-cream',
  ghost: 'text-green-deep',
};

interface PressableProps {
  href?: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  onClick?: () => void;
  external?: boolean;
  ariaLabel?: string;
  type?: 'button' | 'submit';
}

/**
 * Gumb ali povezava z odzivom na pritisk.
 *
 * Animiramo samo `transform` in `opacity` — compositor-friendly
 * lastnosti (§11). Nikoli `transition-all`, ki povleče v animacijo tudi
 * barve in sence in vsak frame spravi na glavno nit.
 */
export default function Pressable({
  href,
  children,
  variant = 'primary',
  className,
  onClick,
  external,
  ariaLabel,
  type = 'button',
}: PressableProps) {
  const reduceMotion = useReducedMotion();
  const { pressed, handlers } = usePress();

  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 type-nav',
    // Odstrani ~300ms zamik dotika — čista latenca na vhodni poti (§1).
    'touch-manipulation select-none',
    variantClass[variant],
    className,
  );

  // Brez skaliranja pri reduced motion; pritisk sporočimo z opacity.
  const animate = reduceMotion
    ? { opacity: pressed ? 0.7 : 1 }
    : { scale: pressed ? 0.97 : 1, opacity: pressed ? 0.92 : 1 };

  const motionProps = {
    animate,
    transition: springSnap,
    // Hover dvig samo tam, kjer obstaja natančen kazalec.
    whileHover: reduceMotion ? undefined : { scale: 1.03 },
    ...handlers,
    className: classes,
    'aria-label': ariaLabel,
  };

  if (href && external) {
    return (
      <motion.a {...motionProps} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </motion.a>
    );
  }

  // Navadna kotva za vse, kar ni notranja pot: sidro na strani (#visit)
  // ter tel:/mailto:, ki jih mora prevzeti operacijski sistem, ne router.
  if (href && (href.startsWith('#') || /^[a-z]+:/i.test(href))) {
    return (
      <motion.a {...motionProps} href={href} onClick={onClick}>
        {children}
      </motion.a>
    );
  }

  if (href) {
    return (
      <MotionLink {...motionProps} href={href} onClick={onClick}>
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button {...motionProps} type={type} onClick={onClick}>
      {children}
    </motion.button>
  );
}
