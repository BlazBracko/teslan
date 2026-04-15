'use client';

import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import { products } from '@/data/products';

export default function ProductsSection() {
  return (
    <section className="py-20 px-10" style={{ backgroundColor: '#1a3a2a' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{
                color: '#6fb583',
                letterSpacing: '2.5px'
              }}
            >
              NAŠA PONUDBA
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl mb-3"
            style={{
              fontFamily: 'DM Serif Display, serif',
              color: '#f5f0e8'
            }}
          >
            Sezonski pridelki
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base max-w-2xl mx-auto"
            style={{ color: 'rgba(245, 240, 232, 0.7)' }}
          >
            Pridelujemo tisto, kar zemlja naravno ponudi v vsakem letnem času.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
