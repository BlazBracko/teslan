'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import Image from 'next/image';
import Pressable from '@/components/ui/Pressable';
import { springUI } from '@/lib/motion';

interface SpearConfig {
  id: string;
  baseX: number;
  baseY: number;
  explodeX: number;
  explodeY: number;
  explodeRotate: number;
  scale: number;
  initialRotate: number;
  zIndex: number;
}

const spearsDesktop: SpearConfig[] = [
  { id: 'spear-1', baseX: -90, baseY: 50,  explodeX: -400, explodeY: -150, explodeRotate: -40, scale: 0.6,  initialRotate: -25, zIndex: 1 },
  { id: 'spear-2', baseX: -40, baseY: 5,   explodeX: -200, explodeY: -200, explodeRotate: -20, scale: 0.8,  initialRotate: -12, zIndex: 2 },
  { id: 'spear-3', baseX: 8,   baseY: -25, explodeX: 20,   explodeY: -250, explodeRotate: 5,   scale: 1.0,  initialRotate: 3,   zIndex: 3 },
  { id: 'spear-4', baseX: 50,  baseY: 10,  explodeX: 220,  explodeY: -180, explodeRotate: 25,  scale: 0.75, initialRotate: 15,  zIndex: 2 },
  { id: 'spear-5', baseX: 85,  baseY: 55,  explodeX: 420,  explodeY: -120, explodeRotate: 45,  scale: 0.55, initialRotate: 28,  zIndex: 1 },
];

const spearsMobile: SpearConfig[] = [
  { id: 'spear-1', baseX: -50, baseY: 30,  explodeX: -120, explodeY: -80,  explodeRotate: -30, scale: 0.45, initialRotate: -20, zIndex: 1 },
  { id: 'spear-2', baseX: -25, baseY: 5,   explodeX: -60,  explodeY: -100, explodeRotate: -15, scale: 0.55, initialRotate: -10, zIndex: 2 },
  { id: 'spear-3', baseX: 5,   baseY: -15, explodeX: 10,   explodeY: -120, explodeRotate: 5,   scale: 0.65, initialRotate: 3,   zIndex: 3 },
  { id: 'spear-4', baseX: 35,  baseY: 5,   explodeX: 70,   explodeY: -90,  explodeRotate: 18,  scale: 0.5,  initialRotate: 12,  zIndex: 2 },
  { id: 'spear-5', baseX: 55,  baseY: 35,  explodeX: 130,  explodeY: -60,  explodeRotate: 35,  scale: 0.4,  initialRotate: 22,  zIndex: 1 },
];

const SPEAR_WIDTH = 160;
const SPEAR_HEIGHT = 360;

/**
 * Slika špargljev.
 *
 * Tailwind preflight postavi `img { height: auto }`, kar ob eksplicitnem
 * `width` atributu sproži opozorilo Next.js o pokvarjenem razmerju.
 * Obe dimenziji zato pripnemo — velikost tako ali tako vodimo prek
 * `transform: scale`, ki je compositor-friendly (§11).
 */
function SpearImage() {
  return (
    <Image
      src="/spargelj22.png"
      alt=""
      width={SPEAR_WIDTH}
      height={SPEAR_HEIGHT}
      priority
      className="pointer-events-none select-none"
      style={{
        width: `${SPEAR_WIDTH}px`,
        height: `${SPEAR_HEIGHT}px`,
        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.35))',
      }}
    />
  );
}

/** Scroll-vezan špargelj: 1:1 sledenje scrollu, brez springa (§2). */
function AnimatedSpear({
  config,
  scrollYProgress,
}: {
  config: SpearConfig;
  scrollYProgress: MotionValue<number>;
}) {
  const range: [number, number] = [0.1, 0.65];

  const x = useTransform(scrollYProgress, range, [config.baseX, config.baseX + config.explodeX]);
  const y = useTransform(scrollYProgress, range, [config.baseY, config.baseY + config.explodeY]);
  const rotate = useTransform(scrollYProgress, range, [
    config.initialRotate,
    config.initialRotate + config.explodeRotate,
  ]);
  const scale = useTransform(scrollYProgress, range, [config.scale, config.scale * 0.5]);
  // Velik premikajoč objekt naj med potovanjem postane prosojen (§14).
  const opacity = useTransform(scrollYProgress, [0, 0.05, 0.12, 0.6, 0.75], [0, 0, 1, 1, 0]);

  return (
    <motion.div
      style={{ x, y, rotate, scale, opacity, zIndex: config.zIndex, willChange: 'transform, opacity' }}
      className="absolute"
    >
      <SpearImage />
    </motion.div>
  );
}

/** Mirujoč špargelj za reduced motion — kompozicija ostane, gibanja ni. */
function StaticSpear({ config }: { config: SpearConfig }) {
  return (
    <div
      style={{
        transform: `translate(${config.baseX}px, ${config.baseY}px) rotate(${config.initialRotate}deg) scale(${config.scale})`,
        zIndex: config.zIndex,
      }}
      className="absolute"
    >
      <SpearImage />
    </div>
  );
}

function ScrollIndicator({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.03, 0.12], [1, 0]);

  return (
    <motion.div style={{ opacity }} className="flex flex-col items-center gap-2 text-cream/60">
      <span className="type-small">Pomikaj navzdol</span>
      {/* 1,5 s cikel ≈ 0,67 Hz — nad mejo, pred katero skill svari (§14). */}
      <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

const stats = [
  { value: '15+', label: 'let izkušenj' },
  { value: '100%', label: 'ekološko' },
  { value: '4km', label: 'od NM' },
];

function HeroContent({ reduceMotion }: { reduceMotion: boolean }) {
  // Vstopna koreografija: kratek stagger, spring brez prekoračitve.
  const item = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: springUI },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
      className="relative z-10 flex h-screen flex-col items-center justify-center px-4 text-center"
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

      <motion.p variants={item} className="type-body-lg mb-10 max-w-xl text-cream/80 md:mb-14">
        Ekološko pridelana zelenjava in sadje, neposredno z njive na vašo mizo.
      </motion.p>

      <motion.div variants={item} className="mb-20 flex flex-col gap-4 sm:flex-row md:mb-24">
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
  );
}

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

export default function HeroAsparagus() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  // matchMedia namesto poslušanja vsakega piksla resize — enak rezultat,
  // brez dogodka na vsak premik roba okna.
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    setIsMobile(query.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const spears = isMobile ? spearsMobile : spearsDesktop;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -60]);

  /**
   * Reduced motion (§14): 300vh scroll-vezana eksplozija je ravno tisto
   * gibanje čez cel viewport, pred katerim skill svari. Zložimo jo v en
   * mirujoč zaslon — kompozicija in sporočilo ostaneta enaka.
   */
  if (reduceMotion) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-green-deep">
        <DotPattern />
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center" style={{ width: 300, height: 400 }}>
            {spears.map((spear) => (
              <StaticSpear key={spear.id} config={spear} />
            ))}
          </div>
        </div>
        <HeroContent reduceMotion />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-green-deep">
        <DotPattern />

        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center" style={{ width: 300, height: 400 }}>
            {spears.map((spear) => (
              <AnimatedSpear key={spear.id} config={spear} scrollYProgress={scrollYProgress} />
            ))}
          </div>
        </div>

        <motion.div style={{ opacity: heroOpacity, y: heroY }}>
          <HeroContent reduceMotion={false} />
        </motion.div>

        <div className="absolute bottom-8 right-0 left-0 z-20 text-center">
          <ScrollIndicator scrollYProgress={scrollYProgress} />
        </div>
      </div>
    </div>
  );
}
