import Image from 'next/image';
import PageBackdrop from '@/components/ui/PageBackdrop';
import { FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import PageHeader from '@/components/ui/PageHeader';
import Reveal, { RevealGroup, RevealItem } from '@/components/ui/Reveal';
import Pressable from '@/components/ui/Pressable';
import { contact } from '@/data/contact';
import { sectionShell, sectionStack } from '@/components/ui/sectionShell';

export const metadata = {
  title: 'O nas — Domačija Tešlan',
  description:
    'Domačija Tešlan v Podgori pri Novem mestu se že več kot 15 let ukvarja z ekološkim kmetovanjem.',
};

const values = [
  {
    title: 'Ekološko',
    description:
      'Pridelujemo brez uporabe pesticidov in umetnih gnojil. Skrbimo za zdravo zemljo in zdravo hrano.',
    icon: '🌱',
  },
  {
    title: 'Lokalno',
    description: 'Vse pridelamo na naši kmetiji v Podgori. Kratka pot od njive do vaše mize.',
    icon: '📍',
  },
  {
    title: 'Trajnostno',
    description:
      'Spoštujemo naravo in uporabljamo trajnostne metode pridelave. Za boljši jutri.',
    icon: '♻️',
  },
];

const contactRows = [
  {
    icon: FaMapMarkerAlt,
    label: 'Naslov',
    content: (
      <>
        Podgora 15
        <br />
        8351 Straža pri Novem mestu
      </>
    ),
  },
  {
    icon: FaPhone,
    label: 'Telefon',
    content: (
      <a
        href={`tel:${contact.phone.replace(/\s/g, '')}`}
        className="touch-manipulation text-green-mid transition-colors duration-200 hover:text-green-light"
      >
        {contact.phoneDisplay}
      </a>
    ),
  },
  {
    icon: FaEnvelope,
    label: 'E-pošta',
    content: (
      <a
        href={`mailto:${contact.email}`}
        className="touch-manipulation break-all text-green-mid transition-colors duration-200 hover:text-green-light"
      >
        {contact.email}
      </a>
    ),
  },
];

export default function AboutPage() {
  return (
    <>
      <PageBackdrop src="/strawberryFields.jpg" />
      <PageHeader
        label="Naša zgodba"
        title="O nas"
        description="Spoznajte Domačijo Tešlan in našo strast do ekološkega kmetovanja"
      />

      <div className={sectionStack}>
      <section className={`${sectionShell} bg-cream px-4 py-16 md:py-20`}>
      <div className="mx-auto max-w-5xl">
        <section className="mb-16 md:mb-24">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <Reveal direction="left" className="flex flex-col gap-4">
              <h2 className="type-h2 mb-2">Domačija Tešlan</h2>
              <p className="type-body text-ink-mid">
                Kmetija Tešlan se nahaja na čudovitem območju Dolenjske, v vasi Podgora pri Novem
                mestu. Že več kot 15 let se ukvarjamo z ekološkim kmetovanjem in pridelavo
                kakovostne hrane.
              </p>
              <p className="type-body text-ink-mid">
                Naša kmetija ponuja širok spekter lokalno pridelanih proizvodov — od svežih
                špargljev in zelenjave do liofiliziranega sadja, domačih testenin in naravnih
                začimb.
              </p>
              <p className="type-body text-ink-mid">
                Vse izdelke prodajamo neposredno strankam, brez posrednikov. Tako zagotavljamo
                svežino in kakovost, vi pa točno veste, od kod prihaja vaša hrana.
              </p>
            </Reveal>

            <Reveal
              direction="right"
              className="relative h-75 overflow-hidden rounded-2xl shadow-lg md:h-100"
            >
              <Image
                src="/sandi.jpg"
                alt={`${contact.name} za stojnico Domačije Tešlan s svežo zelenjavo in šparglji`}
                fill
                className="object-cover"
                /* Izvirnik je portretni (1536×2048), okvir pa ležeč. Obraz je
                   na ~27 % višine, prt z logotipom pa zavzema spodnjih ~45 %;
                   privzeti sredinski obrez bi obraz odrezal. */
                style={{ objectPosition: '50% 32%' }}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </Reveal>
          </div>
        </section>

        <section className="mb-16 md:mb-24">
          <Reveal>
            <h2 className="type-h2 mb-8 text-center">Naše vrednote</h2>
          </Reveal>

          <RevealGroup className="grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <RevealItem
                key={value.title}
                as="article"
                className="rounded-xl border border-cream-dark bg-white p-6 text-center"
              >
                <div aria-hidden className="mb-4 text-4xl">
                  {value.icon}
                </div>
                <h3 className="type-h3 mb-3">{value.title}</h3>
                <p className="type-small text-ink-mid">{value.description}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        <Reveal
          as="section"
          className="mb-16 rounded-2xl bg-green-deep p-8 text-center md:mb-24 md:p-12"
        >
          <h2 className="type-h2 mb-6 text-cream">Naša misija</h2>
          <blockquote className="type-body-lg on-material mx-auto max-w-3xl text-cream/90">
            &ldquo;Podpirati trajnostno kmetijstvo in ohranjanje okolja, ob tem pa nuditi
            kakovostno hrano in prijazno izkušnjo za vse, ki nas obiščejo.&rdquo;
          </blockquote>
        </Reveal>

        <section>
          <Reveal>
            <h2 className="type-h2 mb-8 text-center">Kontakt</h2>
          </Reveal>

          <Reveal className="rounded-2xl border border-cream-dark bg-white p-8">
            <dl className="grid gap-6 text-center md:grid-cols-3">
              {contactRows.map(({ icon: Icon, label, content }) => (
                <div key={label} className="flex flex-col items-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-bright/20">
                    <Icon aria-hidden className="text-xl text-green-mid" />
                  </div>
                  <dt className="type-label mb-2 text-ink-light">{label}</dt>
                  <dd className="type-small text-ink-mid">{content}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>
      </div>

      </section>

      <section className={`${sectionShell} bg-green-mid py-12 md:py-16`}>
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Reveal className="flex flex-col items-center gap-4">
            <h2 className="type-h2 text-cream">Pridite nas obiskat</h2>
            <p className="type-body on-material text-cream/85">
              Vedno smo veseli novih obrazov na naši kmetiji.
            </p>
            <Pressable href={contact.directionsUrl} external variant="primary" className="mt-2">
              <FaMapMarkerAlt aria-hidden />
              Navodila za pot
            </Pressable>
          </Reveal>
        </div>
      </section>
      </div>
    </>
  );
}
