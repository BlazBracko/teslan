'use client';

import { motion } from 'framer-motion';
import { FaMapPin, FaPhone, FaCalendar } from 'react-icons/fa';
import { contact } from '@/data/contact';

export default function VisitSection() {
  return (
    <section id="visit" className="bg-[#f5f0e8] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Tag */}
            <div className="text-[#6b8e23] uppercase tracking-widest text-sm font-semibold">
              OBIŠČITE NAS
            </div>

            {/* Title */}
            <h2 className="text-4xl font-bold text-[#2c2c2c]" style={{ fontFamily: 'DM Serif Display, serif' }}>
              Pridite na Domačijo Tešlan
            </h2>

            {/* Description */}
            <p className="text-gray-700 leading-relaxed">
              Naša kmetija je odprta za vse, ki si želijo sveže, lokalno pridelane hrane.
              Obiščite nas in izkusite pristno dolenjsko gostoljubnost ter okus prave domače hrane.
            </p>

            {/* Info rows */}
            <div className="space-y-4 pt-4">
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <FaMapPin className="text-[#6b8e23] text-xl" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium">{contact.address}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <FaPhone className="text-[#6b8e23] text-xl" />
                </div>
                <div>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                    className="text-gray-800 font-medium hover:text-[#6b8e23] transition-colors"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <FaCalendar className="text-[#6b8e23] text-xl" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium">Po dogovoru — pokličite pred obiskom</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right column - Map */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="h-[360px] rounded-2xl overflow-hidden border border-[#e5dcc8] shadow-lg"
          >
            <iframe
              src="https://maps.google.com/maps?q=Podgora+15,+8351+Straža+pri+Novem+mestu,+Slovenia&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokacija Domačije Tešlan"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
