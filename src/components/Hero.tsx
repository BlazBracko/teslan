'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Pressable from '@/components/ui/Pressable';
import { crossFade, springUI } from '@/lib/motion';

const stats = [
  { value: '15+', label: 'let izkušenj' },
  { value: '100%', label: 'ekološko' },
  { value: '4km', label: 'od NM' },
];

function DotPattern() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage: 'radial-gradient(circle, var(--color-cream) 1.5px, transparent 1.5px)',
        backgroundSize: '32px 32px',
      }}
    />
  );
}

export default function Hero() {
  const reduceMotion = useReducedMotion();

  // Vstopna koreografija: kratek stagger, spring brez prekoračitve.
  const item = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: reduceMotion ? crossFade : springUI },
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-green-deep">
      <DotPattern />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
        }}
        className="relative z-10 flex flex-col items-center px-4 py-28 text-center md:py-32"
      >
        <motion.div variants={item} className="mb-6 md:mb-8">
          <span className="type-label inline-block rounded-full border border-cream/40 px-5 py-2.5 text-cream">
            Domačija Tešlan — Dolenjska
          </span>
        </motion.div>

        <motion.h1 variants={item} className="type-display mb-4 max-w-4xl text-cream md:mb-6">
          Iz naše zemlje,
          <br />
          na vašo <span className="text-green-bright italic">mizo</span>
        </motion.h1>

        <motion.p variants={item} className="type-body-lg mb-10 max-w-xl text-cream/80 md:mb-12">
          Ekološko pridelana zelenjava in sadje, neposredno z njive na vašo mizo.
        </motion.p>

        <motion.div variants={item} className="mb-14 flex flex-col gap-4 sm:flex-row md:mb-16">
          <Pressable href="/#visit" variant="primary">
            Pridite k nam
            <span aria-hidden>→</span>
          </Pressable>
          <Pressable href="/products" variant="onDark">
            Naši izdelki
          </Pressable>
        </motion.div>

        <motion.div variants={item} className="grid max-w-2xl grid-cols-3 gap-8 md:gap-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="type-stat mb-1 text-green-bright">{stat.value}</div>
              <div className="type-label text-cream/70">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
