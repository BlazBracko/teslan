'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { crossFade, springUI } from '@/lib/motion';
import { heroScrim } from '@/components/ui/PageBackdrop';

interface PageHeaderProps {
  label: string;
  title: string;
  description?: string;
}

/**
 * Glava podstrani.
 *
 * Isti blok je bil trikrat prepisan (about, products, privacyPolicy),
 * vsakič z ročno preračunanimi zamiki 0,5 s / 0,1 s / 0,2 s. Enake stvari
 * naj se vedejo enako in stojijo na istem mestu (§16 familiarity).
 *
 * `pt` je večji od `pb`, ker plavajoči chrome prekriva vrh — vsebina teče
 * pod njim namesto da bi ji odvzel fiksni pas (§12).
 */
export default function PageHeader({ label, title, description }: PageHeaderProps) {
  const reduceMotion = useReducedMotion();

  const item = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: reduceMotion ? crossFade : springUI },
  };

  return (
    <header className="relative pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Enako kot hero: ozadje pride iz fiksne plasti v layoutu,
          tu je samo zaslon za kontrast kremnega besedila. */}
      <div aria-hidden className={heroScrim} />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
        className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center"
      >
        <motion.span variants={item} className="type-label text-green-bright">
          {label}
        </motion.span>

        <motion.h1 variants={item} className="type-h1 text-cream">
          {title}
        </motion.h1>

        {description && (
          <motion.p variants={item} className="type-body-lg on-material max-w-xl text-cream/85">
            {description}
          </motion.p>
        )}
      </motion.div>
    </header>
  );
}
