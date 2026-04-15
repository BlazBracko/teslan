'use client';

import { motion } from 'framer-motion';
import { contact } from '@/data/contact';

export default function CTASection() {
  return (
    <section className="bg-[#2d5a3f] py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Title */}
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#f5f0e8]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            Sveže iz kmetije, danes na vaši mizi
          </h2>

          {/* Subtitle */}
          <p className="text-[#f5f0e8] text-lg max-w-2xl mx-auto">
            Pokličite nas ali pa kar pridite. Vedno smo veseli novih obrazov na naši kmetiji.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            {/* Primary CTA - Phone */}
            <motion.a
              href={`tel:${contact.phone.replace(/\s/g, '')}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-[#f5f0e8] text-[#1a3a2a] font-semibold rounded-full hover:bg-[#e5dcc8] transition-all shadow-lg"
            >
              {contact.phoneDisplay}
            </motion.a>

            {/* Secondary CTA - Directions */}
            <motion.a
              href={contact.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-[#f5f0e8] text-[#f5f0e8] font-semibold rounded-full hover:bg-[#f5f0e8] hover:text-[#2d5a3f] transition-all"
            >
              Navodila za pot →
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
