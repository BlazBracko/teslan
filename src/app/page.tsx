import Hero from '@/components/Hero';
import ValuesSection from '@/components/ValuesSection';
import PhotoFeature from '@/components/PhotoFeature';
import OfferingSection from '@/components/OfferingSection';
import VisitSection from '@/components/VisitSection';
import CTASection from '@/components/CTASection';
import { sectionStack } from '@/components/ui/sectionShell';
import { getProduct } from '@/data/products';

/**
 * Sekcije so vstavljeni zaobljeni bloki, ki plavajo na temni podlagi
 * (`body` je green-deep). Med njimi je reža, skozi katero se vidi podlaga.
 *
 * S tem prehodov med sekcijami ni več treba obravnavati — ni jih, ker ni
 * robov. Prej so bili tu gradientni pasovi, ki so meje zabrisali; zdaj mej
 * ni. Isti jezik kot plavajoči otok navigacije, samo v večjem merilu.
 *
 *   Hero          cel zaslon, temno, brez okvirja
 *   ─ reža ─
 *   Vrednote      svetel blok, nesimetrična mreža
 *   Šparglji      svetel blok, fotografija LEVO
 *   Jagode        svetel blok, fotografija DESNO (zrcalno)
 *   Ponudba       temen blok, kategorije
 *   Obiščite nas  svetel blok, zemljevid desno
 *   CTA           temen blok, centrirano
 *   ─ reža ─
 *   Footer        cel zaslon, temno (v layout.tsx)
 *
 * Hero in footer sta namerno brez okvirja: cel zaslon na vrhu in zaključek
 * na dnu držita stran, da ne izgleda kot kup lebdečih kartic.
 */
export default function HomePage() {
  // Besedila in sezone so iz `data/products.ts` — en vir resnice, da se
  // opis pridelka ne razhaja med to sekcijo in ostalo stranjo.
  const sparglji = getProduct('sparglji');
  const jagode = getProduct('jagode');

  return (
    <>
      <Hero />

      <div className={sectionStack}>
        <ValuesSection />

        <PhotoFeature
          side="left"
          label="Sezona špargljev"
          title={sparglji.season}
          description={sparglji.description}
          src="/slika1.jpeg"
          alt="Šparglji z Domačije Tešlan na žaru, v ozadju vas Podgora"
          cta={{ href: '/products', label: 'Poglej cenik' }}
        />

        <PhotoFeature
          side="right"
          label="Sezona jagod"
          title={jagode.season}
          description={jagode.description}
          src="/jagodeFB.jpg"
          alt="Jagode na rastlini na njivi Domačije Tešlan"
          /* Zrele rdeče jagode so v spodnji tretjini kadra, ne na sredini. */
          objectPosition="50% 72%"
          cta={{ href: '/products', label: 'Poglej cenik' }}
        />

        <OfferingSection />
        <VisitSection />
        <CTASection />
      </div>
    </>
  );
}
