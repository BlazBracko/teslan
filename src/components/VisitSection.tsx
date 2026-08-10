import { FaMapPin, FaPhone, FaCalendar } from 'react-icons/fa';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { contact } from '@/data/contact';

/**
 * Kontrolo postavimo blizu tega, na kar vpliva (§16 grouping & mapping):
 * naslov stoji ob karti, telefon je klikljiv tam, kjer je zapisan.
 */
const rows = [
  {
    icon: FaMapPin,
    label: 'Naslov',
    content: <span className="text-ink">{contact.address}</span>,
  },
  {
    icon: FaPhone,
    label: 'Telefon',
    content: (
      <a
        href={`tel:${contact.phone.replace(/\s/g, '')}`}
        className="touch-manipulation text-ink transition-colors duration-200 hover:text-green-light"
      >
        {contact.phone}
      </a>
    ),
  },
  {
    icon: FaCalendar,
    label: 'Odprtost',
    content: <span className="text-ink">Po dogovoru — pokličite pred obiskom</span>,
  },
];

export default function VisitSection() {
  return (
    <section id="visit" className="scroll-mt-24 bg-cream py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
          <Reveal direction="left" className="flex flex-col gap-6">
            <SectionHeading
              align="start"
              label="Obiščite nas"
              title="Pridite na Domačijo Tešlan"
              description="Naša kmetija je odprta za vse, ki si želijo sveže, lokalno pridelane hrane. Obiščite nas in izkusite pristno dolenjsko gostoljubnost ter okus prave domače hrane."
            />

            <dl className="flex flex-col gap-4 pt-2">
              {rows.map(({ icon: Icon, label, content }) => (
                <div key={label} className="flex items-start gap-4">
                  <Icon aria-hidden className="mt-1 shrink-0 text-xl text-green-light" />
                  <div>
                    <dt className="type-label text-ink-light">{label}</dt>
                    <dd className="type-body font-medium">{content}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal
            direction="right"
            className="h-90 overflow-hidden rounded-2xl border border-cream-dark shadow-lg"
          >
            <iframe
              src="https://maps.google.com/maps?q=Podgora+15,+8351+Straža+pri+Novem+mestu,+Slovenia&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokacija Domačije Tešlan na zemljevidu"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
