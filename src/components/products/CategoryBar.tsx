'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { crossFade, springSnap, springUI } from '@/lib/motion';
import { usePress } from '@/components/ui/Pressable';
import { cn } from '@/lib/utils';

export const VSE = 'Vse';

/**
 * Izbirnik kategorij v svojem okvirju nad seznamom izdelkov.
 *
 * Dve obliki: ločeni gumbi na računalniku, spustni seznam na telefonu.
 *
 * Prelomna točka je 1180px in ni izbrana po občutku. Izmerjeno: vrstica
 * desetih gumbov potrebuje 1084px, razpoložljiva širina pa je
 * `min(1152, okno − 64) − 24`. Iz tega sledi, da gumbi gredo v eno vrsto od
 * okna 1172px naprej. Tailwindov `xl` (1280px) je za to previsok — pri oknu
 * med 1172 in 1280 bi na računalniku po nepotrebnem dobil spustni seznam.
 * `lg` (1024px) je prenizek, tam gumbi fizično ne gredo.
 *
 * Na telefonu ena vrsta ni izvedljiva: napisi skupaj rabijo ~1080px, zaslon
 * pa ima ~360px uporabne širine. Zato tam spustni seznam — ena vrstica, vse
 * možnosti pa pokaže sistemski izbirnik.
 */
export default function CategoryBar({
  categories,
  counts,
  selected,
  onSelect,
}: {
  categories: string[];
  counts: Record<string, number>;
  selected: string;
  onSelect: (category: string) => void;
}) {
  const vse = [VSE, ...categories];

  return (
    <div className="rounded-xl border border-cream-dark bg-white p-2 min-[1180px]:px-3">
      {/* Pod 1180px: spustni seznam. */}
      <div className="min-[1180px]:hidden">
        <label htmlFor="kategorija" className="sr-only">
          Filter po kategoriji
        </label>
        <div className="relative">
          <select
            id="kategorija"
            value={selected}
            onChange={(e) => onSelect(e.target.value)}
            className="type-nav w-full appearance-none rounded-lg bg-cream py-3 pr-10 pl-3 text-green-deep"
          >
            {vse.map((category) => (
              <option key={category} value={category}>
                {category} ({counts[category]})
              </option>
            ))}
          </select>
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-ink-light"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Od 1180px naprej: ločeni gumbi, vsi v eni liniji. */}
      <div
        role="group"
        aria-label="Filter po kategoriji"
        className="hidden gap-1.5 min-[1180px]:flex min-[1180px]:flex-nowrap"
      >
        {vse.map((category) => (
          <Chip
            key={category}
            label={category}
            count={counts[category]}
            active={selected === category}
            onSelect={() => onSelect(category)}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onSelect,
}: {
  label: string;
  count: number;
  active: boolean;
  onSelect: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const { pressed, handlers } = usePress();

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      animate={reduceMotion ? { opacity: pressed ? 0.7 : 1 } : { scale: pressed ? 0.96 : 1 }}
      transition={springSnap}
      {...handlers}
      className={cn(
        /* `isolate` ni okras: brez njega gumb z `position: relative` in
           `z-index: auto` ni stacking context, pilula z `-z-10` pobegne v
           najbližji kontekst in se nariše ZA ozadjem okvirja — nevidna je. */
        'relative isolate shrink-0 touch-manipulation rounded-full px-3 py-2.5',
        'type-nav whitespace-nowrap transition-colors duration-200',
        active ? 'text-cream' : 'text-ink-mid hover:text-green-deep',
      )}
    >
      {active && (
        <motion.span
          layoutId="category-pill"
          className="absolute inset-0 -z-10 rounded-full bg-green-deep"
          transition={reduceMotion ? crossFade : springUI}
        />
      )}
      {label}
      {/* Številka je pri 11px namerno manjša od imena: pri 14px je vrstica
          presegla razpoložljivo širino, ime pa mora ostati v tipski
          lestvici. */}
      <span
        className={cn(
          'ml-1.5 text-[11px] font-bold tabular-nums',
          active ? 'text-cream/60' : 'text-ink-light',
        )}
      >
        {count}
      </span>
    </motion.button>
  );
}
