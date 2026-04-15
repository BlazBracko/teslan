'use client';

import { motion } from 'framer-motion';

const values = [
  {
    id: 'local',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M7 8h10M7 12h10M7 16h10M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Lokalno pridelano',
    description: 'Vsak pridelek raste na naši zemlji v Podgori. Brez posrednikov, neposredno z njive k vam.'
  },
  {
    id: 'fresh',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Vedno sveže',
    description: 'Pobrano zjutraj, pri vas popoldne. Naši izdelki ne potujejo po skladiščih in trgovinah.'
  },
  {
    id: 'sustainable',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Trajnostno',
    description: 'Skrbimo za okolje z ekološkimi metodami pridelave in minimalno uporabo embalaže.'
  }
];

export default function ValuesSection() {
  return (
    <section className="py-20 px-10" style={{ backgroundColor: '#f5f0e8' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((value, index) => (
            <motion.div
              key={value.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="rounded-2xl p-7 border"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#e8e0d0',
                borderWidth: '1px',
                borderTopWidth: '3px',
                borderTopColor: '#4a8c5e'
              }}
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center mb-5"
                style={{
                  backgroundColor: 'rgba(74, 140, 94, 0.1)',
                  color: '#4a8c5e'
                }}
              >
                {value.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#1a3a2a' }}>
                {value.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(26, 58, 42, 0.7)' }}>
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
