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

const DRAWER_WIDTH = 288;

const navLinks = [
  { href: '/', label: 'Domov' },
  { href: '/products', label: 'Izdelki' },
  { href: '/about', label: 'O nas' },
];

/**
 * Navigacijska povezava z odzivom na pritisk in oznako aktivne strani.
 *
 * Wayfinding (§16): vsak zaslon mora odgovoriti na "kje sem". Prej
 * navigacija ni nikjer kazala trenutne strani.
 */
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
        className={cn(
          'touch-manipulation transition-colors duration-200',
          large ? 'text-lg font-semibold' : 'type-nav',
          active ? 'text-green-light' : 'text-green-deep hover:text-green-light',
        )}
      >
        {label}
      </Link>
      {/* Podčrtaj aktivne strani deli isti layoutId, zato med stranmi
          zdrsne namesto da bi utripnil na novem mestu (§7). */}
      {active && (
        <motion.span
          layoutId={large ? 'nav-active-mobile' : 'nav-active-desktop'}
          className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-green-light"
          transition={reduceMotion ? crossFade : springUI}
        />
      )}
    </motion.span>
  );
}

/**
 * Mobilni predal z vlečenjem za zapiranje.
 *
 * Trije principi skilla, ki jih prejšnja izvedba ni imela:
 *  - §3 prekinljivost — predal se da zagrabiti med letom in obrniti;
 *    Framerjev drag animira iz trenutne (prikazane) vrednosti, ne iz
 *    ciljne, zato ob prekinitvi ni preskoka.
 *  - §6 projekcija momenta — ob spustu ne gledamo, kje je prst, ampak
 *    kam gre; flick torej res vrže predal ven.
 *  - §9 rubber-banding — `dragElastic` proti zaprti smeri daje
 *    postopen upor namesto trdega ustavka.
 */
function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Ciljno točko izbere projekcija, ne točka spusta (§6).
      const projected = info.offset.x + project(info.velocity.x);
      if (projected > DRAWER_WIDTH / 2) onClose();
    },
    [onClose],
  );

  // Escape zapre predal — brez tega uporabnika ujamemo (§16 wayfinding).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Fokus zadržimo v predalu, dokler je odprt.
  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
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
  }, [open]);

  // Zaklep scrolla brez skoka postavitve: nadomestimo širino scrollbara.
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Modalno opravilo: zatemnitev za fokus (§12 "dim to focus"). */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={crossFade}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-green-deep/50 md:hidden"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigacija"
            /* Vstop in izstop po isti poti — noter z desne, ven na desno (§7). */
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={reduceMotion ? crossFade : springSheet}
            drag={reduceMotion ? false : 'x'}
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            /* Elastika samo v smeri zapiranja: proti levi je meja trda,
               proti desni predal sledi z upadajočim uporom. */
            dragElastic={{ left: 0, right: 0.9 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            style={{
              width: DRAWER_WIDTH,
              backgroundColor: 'var(--material-sheet)',
              backdropFilter: 'blur(var(--material-sheet-blur))',
              WebkitBackdropFilter: 'blur(var(--material-sheet-blur))',
            }}
            className="fixed top-0 right-0 bottom-0 z-50 shadow-2xl md:hidden"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-5 py-4">
                {/* Oprijemalo namigne, da se predal da povleči (§8). */}
                <div
                  aria-hidden
                  className="h-1 w-9 rounded-full bg-green-deep/25"
                  style={{ cursor: 'grab' }}
                />
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="touch-manipulation p-2 text-green-deep transition-colors duration-200 hover:text-green-light"
                  aria-label="Zapri meni"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex flex-col gap-7 px-6 py-4">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    large
                    active={pathname === link.href}
                    onNavigate={onClose}
                  />
                ))}

                <Pressable
                  href="/#visit"
                  variant="secondary"
                  onClick={onClose}
                  className="mt-2 w-full py-3"
                >
                  Obiščite nas
                </Pressable>
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Header() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [overlapping, setOverlapping] = useState(false);
  const { scrollY } = useScroll();

  // Material se odebeli šele takrat, ko vsebina res pride pod chrome
  // (§12) — ne kot dekoracija ob poljubnem pragu.
  useMotionValueEvent(scrollY, 'change', (y) => {
    setOverlapping(y > 24);
  });

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Predal zapremo ob navigaciji, tudi če jo sproži gib nazaj.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /**
   * Če se okno med odprtim predalom razširi čez `md`, predal izgine
   * (`md:hidden`), `menuOpen` pa ostane `true` — scroll bi ostal zaklenjen
   * in uporabnik ujet brez vidnega izhoda (§16: nikoli ne ujmi uporabnika).
   * Ob prehodu na namizno širino ga zato zapremo.
   */
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMenuOpen(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      <motion.header
        initial={reduceMotion ? { opacity: 0 } : { y: -64, opacity: 0 }}
        animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
        transition={reduceMotion ? crossFade : springUI}
        style={{
          backgroundColor: 'var(--material-chrome)',
          backdropFilter: `blur(var(--material-chrome-blur)) saturate(180%)`,
          WebkitBackdropFilter: `blur(var(--material-chrome-blur)) saturate(180%)`,
        }}
        className="fixed top-0 right-0 left-0 z-50"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-center justify-between py-2">
            <Link href="/" aria-label="Domačija Tešlan — domov" className="group inline-flex">
              <Image
                src="/logo.png"
                alt=""
                width={48}
                height={48}
                priority
                className="h-12 w-12 object-contain"
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
              {/* Prej je bilo `#visit`, kar na /about in /products ni
                  vodilo nikamor, ker sekcija obstaja le na domači strani. */}
              <Pressable href="/#visit" variant="secondary" className="px-5 py-1.5">
                Obiščite nas
              </Pressable>
            </nav>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="touch-manipulation p-2 text-green-deep transition-colors duration-200 hover:text-green-light md:hidden"
              aria-label={menuOpen ? 'Zapri meni' : 'Odpri meni'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Scroll edge effect namesto trde 1px črte (§12): rob se pojavi
            samo takrat, ko vsebina res teče pod plavajočim chromom. */}
        <motion.div
          aria-hidden
          animate={{ opacity: overlapping ? 1 : 0 }}
          transition={crossFade}
          className="pointer-events-none absolute top-full right-0 left-0 h-4 bg-gradient-to-b from-green-deep/10 to-transparent"
        />
      </motion.header>

      <Drawer open={menuOpen} onClose={closeMenu} />
    </>
  );
}
