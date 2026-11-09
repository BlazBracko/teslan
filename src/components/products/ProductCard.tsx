'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import type { SlikaPogled } from '@/katalog/podatki';
import { formatirajCeno } from '@/lib/denar';
import { springUI } from '@/lib/motion';
import { usePress } from '@/components/ui/Pressable';
import StockTag, { type Stock } from './StockTag';

/**
 * Ena vrstica cenika: izdelek v eni velikosti. Podatki in razpoložljivost so
 * iz CMS, izračunani na strežniku (`app/(frontend)/products/page.tsx`).
 * Prehodno do K5, ki stran zgradi na novo.
 */
export interface VrsticaCenika {
  id: string;
  name: string;
  /** Pakiranje oz. velikost. */
  amount: string;
  /** Cena v centih; `null` pri izdelkih, ki niso naročljivi. */
  price: number | null;
  category: string;
  description?: string | null;
  image?: SlikaPogled | null;
  stock: Stock;
}

/**
 * Mirna nadomestna ploskev, kadar izdelek še ni dobil slike.
 *
 * Namenoma tiha: 17 glasnih nadomestkov bi izgledalo pokvarjeno. Tako vrsta
 * ostane enotna in dodajanje pravih fotografij stran samo izboljša.
 */
function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-light/12 to-green-bright/8 p-3">
      <span className="type-label text-center leading-tight text-green-light/50">{label}</span>
    </div>
  );
}

/**
 * Vodoravna kartica: slika levo, vsebina desno, ena kartica na vrsto.
 *
 * `min-h` je nujen — brez njega bi se pri kratkem opisu stolpec s sliko
 * sesedel, ker višino vrstice določa vsebina.
 */
export default function ProductCard({ item }: { item: VrsticaCenika }) {
  const { stock } = item;
  const reduceMotion = useReducedMotion();
  const { pressed, handlers } = usePress();

  return (
    <motion.article
      {...handlers}
      animate={reduceMotion ? { opacity: pressed ? 0.92 : 1 } : { scale: pressed ? 0.995 : 1 }}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={springUI}
      className="flex min-h-36 touch-manipulation overflow-hidden rounded-2xl border border-cream-dark bg-white sm:min-h-44"
    >
      <div className="relative w-32 shrink-0 self-stretch sm:w-44 md:w-52">
        {item.image ? (
          <Image
            src={item.image.url}
            alt={item.image.alt}
            fill
            sizes="(max-width: 640px) 128px, (max-width: 768px) 176px, 208px"
            className="object-cover"
            style={
              item.image.zarisce
                ? { objectPosition: `${item.image.zarisce.x}% ${item.image.zarisce.y}%` }
                : undefined
            }
          />
        ) : (
          <ImagePlaceholder label={item.category} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:gap-3 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="type-body font-semibold text-green-deep">{item.name}</h3>
          {/* Cena je display font — v tej velikosti rabi tesnejši tracking (§15). */}
          {item.price !== null && (
            <span className="type-h3 whitespace-nowrap">{formatirajCeno(item.price)}</span>
          )}
        </div>

        {item.description && <p className="type-small text-ink-mid">{item.description}</p>}

        <div className="mt-auto flex flex-wrap items-center gap-2">
          <span className="type-small rounded-full bg-cream px-3 py-1 text-ink-mid">
            {item.amount}
          </span>
          <StockTag stock={stock} />
        </div>
      </div>
    </motion.article>
  );
}
