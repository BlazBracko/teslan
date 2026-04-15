'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { Product } from '@/data/products';

interface ProductCardProps {
  product: Product;
}

const statusConfig = {
  available: {
    label: 'Na voljo',
    color: '#6fb583'
  },
  soon: {
    label: 'Kmalu',
    color: '#a67c52'
  },
  autumn: {
    label: 'Jesen',
    color: 'rgba(245, 240, 232, 0.7)'
  }
};

export default function ProductCard({ product }: ProductCardProps) {
  const status = statusConfig[product.status];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden border"
      style={{
        backgroundColor: 'rgba(245, 240, 232, 0.06)',
        borderColor: 'rgba(245, 240, 232, 0.08)',
        borderWidth: '1px'
      }}
    >
      <motion.div
        className="relative overflow-hidden"
        style={{ height: '180px' }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-900 to-green-700" />
        )}
        <div
          className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium z-20"
          style={{
            backgroundColor: status.color,
            color: product.status === 'autumn' ? '#1a3a2a' : '#ffffff'
          }}
        >
          {product.statusLabel}
        </div>
      </motion.div>

      <div className="p-6">
        <h3
          className="text-2xl mb-2"
          style={{
            fontFamily: 'DM Serif Display, serif',
            color: '#f5f0e8'
          }}
        >
          {product.name}
        </h3>
        <p className="text-xs mb-4" style={{ color: 'rgba(245, 240, 232, 0.5)' }}>
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'rgba(245, 240, 232, 0.6)' }}>
            {product.season}
          </span>
          <a
            href="/products"
            className="text-xs px-4 py-1.5 rounded-full border transition-colors hover:bg-white/5"
            style={{
              color: '#f5f0e8',
              borderColor: 'rgba(245, 240, 232, 0.2)'
            }}
          >
            Več →
          </a>
        </div>
      </div>
    </motion.div>
  );
}
