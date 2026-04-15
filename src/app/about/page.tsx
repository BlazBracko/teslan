'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

export default function AboutPage() {
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
            Naša zgodba
          </motion.span>
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl text-[#f5f0e8] mb-4"
            style={{ fontFamily: 'var(--font-display), serif' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            O nas
          </motion.h1>
          <motion.p
            className="text-[#f5f0e8]/70 text-lg max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Spoznajte Domačijo Tešlan in našo strast do ekološkega kmetovanja
          </motion.p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* Intro section */}
        <motion.section
          className="mb-16 md:mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2
                className="text-3xl md:text-4xl text-[#1a3a2a] mb-6"
                style={{ fontFamily: 'var(--font-display), serif' }}
              >
                Domačija Tešlan
              </h2>
              <p className="text-[#4a4a42] leading-relaxed mb-4">
                Kmetija Tešlan se nahaja na čudovitem območju Dolenjske, v vasi Podgora pri Novem mestu.
                Že več kot 15 let se ukvarjamo z ekološkim kmetovanjem in pridelavo kakovostne hrane.
              </p>
              <p className="text-[#4a4a42] leading-relaxed mb-4">
                Naša kmetija ponuja širok spekter lokalno pridelanih proizvodov — od svežih špargljev
                in zelenjave do liofiliziranega sadja, domačih testenin in naravnih začimb.
              </p>
              <p className="text-[#4a4a42] leading-relaxed">
                Vse izdelke prodajamo neposredno strankam, brez posrednikov. Tako zagotavljamo
                svežino in kakovost, vi pa točno veste, od kod prihaja vaša hrana.
              </p>
            </div>
            <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/home2.jpg"
                alt="Domačija Tešlan"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </motion.section>

        {/* Values section */}
        <motion.section
          className="mb-16 md:mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="text-3xl md:text-4xl text-[#1a3a2a] mb-8 text-center"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            Naše vrednote
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Ekološko',
                description: 'Pridelujemo brez uporabe pesticidov in umetnih gnojil. Skrbimo za zdravo zemljo in zdravo hrano.',
                icon: '🌱',
              },
              {
                title: 'Lokalno',
                description: 'Vse pridelamo na naši kmetiji v Podgori. Kratka pot od njive do vaše mize.',
                icon: '📍',
              },
              {
                title: 'Trajnostno',
                description: 'Spoštujemo naravo in uporabljamo trajnostne metode pridelave. Za boljši jutri.',
                icon: '♻️',
              },
            ].map((value, index) => (
              <motion.div
                key={value.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-[#e8e0d0] text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3
                  className="text-xl text-[#1a3a2a] mb-3"
                  style={{ fontFamily: 'var(--font-display), serif' }}
                >
                  {value.title}
                </h3>
                <p className="text-[#4a4a42] text-sm leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Mission section */}
        <motion.section
          className="mb-16 md:mb-24 bg-[#1a3a2a] rounded-2xl p-8 md:p-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="text-2xl md:text-3xl text-[#f5f0e8] mb-6"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            Naša misija
          </h2>
          <p className="text-[#f5f0e8]/90 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
            &ldquo;Podpirati trajnostno kmetijstvo in ohranjanje okolja, ob tem pa nuditi
            kakovostno hrano in prijazno izkušnjo za vse, ki nas obiščejo.&rdquo;
          </p>
        </motion.section>

        {/* Contact section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="text-3xl md:text-4xl text-[#1a3a2a] mb-8 text-center"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            Kontakt
          </h2>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e8e0d0]">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-[#7bc47f]/20 rounded-full flex items-center justify-center mb-4">
                  <FaMapMarkerAlt className="text-[#2d5a3f] text-xl" />
                </div>
                <h3 className="text-[#1a3a2a] font-semibold mb-2">Naslov</h3>
                <p className="text-[#4a4a42] text-sm">
                  Podgora 15<br />
                  8351 Straža pri Novem mestu
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-[#7bc47f]/20 rounded-full flex items-center justify-center mb-4">
                  <FaPhone className="text-[#2d5a3f] text-xl" />
                </div>
                <h3 className="text-[#1a3a2a] font-semibold mb-2">Telefon</h3>
                <a href="tel:+38640578512" className="text-[#2d5a3f] hover:text-[#7bc47f] transition-colors">
                  040 578 512
                </a>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-[#7bc47f]/20 rounded-full flex items-center justify-center mb-4">
                  <FaEnvelope className="text-[#2d5a3f] text-xl" />
                </div>
                <h3 className="text-[#1a3a2a] font-semibold mb-2">Email</h3>
                <a href="mailto:sandi.dercar@gmail.com" className="text-[#2d5a3f] hover:text-[#7bc47f] transition-colors text-sm">
                  sandi.dercar@gmail.com
                </a>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* CTA */}
      <div className="bg-[#2d5a3f] py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2
            className="text-2xl md:text-3xl text-[#f5f0e8] mb-4"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            Pridite nas obiskat
          </h2>
          <p className="text-[#f5f0e8]/80 mb-6">
            Vedno smo veseli novih obrazov na naši kmetiji.
          </p>
          <a
            href="https://www.google.com/maps/place/Podgora+15,+8351+Straža"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#f5f0e8] text-[#1a3a2a] font-semibold rounded-full hover:bg-white transition-colors duration-300"
          >
            <FaMapMarkerAlt />
            Navodila za pot
          </a>
        </div>
      </div>
    </main>
  );
}
