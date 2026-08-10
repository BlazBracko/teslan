'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/data/products';
import { springUI } from '@/lib/motion';
import { usePress } from '@/components/ui/Pressable';
import { cn } from '@/lib/utils';

/**
 * Barve značk pridejo iz palete, ne iz priložnostnih hexov.
 * Prej so bile tu tri barve (#6fb583, #a67c52), ki v paleti ne obstajajo.
 */
const statusStyle: Record<Product['status'], string> = {
  available: 'bg-green-bright text-green-deep',
  soon: 'bg-brown-light text-green-deep',
  autumn: 'bg-brown text-cream',
};

export default function ProductCard({ product }: { product: Product }) {
  const reduceMotion = useReducedMotion();
  const { pressed, handlers } = usePress();

  return (
    <motion.article
      {...handlers}
      animate={
        reduceMotion
          ? { opacity: pressed ? 0.85 : 1 }
          : { scale: pressed ? 0.985 : 1 }
      }
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={springUI}
      className="touch-manipulation overflow-hidden rounded-2xl border border-cream/10 bg-cream/[0.06]"
    >
      <div className="relative h-45 overflow-hidden">
        {/* Sence je nad zaposleno vsebino treba več kot nad ravno podlago (§12). */}
        <div aria-hidden className="absolute inset-0 z-10 bg-gradient-to-t from-green-deep/60 to-transparent" />
        {product.image ? (
          <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-green-deep to-green-mid" />
        )}
        <span
          className={cn('type-label absolute top-3 left-3 z-20 rounded-full px-3 py-1', statusStyle[product.status])}
        >
          {product.statusLabel}
        </span>
      </div>

      <div className="p-6">
        <h3 className="type-h3 mb-2 text-cream">{product.name}</h3>
        <p className="type-small mb-4 text-cream/65">{product.description}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="type-small on-material text-cream/70">{product.season}</span>
          <Link
            href="/products"
            className="type-nav touch-manipulation rounded-full border border-cream/25 px-4 py-1.5 text-cream transition-colors duration-200 hover:bg-cream/10"
          >
            Več <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
