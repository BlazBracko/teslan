import ProductCard from './ProductCard';
import SectionHeading from '@/components/ui/SectionHeading';
import { RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { products } from '@/data/products';

export default function ProductsSection() {
  return (
    <section className="bg-green-deep px-6 py-20 md:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          onDark
          label="Naša ponudba"
          title="Sezonski pridelki"
          description="Pridelujemo tisto, kar zemlja naravno ponudi v vsakem letnem času."
          className="mx-auto mb-12"
        />

        <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {products.map((product) => (
            <RevealItem key={product.id}>
              <ProductCard product={product} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
