'use client';

import { motion } from 'framer-motion';
import { contact } from '@/data/contact';

export default function PrivacyPolicyPage() {
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
            Pravni dokumenti
          </motion.span>
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl text-[#f5f0e8] mb-4"
            style={{ fontFamily: 'var(--font-display), serif' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Politika zasebnosti
          </motion.h1>
          <motion.p
            className="text-[#f5f0e8]/70 text-lg max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Kako zbiramo, uporabljamo in varujemo vaše osebne podatke
          </motion.p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <motion.div
          className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-[#e8e0d0]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="prose prose-lg max-w-none">
            <p className="text-[#4a4a42] leading-relaxed mb-8">
              Ta pravilnik o zasebnosti opisuje, kako Domačija Tešlan (v nadaljevanju: &quot;mi&quot;) zbira, uporablja in varuje vaše osebne podatke,
              ko uporabljate našo spletno stran in stopite v stik z nami.
            </p>

            <Section title="1. Upravljavec osebnih podatkov">
              <p>Upravljavec vaših osebnih podatkov je:</p>
              <div className="bg-[#f5f0e8] rounded-lg p-4 mt-3">
                <p className="font-semibold text-[#1a3a2a]">Domačija Tešlan</p>
                <p className="text-[#4a4a42]">{contact.address}</p>
                <p className="text-[#4a4a42]">
                  E-mail: <a href={`mailto:${contact.email}`} className="text-[#2d5a3f] hover:text-[#7bc47f]">{contact.email}</a>
                </p>
                <p className="text-[#4a4a42]">
                  Telefon: <a href={`tel:${contact.phone}`} className="text-[#2d5a3f] hover:text-[#7bc47f]">{contact.phoneDisplay}</a>
                </p>
              </div>
            </Section>

            <Section title="2. Katere podatke zbiramo?">
              <p>Zbiramo le osebne podatke, ki nam jih posredujete preko kontaktnega obrazca:</p>
              <ul className="list-disc list-inside space-y-1 mt-3 text-[#4a4a42]">
                <li>Ime in priimek</li>
                <li>E-poštni naslov</li>
                <li>Vsebina vašega sporočila</li>
              </ul>
            </Section>

            <Section title="3. Namen zbiranja podatkov">
              <p>Vaše podatke uporabljamo izključno za odgovor na vaše povpraševanje ali sporočilo.</p>
            </Section>

            <Section title="4. Kako dolgo hranimo vaše podatke?">
              <p>Vaše osebne podatke hranimo le toliko časa, kot je potrebno za odgovor na vaše sporočilo, nato jih izbrišemo.</p>
            </Section>

            <Section title="5. Kako varujemo vaše podatke?">
              <p>Uporabljamo ustrezne varnostne ukrepe za zaščito vaših osebnih podatkov pred nepooblaščenim dostopom, razkritjem ali izgubo.</p>
            </Section>

            <Section title="6. Pravice uporabnikov">
              <p>V skladu z GDPR imate pravico do:</p>
              <ul className="list-disc list-inside space-y-1 mt-3 text-[#4a4a42]">
                <li>dostopa do svojih podatkov,</li>
                <li>popravka napačnih podatkov,</li>
                <li>izbrisa svojih podatkov,</li>
                <li>omejitve obdelave,</li>
                <li>ugovora obdelavi.</li>
              </ul>
              <p className="mt-3">
                Če želite uveljavljati katero koli od teh pravic, nas kontaktirajte na{' '}
                <a href={`mailto:${contact.email}`} className="text-[#2d5a3f] hover:text-[#7bc47f] font-medium">{contact.email}</a>.
              </p>
            </Section>

            <Section title="7. Spremembe pravilnika">
              <p>Ta pravilnik se lahko občasno posodobi.</p>
              <p className="mt-2 text-[#7a7a70] text-sm">Zadnja posodobitev: April 2025</p>
            </Section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2
        className="text-xl md:text-2xl text-[#1a3a2a] mb-4"
        style={{ fontFamily: 'var(--font-display), serif' }}
      >
        {title}
      </h2>
      <div className="text-[#4a4a42] leading-relaxed">
        {children}
      </div>
    </div>
  );
}
