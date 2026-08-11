import Reveal from '@/components/ui/Reveal';
import Pressable from '@/components/ui/Pressable';
import { contact } from '@/data/contact';
import { sectionShell } from '@/components/ui/sectionShell';

export default function CTASection() {
  return (
    <section className={`${sectionShell} bg-green-mid py-20`}>
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal className="flex flex-col items-center gap-6">
          <h2 className="type-h2 text-cream">Sveže iz kmetije, danes na vaši mizi</h2>

          <p className="type-body-lg on-material max-w-2xl text-cream/90">
            Pokličite nas ali pa kar pridite. Vedno smo veseli novih obrazov na naši kmetiji.
          </p>

          <div className="flex flex-col items-center gap-4 pt-2 sm:flex-row sm:justify-center">
            {/* Klic je primarna akcija — ne skrivamo je pod enak videz
                kot navodila za pot (§16 hierarhija). */}
            <Pressable
              href={`tel:${contact.phone.replace(/\s/g, '')}`}
              external={false}
              variant="primary"
              ariaLabel={`Pokličite ${contact.phoneDisplay}`}
            >
              {contact.phoneDisplay}
            </Pressable>

            <Pressable href={contact.mapsUrl} external variant="onDark">
              Navodila za pot <span aria-hidden>→</span>
            </Pressable>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
