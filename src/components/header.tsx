'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type PanInfo,
} from 'framer-motion';
import { HiMenu, HiX } from 'react-icons/hi';
import { crossFade, project, springSheet, springSnap, springUI } from '@/lib/motion';
import Pressable, { usePress } from '@/components/ui/Pressable';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Domov' },
  { href: '/products', label: 'Izdelki' },
  { href: '/about', label: 'O nas' },
];

/** Pot navzgor, po kateri otok zloži nazaj v pilulo. */
const COLLAPSE_THRESHOLD = 56;

function NavLink({
  href,
  label,
  active,
  onNavigate,
  large,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
  large?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const { pressed, handlers } = usePress();

  const barva = active ? 'text-green-bright' : 'text-cream/85 hover:text-cream';

  /* Podčrtaj mora objemati besedilo, ne vrstice — zato je v notranjem
     `relative` ovoju in ne v tistem, ki se razteza čez širino. */
  const podcrtaj = active && (
    <motion.span
      layoutId={large ? 'nav-active-mobile' : 'nav-active-desktop'}
      className="absolute -bottom-1.5 right-0 left-0 h-0.5 rounded-full bg-green-bright"
      transition={reduceMotion ? crossFade : springUI}
    />
  );

  /**
   * V razširjenem otoku je tarča cela vrstica, ne le besedilo.
   *
   * Prej je bil ovoj `inline-flex` in `<Link>` je objemal samo besedilo, zato
   * je bilo treba zadeti natanko črke. Zdaj povezava zapolni vrstico in ima
   * navpični rob, kar da tarčo nad Applovim minimumom 44px (§10).
   *
   * Odziv na pritisk je podlaga cele vrstice, ne skaliranje besedila —
   * podlaga pove, da je tarča vrstica.
   */
  if (large) {
    return (
      <motion.div
        animate={{ backgroundColor: pressed ? 'rgba(245,240,232,0.08)' : 'rgba(245,240,232,0)' }}
        transition={springSnap}
        className="-mx-3 rounded-2xl"
      >
        <Link
          href={href}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex min-h-11 touch-manipulation items-center px-3 py-2.5',
            'text-lg font-semibold transition-colors duration-200',
            barva,
          )}
          {...handlers}
        >
          <span className="relative inline-flex">
            {label}
            {podcrtaj}
          </span>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.span
      className="relative inline-flex"
      animate={reduceMotion ? { opacity: pressed ? 0.6 : 1 } : { scale: pressed ? 0.96 : 1 }}
      transition={springSnap}
      {...handlers}
    >
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={cn('type-nav touch-manipulation transition-colors duration-200', barva)}
      >
        {label}
      </Link>
      {podcrtaj}
    </motion.span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const { scrollY } = useScroll();

  const islandRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useMotionValueEvent(scrollY, 'change', (y) => {
    setCondensed(y > 24);
  });

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Če se okno razširi čez `md`, se otok vrne v namizno obliko — odprt
  // mobilni panel bi tam ostal viseti in držal scroll zaklenjen.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMenuOpen(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  // Fokus ostane v razširjenem otoku, dokler je odprt.
  useEffect(() => {
    if (!menuOpen) return;
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !islandRef.current) return;
      const focusable = islandRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [menuOpen]);

  /**
   * Otok se je razširil navzdol, zato se zloži navzgor — vstop in izstop
   * po isti poti (§7). Cilj izbere projekcija hitrosti, ne točka spusta
   * (§6): flick navzgor ga zloži tudi sredi poti.
   */
  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const projected = info.offset.y + project(info.velocity.y);
    if (projected < -COLLAPSE_THRESHOLD) setMenuOpen(false);
  }, []);

  const panelItem = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0, transition: springUI },
  };

  return (
    <>
      {/* Modalno opravilo na mobilnem: zatemnitev za fokus (§12). */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={crossFade}
            onClick={closeMenu}
            className="fixed inset-0 z-40 bg-green-deep/50 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Ovoj ne prestreza klikov, da ostane stran okoli otoka klikljiva. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 md:px-6 md:pt-4">
        <motion.div
          ref={islandRef}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -24 }}
          animate={
            reduceMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  y: 0,
                  // Otok se ob scrollu skrči. Enakomeren `scale` je
                  // compositor-friendly in ne popači besedila, drugače kot
                  // animiranje širine ali korekcija merila pri `layout` (§11).
                  scale: condensed && !menuOpen ? 0.965 : 1,
                }
          }
          transition={reduceMotion ? crossFade : springUI}
          drag={reduceMotion || !menuOpen ? false : 'y'}
          dragDirectionLock
          dragConstraints={{ top: 0, bottom: 0 }}
          /* Elastika samo navzgor: proti spodaj je meja trda, navzgor
             otok sledi z upadajočim uporom (§9 rubber-banding). */
          dragElastic={{ top: 0.9, bottom: 0 }}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{
            transformOrigin: 'top center',
            borderRadius: 'var(--island-radius)',
            backgroundColor: 'var(--material-island)',
            backdropFilter: 'blur(var(--material-island-blur)) saturate(180%)',
            WebkitBackdropFilter: 'blur(var(--material-island-blur)) saturate(180%)',
            border: '1px solid var(--material-island-edge)',
            boxShadow: 'var(--material-island-shadow)',
            willChange: 'transform',
          }}
          className="pointer-events-auto w-full max-w-6xl overflow-hidden"
        >
          {/* Vrstica, ki je vidna vedno. */}
          <div className="flex items-center justify-between gap-4 px-4 py-2.5 md:px-6">
            <Link href="/" aria-label="Domačija Tešlan — domov" className="inline-flex shrink-0">
              <Image
                src="/logo.png"
                alt=""
                width={44}
                height={44}
                priority
                className="h-11 w-11 object-contain"
              />
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  active={pathname === link.href}
                />
              ))}
              <Pressable href="/#visit" variant="primary" className="px-5 py-1.5">
                Obiščite nas
              </Pressable>
            </nav>

            <button
              ref={menuOpen ? closeButtonRef : undefined}
              onClick={() => setMenuOpen((v) => !v)}
              className="touch-manipulation p-2 text-cream transition-colors duration-200 hover:text-green-bright md:hidden"
              aria-label={menuOpen ? 'Zapri meni' : 'Odpri meni'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
            </button>
          </div>

          {/**
           * Razširitev otoka.
           *
           * Višino animira panel sam (`height: 0 -> auto`), otok pa mu z
           * `overflow-hidden` sledi. Namenoma ne uporabljam `layout`:
           * ta bi višino animiral s korekcijo merila, kar med prehodom
           * popači besedilo v vrstici nad panelom.
           */}
          <AnimatePresence initial={false}>
            {menuOpen && (
              <motion.div
                key="panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={reduceMotion ? crossFade : springSheet}
                className="md:hidden"
              >
                <motion.nav
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
                  }}
                  /* Reža je manjša kot prej: navpični rob vrstic zdaj sam
                     ustvari ločnico, ob gap-6 pa bi bile vrstice predaleč. */
                  className="flex flex-col gap-1 px-6 pt-2 pb-6"
                  aria-label="Navigacija"
                >
                  {navLinks.map((link) => (
                    <motion.div key={link.href} variants={panelItem}>
                      <NavLink
                        href={link.href}
                        label={link.label}
                        large
                        active={pathname === link.href}
                        onNavigate={closeMenu}
                      />
                    </motion.div>
                  ))}

                  <motion.div variants={panelItem}>
                    <Pressable
                      href="/#visit"
                      variant="primary"
                      onClick={closeMenu}
                      className="w-full py-3"
                    >
                      Obiščite nas
                    </Pressable>
                  </motion.div>

                  {/* Oprijemalo namigne, da se otok da zložiti navzgor (§8). */}
                  {!reduceMotion && (
                    <motion.div variants={panelItem} className="flex justify-center pt-1">
                      <div aria-hidden className="h-1 w-9 rounded-full bg-cream/25" />
                    </motion.div>
                  )}
                </motion.nav>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
