import SectionHeading from '@/components/ui/SectionHeading';
import Reveal, { RevealGroup, RevealItem } from '@/components/ui/Reveal';
import Pressable from '@/components/ui/Pressable';
import { priceListSummary, priceListTotal } from '@/data/priceList';
import { products } from '@/data/products';
import { cn } from '@/lib/utils';

const formatPrice = (price: number) => price.toFixed(2).replace('.', ',');

/**
 * Pregled ponudbe po kategorijah.
 *
 * Nadomešča prejšnje Sezonske pridelke. Tam so bili šparglji in jagode
 * ponovljeni takoj pod svojima fotografskima sekcijama, kar ni povedalo
 * nič novega.
 *
 * Domača stran prej nikjer ni povedala, kako široka je ponudba —
 * obiskovalec je videl šparglje in jagode in sklepal, da je to vse. To je
 * bila največja vrzel; tu jo zapolnimo.
 *
 * Vsa števila in cenovni razponi so izpeljani iz `data/priceList.ts`. Če
 * se cenik spremeni, se ta sekcija popravi sama.
 *
 * Velikost ploščice sledi številu izdelkov: prve tri kategorije dobijo
 * širše mesto. To ni okras, ampak podatek — večja kategorija je večja.
 */
export default function OfferingSection() {
  const [velike, majhne] = [priceListSummary.slice(0, 3), priceListSummary.slice(3)];

  return (
    <section className="bg-green-deep px-6 py-24 md:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          onDark
          label="Naša ponudba"
          title="Več kot le sveža zelenjava"
          description="Poleg sezonskih pridelkov z njive pri nas najdete začimbe, jajca, liofilizirano sadje, marmelade, olja, testenine in sokove."
          className="mx-auto mb-4"
        />

        <Reveal className="mb-12 text-center" delay={0.15}>
          <p className="type-label text-green-bright">
            {priceListTotal} izdelkov v {priceListSummary.length} kategorijah
          </p>
        </Reveal>

        <RevealGroup className="grid grid-cols-2 gap-4 md:grid-cols-12" stagger={0.05}>
          {velike.map((kategorija) => (
            <RevealItem
              key={kategorija.name}
              as="article"
              className="col-span-2 rounded-2xl border border-cream/12 bg-cream/[0.06] p-6 md:col-span-4"
            >
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="type-h3 text-cream">{kategorija.name}</h3>
                <span className="type-stat text-green-bright" style={{ fontSize: '1.75rem' }}>
                  {kategorija.count}
                </span>
              </div>
              <p className="type-small text-cream/60">
                {formatPrice(kategorija.minPrice)} — {formatPrice(kategorija.maxPrice)} €
              </p>
            </RevealItem>
          ))}

          {majhne.map((kategorija) => (
            <RevealItem
              key={kategorija.name}
              as="article"
              className={cn(
                'col-span-1 rounded-xl border border-cream/10 bg-cream/[0.04] p-4',
                'md:col-span-2',
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="type-small font-semibold text-cream">{kategorija.name}</h3>
                <span className="type-small font-bold text-green-bright">{kategorija.count}</span>
              </div>
              <p className="type-label mt-2 text-cream/45">
                {kategorija.minPrice === kategorija.maxPrice
                  ? `${formatPrice(kategorija.minPrice)} €`
                  : `${formatPrice(kategorija.minPrice)}—${formatPrice(kategorija.maxPrice)} €`}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>

        {/**
         * Sezonsko sveže z njive.
         *
         * Cenik ima samo „Česen v prahu" — svežega česna in krompirja na
         * njem ni. Brez tega pasu bi po zamenjavi sekcije izginila s strani,
         * čeprav ju `meta description` izrecno obljublja. Podatki so iz
         * `data/products.ts`.
         */}
        <div className="mt-14 border-t border-cream/10 pt-10">
          <Reveal>
            <h3 className="type-label mb-5 text-center text-cream/50">Sezonsko sveže z njive</h3>
          </Reveal>
          <RevealGroup className="flex flex-wrap justify-center gap-3" stagger={0.04}>
            {products.map((product) => (
              <RevealItem
                key={product.id}
                className="rounded-full border border-cream/12 bg-cream/[0.05] px-5 py-2.5"
              >
                <span className="type-small font-semibold text-cream">{product.name}</span>
                <span className="type-small ml-2 text-cream/50">{product.season}</span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <Reveal className="mt-12 flex justify-center">
          <Pressable href="/products" variant="primary">
            Poglej cel cenik
            <span aria-hidden>→</span>
          </Pressable>
        </Reveal>
      </div>
    </section>
  );
}
