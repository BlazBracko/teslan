import PageHeader from '@/components/ui/PageHeader';
import PageBackdrop from '@/components/ui/PageBackdrop';
import Reveal from '@/components/ui/Reveal';
import ProductBrowser from '@/components/products/ProductBrowser';
import Pressable from '@/components/ui/Pressable';
import { contact } from '@/data/contact';
import { priceList, priceListCategories } from '@/data/priceList';
import { sectionShell, sectionStack } from '@/components/ui/sectionShell';

export const metadata = {
  title: 'Naši izdelki — Domačija Tešlan',
  description:
    'Cenik izdelkov Domačije Tešlan: šparglji, začimbe, jajca, liofilizirano sadje, marmelade, olja in sokovi.',
};

/**
 * Stran je statična, razpoložljivost sezonskih pridelkov pa je odvisna od
 * meseca. Brez tega bi se mesec zamrznil ob buildu in „na zalogi“ bi ostalo
 * napačno do naslednjega deploya. Dan je dovolj: sezone se merijo v mesecih.
 */
export const revalidate = 86400;

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
        {/* Vodoravna vrstica kategorij nad mrežo kartic. Prej je bilo tu
            devet sekcij druga pod drugo in ves cenik naenkrat. */}
        <ProductBrowser
          items={priceList}
          categories={priceListCategories}
          /* Mesec določi strežnik, da ga komponente ne berejo same — glej
             opombo o `revalidate` zgoraj. */
          month={new Date().getMonth() + 1}
        />
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
