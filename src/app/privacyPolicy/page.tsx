import PageHeader from '@/components/ui/PageHeader';
import Reveal from '@/components/ui/Reveal';
import { contact } from '@/data/contact';
import { sectionShell, sectionStack } from '@/components/ui/sectionShell';

export const metadata = {
  title: 'Politika zasebnosti — Domačija Tešlan',
  description: 'Kako Domačija Tešlan zbira, uporablja in varuje vaše osebne podatke.',
};

const inlineLink =
  'touch-manipulation font-medium text-green-mid transition-colors duration-200 hover:text-green-light';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="type-h3 mb-4">{title}</h2>
      <div className="type-body flex flex-col gap-3 text-ink-mid">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader
        label="Pravni dokumenti"
        title="Politika zasebnosti"
        description="Kako zbiramo, uporabljamo in varujemo vaše osebne podatke"
      />

      <div className={sectionStack}>
      <section className={`${sectionShell} bg-cream px-4 py-16 md:py-20`}>
      <div className="mx-auto max-w-4xl">
        <Reveal className="rounded-2xl border border-cream-dark bg-white p-8 md:p-12">
          <p className="type-body mb-8 text-ink-mid">
            Ta pravilnik o zasebnosti opisuje, kako Domačija Tešlan (v nadaljevanju: &quot;mi&quot;)
            zbira, uporablja in varuje vaše osebne podatke, ko uporabljate našo spletno stran in
            stopite v stik z nami.
          </p>

          <Section title="1. Upravljavec osebnih podatkov">
            <p>Upravljavec vaših osebnih podatkov je:</p>
            <address className="not-italic rounded-lg bg-cream p-4">
              <p className="type-body font-semibold text-green-deep">Domačija Tešlan</p>
              <p>{contact.address}</p>
              <p>
                E-pošta:{' '}
                <a href={`mailto:${contact.email}`} className={inlineLink}>
                  {contact.email}
                </a>
              </p>
              <p>
                Telefon:{' '}
                {/* Prej je bil tu `tel:` s presledki iz zapisa številke. */}
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className={inlineLink}>
                  {contact.phoneDisplay}
                </a>
              </p>
            </address>
          </Section>

          <Section title="2. Katere podatke zbiramo?">
            <p>Zbiramo le osebne podatke, ki nam jih posredujete preko kontaktnega obrazca:</p>
            <ul className="list-inside list-disc">
              <li>Ime in priimek</li>
              <li>E-poštni naslov</li>
              <li>Vsebina vašega sporočila</li>
            </ul>
          </Section>

          <Section title="3. Namen zbiranja podatkov">
            <p>Vaše podatke uporabljamo izključno za odgovor na vaše povpraševanje ali sporočilo.</p>
          </Section>

          <Section title="4. Kako dolgo hranimo vaše podatke?">
            <p>
              Vaše osebne podatke hranimo le toliko časa, kot je potrebno za odgovor na vaše
              sporočilo, nato jih izbrišemo.
            </p>
          </Section>

          <Section title="5. Kako varujemo vaše podatke?">
            <p>
              Uporabljamo ustrezne varnostne ukrepe za zaščito vaših osebnih podatkov pred
              nepooblaščenim dostopom, razkritjem ali izgubo.
            </p>
          </Section>

          <Section title="6. Pravice uporabnikov">
            <p>V skladu z GDPR imate pravico do:</p>
            <ul className="list-inside list-disc">
              <li>dostopa do svojih podatkov,</li>
              <li>popravka napačnih podatkov,</li>
              <li>izbrisa svojih podatkov,</li>
              <li>omejitve obdelave,</li>
              <li>ugovora obdelavi.</li>
            </ul>
            <p>
              Če želite uveljavljati katero koli od teh pravic, nas kontaktirajte na{' '}
              <a href={`mailto:${contact.email}`} className={inlineLink}>
                {contact.email}
              </a>
              .
            </p>
          </Section>

          <Section title="7. Spremembe pravilnika">
            <p>Ta pravilnik se lahko občasno posodobi.</p>
            <p className="type-small text-ink-light">Zadnja posodobitev: April 2025</p>
          </Section>
        </Reveal>
      </div>
      </section>
      </div>
    </>
  );
}
