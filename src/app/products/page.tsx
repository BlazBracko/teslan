import PageHeader from '@/components/ui/PageHeader';
import PageBackdrop from '@/components/ui/PageBackdrop';
import Reveal, { RevealGroup, RevealItem } from '@/components/ui/Reveal';
import Pressable from '@/components/ui/Pressable';
import { contact } from '@/data/contact';
import { priceList, priceListCategories } from '@/data/priceList';
import { sectionShell, sectionStack } from '@/components/ui/sectionShell';

export const metadata = {
  title: 'Naši izdelki — Domačija Tešlan',
  description:
    'Cenik izdelkov Domačije Tešlan: šparglji, začimbe, jajca, liofilizirano sadje, marmelade, olja in sokovi.',
};

const formatPrice = (price: number) => `${price.toFixed(2).replace('.', ',')} €`;

export default function ProductsPage() {
  return (
    <>
      <PageBackdrop src="/asparagusField.jpeg" />
      <PageHeader
        label="Domačija Tešlan"
        title="Naši izdelki"
        description="Lokalno pridelani izdelki z naše kmetije v Podgori"
      />

      <div className={sectionStack}>
      <section className={`${sectionShell} bg-cream px-4 py-16 md:py-20`}>
      <div className="mx-auto max-w-6xl">
        {priceListCategories.map((category) => (
          <section key={category} className="mb-12 md:mb-16">
            <Reveal>
              <h2 className="type-h2 mb-6 border-b-2 border-green-bright pb-3">{category}</h2>
            </Reveal>

            <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" stagger={0.04}>
              {priceList
                .filter((item) => item.category === category)
                .map((item) => (
                  <RevealItem
                    key={item.id}
                    as="article"
                    className="rounded-xl border border-cream-dark bg-white p-5"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="type-body font-semibold text-green-deep">{item.name}</h3>
                      {/* Cena je display font — v tej velikosti rabi tesnejši tracking (§15). */}
                      <span className="type-h3 whitespace-nowrap">{formatPrice(item.price)}</span>
                    </div>
                    <span className="type-small inline-block rounded-full bg-green-bright/15 px-3 py-1 text-green-mid">
                      {item.amount}
                    </span>
                  </RevealItem>
                ))}
            </RevealGroup>
          </section>
        ))}
      </div>

      </section>

      <section className={`${sectionShell} bg-green-mid py-12 md:py-16`}>
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Reveal className="flex flex-col items-center gap-4">
            <h2 className="type-h2 text-cream">Želite naročiti?</h2>
            <p className="type-body on-material text-cream/85">
              Pokličite nas ali pa nas obiščite na kmetiji v Podgori.
            </p>
            <Pressable
              href={`tel:${contact.phone.replace(/\s/g, '')}`}
              variant="primary"
              className="mt-2"
              ariaLabel={`Pokličite ${contact.phoneDisplay}`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              {contact.phoneDisplay}
            </Pressable>
          </Reveal>
        </div>
      </section>
      </div>
    </>
  );
}
