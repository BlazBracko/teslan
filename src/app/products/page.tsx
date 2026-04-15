'use client';

import { motion } from 'framer-motion';

interface Product {
  id: number;
  ime: string;
  kolicina: string;
  cena: number;
  kategorija: string;
}

const products: Product[] = [
  { id: 1, ime: "Šparglji šopek", kolicina: "0,5 kg", cena: 5.5, kategorija: "Sveža zelenjava" },
  { id: 2, ime: "Redkvica šopek", kolicina: "šopek", cena: 2.5, kategorija: "Sveža zelenjava" },
  { id: 3, ime: "Česen v prahu", kolicina: "41 ml (15 g)", cena: 5.0, kategorija: "Začimbe" },
  { id: 4, ime: "Česen v prahu", kolicina: "106 ml (40 g)", cena: 12.0, kategorija: "Začimbe" },
  { id: 5, ime: "Šparglji v prahu", kolicina: "106 ml (18 g)", cena: 5.0, kategorija: "Začimbe" },
  { id: 6, ime: "Čebula v prahu", kolicina: "106 ml (35 g)", cena: 9.0, kategorija: "Začimbe" },
  { id: 7, ime: "Paradižnik v prahu", kolicina: "20 g", cena: 6.0, kategorija: "Začimbe" },
  { id: 8, ime: "Suhi peteršilj", kolicina: "212 ml (15 g)", cena: 5.0, kategorija: "Začimbe" },
  { id: 9, ime: "Čebulni čips", kolicina: "45 g", cena: 10.0, kategorija: "Prigrizki" },
  { id: 10, ime: "Jajca kokošja", kolicina: "10 kos", cena: 3.0, kategorija: "Jajca" },
  { id: 11, ime: "Jajca prepeličja", kolicina: "18 kos", cena: 5.0, kategorija: "Jajca" },
  { id: 12, ime: "Vložena prepeličja jajca", kolicina: "370 ml", cena: 8.0, kategorija: "Jajca" },
  { id: 13, ime: "Liofilizirane jagode, breskve", kolicina: "370 ml (20 g)", cena: 8.0, kategorija: "Liofilizirano sadje" },
  { id: 14, ime: "Liofilizirane borovnice", kolicina: "370 ml (40 g)", cena: 13.0, kategorija: "Liofilizirano sadje" },
  { id: 15, ime: "Liofilizirane mix", kolicina: "370 ml (40 g)", cena: 13.0, kategorija: "Liofilizirano sadje" },
  { id: 16, ime: "Liofilizirane maline", kolicina: "370 ml (20 g)", cena: 8.0, kategorija: "Liofilizirano sadje" },
  { id: 17, ime: "Fižol liofiliziran", kolicina: "280 g", cena: 10.0, kategorija: "Liofilizirano sadje" },
  { id: 18, ime: "Marmelada borovnica", kolicina: "370 ml", cena: 8.0, kategorija: "Marmelade in vloženo" },
  { id: 19, ime: "Vloženi jurčki", kolicina: "370 ml", cena: 12.0, kategorija: "Marmelade in vloženo" },
  { id: 20, ime: "Testenine s šparglji", kolicina: "150 g", cena: 5.0, kategorija: "Testenine" },
  { id: 21, ime: "Bučno / olivno olje", kolicina: "1 L", cena: 20.0, kategorija: "Olja" },
  { id: 22, ime: "Bučno / olivno olje", kolicina: "0,5 L", cena: 12.0, kategorija: "Olja" },
  { id: 23, ime: "Aronija sok", kolicina: "1 L", cena: 10.0, kategorija: "Sokovi" },
];

// Get unique categories
const categories = [...new Set(products.map(p => p.kategorija))];

export default function ProductsPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f0e8' }}>
      {/* Header */}
      <div className="bg-[#1a3a2a] py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.span
            className="inline-block px-4 py-2 text-[#7bc47f] text-xs font-semibold tracking-[0.2em] uppercase mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Domačija Tešlan
          </motion.span>
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl text-[#f5f0e8] mb-4"
            style={{ fontFamily: 'var(--font-display), serif' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Naši izdelki
          </motion.h1>
          <motion.p
            className="text-[#f5f0e8]/70 text-lg max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Lokalno pridelani izdelki z naše kmetije v Podgori
          </motion.p>
        </div>
      </div>

      {/* Products by category */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        {categories.map((category, catIndex) => (
          <motion.section
            key={category}
            className="mb-12 md:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: catIndex * 0.1 }}
          >
            <h2
              className="text-2xl md:text-3xl text-[#1a3a2a] mb-6 pb-3 border-b-2 border-[#7bc47f]"
              style={{ fontFamily: 'var(--font-display), serif' }}
            >
              {category}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products
                .filter(p => p.kategorija === category)
                .map((product, index) => (
                  <motion.div
                    key={product.id}
                    className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-[#e8e0d0]"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-[#1a3a2a] font-semibold text-lg leading-tight pr-2">
                        {product.ime}
                      </h3>
                      <span
                        className="text-[#1a3a2a] font-bold text-xl whitespace-nowrap"
                        style={{ fontFamily: 'var(--font-display), serif' }}
                      >
                        {product.cena.toFixed(2).replace('.', ',')} €
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-3 py-1 bg-[#7bc47f]/15 text-[#2d5a3f] text-sm rounded-full">
                        {product.kolicina}
                      </span>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.section>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="bg-[#2d5a3f] py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2
            className="text-2xl md:text-3xl text-[#f5f0e8] mb-4"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            Želite naročiti?
          </h2>
          <p className="text-[#f5f0e8]/80 mb-6">
            Pokličite nas ali pa nas obiščite na kmetiji v Podgori.
          </p>
          <a
            href="tel:+38640578512"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#f5f0e8] text-[#1a3a2a] font-semibold rounded-full hover:bg-white transition-colors duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            040 578 512
          </a>
        </div>
      </div>
    </main>
  );
}
