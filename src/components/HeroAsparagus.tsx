'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import Image from 'next/image';

// Spear configuration for animation
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

// Desktop values
const spearsDesktop: SpearConfig[] = [
  { id: 'spear-1', baseX: -90,  baseY: 50,  explodeX: -400, explodeY: -150, explodeRotate: -40, scale: 0.6,  initialRotate: -25, zIndex: 1 },
  { id: 'spear-2', baseX: -40,  baseY: 5,   explodeX: -200, explodeY: -200, explodeRotate: -20, scale: 0.8,  initialRotate: -12, zIndex: 2 },
  { id: 'spear-3', baseX: 8,    baseY: -25, explodeX: 20,   explodeY: -250, explodeRotate: 5,   scale: 1.0,  initialRotate: 3,   zIndex: 3 },
  { id: 'spear-4', baseX: 50,   baseY: 10,  explodeX: 220,  explodeY: -180, explodeRotate: 25,  scale: 0.75, initialRotate: 15,  zIndex: 2 },
  { id: 'spear-5', baseX: 85,   baseY: 55,  explodeX: 420,  explodeY: -120, explodeRotate: 45,  scale: 0.55, initialRotate: 28,  zIndex: 1 },
];

// Mobile values - smaller explosion, smaller scale
const spearsMobile: SpearConfig[] = [
  { id: 'spear-1', baseX: -50,  baseY: 30,  explodeX: -120, explodeY: -80,  explodeRotate: -30, scale: 0.45, initialRotate: -20, zIndex: 1 },
  { id: 'spear-2', baseX: -25,  baseY: 5,   explodeX: -60,  explodeY: -100, explodeRotate: -15, scale: 0.55, initialRotate: -10, zIndex: 2 },
  { id: 'spear-3', baseX: 5,    baseY: -15, explodeX: 10,   explodeY: -120, explodeRotate: 5,   scale: 0.65, initialRotate: 3,   zIndex: 3 },
  { id: 'spear-4', baseX: 35,   baseY: 5,   explodeX: 70,   explodeY: -90,  explodeRotate: 18,  scale: 0.5,  initialRotate: 12,  zIndex: 2 },
  { id: 'spear-5', baseX: 55,   baseY: 35,  explodeX: 130,  explodeY: -60,  explodeRotate: 35,  scale: 0.4,  initialRotate: 22,  zIndex: 1 },
];

// Separate component for animated spear to properly use hooks
function AnimatedSpear({
  config,
  scrollYProgress
}: {
  config: SpearConfig;
  scrollYProgress: MotionValue<number>;
}) {
  // Explosion starts AFTER fade-in completes
  const spearX = useTransform(
    scrollYProgress,
    [0.1, 0.65],
    [config.baseX, config.baseX + config.explodeX]
  );
  const spearY = useTransform(
    scrollYProgress,
    [0.1, 0.65],
    [config.baseY, config.baseY + config.explodeY]
  );
  const spearRotate = useTransform(
    scrollYProgress,
    [0.1, 0.65],
    [config.initialRotate, config.initialRotate + config.explodeRotate]
  );
  const spearScale = useTransform(
    scrollYProgress,
    [0.1, 0.65],
    [config.scale, config.scale * 0.5]
  );
  // Hidden at start, fade in, stay visible, then fade out
  const spearOpacity = useTransform(
    scrollYProgress,
    [0, 0.05, 0.12, 0.6, 0.75],
    [0, 0, 1, 1, 0]
  );

  // Calculate image dimensions based on config scale
  const baseWidth = 160;
  const baseHeight = 360;

  return (
    <motion.div
      style={{
        x: spearX,
        y: spearY,
        rotate: spearRotate,
        scale: spearScale,
        opacity: spearOpacity,
        zIndex: config.zIndex,
        willChange: 'transform, opacity',
      }}
      className="absolute"
    >
      <Image
        src="/spargelj22.png"
        alt="Špargel"
        width={baseWidth}
        height={baseHeight}
        className="pointer-events-none select-none"
        style={{
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.35))',
        }}
        priority
      />
    </motion.div>
  );
}

// Separate component for scroll indicator
function ScrollIndicator({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.03, 0.12], [1, 0]);

  return (
    <motion.div
      style={{ opacity }}
      className="text-[#f5f1e8]/60 text-sm flex flex-col items-center gap-2"
    >
      <span>Pomikaj navzdol</span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

export default function HeroAsparagus() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use appropriate spear config based on screen size
  const spears = isMobile ? spearsMobile : spearsDesktop;

  // Set up scroll-linked animation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Hero text fade out
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -60]);

  return (
    <div ref={containerRef} className="relative h-[300vh]">
      {/* Sticky container that holds the animation */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#1a3a2a]">
        {/* Background dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle, #f5f1e8 1.5px, transparent 1.5px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Asparagus Spears - Behind text on mobile, around text on desktop */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center" style={{ width: '300px', height: '400px' }}>
            {spears.map((spear) => (
              <AnimatedSpear
                key={spear.id}
                config={spear}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>
        </div>

        {/* Hero Content */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 flex flex-col items-center justify-center h-screen px-4 text-center"
        >
          {/* Tag Pill */}
          <motion.div
            className="mb-6 md:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="inline-block px-5 py-2.5 border border-[#f5f1e8]/40 text-[#f5f1e8] text-xs md:text-sm font-medium tracking-widest uppercase rounded-full backdrop-blur-sm">
              Domačija Tešlan — Dolenjska
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="mb-4 md:mb-6 text-4xl md:text-5xl lg:text-7xl text-[#f5f1e8] leading-[1.1] max-w-4xl"
            style={{ fontFamily: 'var(--font-display), serif' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            Iz naše zemlje,<br />
            na vašo <span className="italic text-[#7bc47f]">mizo</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="mb-10 md:mb-14 text-base md:text-lg lg:text-xl text-[#f5f1e8]/80 max-w-xl leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            Ekološko pridelana zelenjava in sadje, neposredno z njive na vašo mizo.
          </motion.p>

          {/* Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 mb-20 md:mb-24"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
          >
            <a
              href="#visit"
              className="group px-8 py-4 bg-[#7bc47f] text-[#1a3a2a] font-semibold rounded-full hover:bg-[#8fd493] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
            >
              Pridite k nam
              <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
            </a>
            <a
              href="/products"
              className="px-8 py-4 border-2 border-[#f5f1e8]/50 text-[#f5f1e8] font-semibold rounded-full hover:bg-[#f5f1e8]/10 hover:border-[#f5f1e8] transition-all duration-300"
            >
              Naši izdelki
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-8 md:gap-16 max-w-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
          >
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-[#7bc47f] mb-1" style={{ fontFamily: 'var(--font-display), serif' }}>15+</div>
              <div className="text-xs md:text-sm text-[#f5f1e8]/70 uppercase tracking-wider">let izkušenj</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-[#7bc47f] mb-1" style={{ fontFamily: 'var(--font-display), serif' }}>100%</div>
              <div className="text-xs md:text-sm text-[#f5f1e8]/70 uppercase tracking-wider">ekološko</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-[#7bc47f] mb-1" style={{ fontFamily: 'var(--font-display), serif' }}>4km</div>
              <div className="text-xs md:text-sm text-[#f5f1e8]/70 uppercase tracking-wider">od NM</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-0 right-0 text-center z-20">
          <ScrollIndicator scrollYProgress={scrollYProgress} />
        </div>
      </div>
    </div>
  );
}
