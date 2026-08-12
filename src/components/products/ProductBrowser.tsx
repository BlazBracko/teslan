'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { PriceListItem } from '@/data/priceList';
import { crossFade, springUI } from '@/lib/motion';
import CategoryBar, { VSE } from './CategoryBar';
import ProductCard from './ProductCard';

/**
 * Brskanje po ceniku: vodoravna vrstica kategorij nad mrežo kartic.
 *
 * Privzeto je izbrano „Vse“. To ni le okus — pri privzeti eni kategoriji bi
 * bili ostali izdelki odsotni iz strežniško izrisanega HTML, torej tudi iz
 * tega, kar vidijo iskalniki.
 *
 * Filtriranje je na odjemalcu, zato je stran še naprej statično
 * prerenderirana in ob kliku ni čakanja na strežnik.
 */
export default function ProductBrowser({
  items,
  categories,
}: {
  items: PriceListItem[];
  categories: string[];
}) {
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<string>(VSE);

  const counts = useMemo(() => {
    const c: Record<string, number> = { [VSE]: items.length };
    categories.forEach((k) => {
      c[k] = items.filter((i) => i.category === k).length;
    });
    return c;
  }, [items, categories]);

  const visible = useMemo(
    () => (selected === VSE ? items : items.filter((i) => i.category === selected)),
    [items, selected],
  );

  return (
    <div className="flex flex-col gap-8">
      <CategoryBar
        categories={categories}
        counts={counts}
        selected={selected}
        onSelect={setSelected}
      />

      {/* Bralnik zaslona ob menjavi filtra sliši, koliko izdelkov je ostalo. */}
      <p aria-live="polite" className="sr-only">
        {selected === VSE
          ? `Prikazanih vseh ${visible.length} izdelkov.`
          : `${selected}: ${visible.length} izdelkov.`}
      </p>

      {/* Ena kartica na vrsto: kartica je vodoravna, slika levo, vsebina desno. */}
      <motion.div layout={!reduceMotion} className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((item) => (
            <motion.div
              key={item.id}
              layout={!reduceMotion}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={reduceMotion ? crossFade : springUI}
            >
              <ProductCard item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
