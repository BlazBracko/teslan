import Hero from '@/components/Hero';
import ValuesSection from '@/components/ValuesSection';
import PhotoFeature from '@/components/PhotoFeature';
import OfferingSection from '@/components/OfferingSection';
import VisitSection from '@/components/VisitSection';
import CTASection from '@/components/CTASection';
import SectionBridge, { surface } from '@/components/ui/SectionBridge';
import { getProduct } from '@/data/products';

/**
 * Menjava svetle in temne podlage je namerna, vsaka meja pa dobi mehak
 * prehod. Prej so bile te meje trde in prav to je bila pritožba.
 *
 *   Hero          temno      cel zaslon, centrirano
 *     ↓ mehak prehod
 *   Vrednote      svetlo     nesimetrična mreža, naslov levo
 *   Šparglji      svetlo     razpolovljeno, fotografija LEVO
 *   Jagode        svetlo     razpolovljeno, fotografija DESNO (zrcalno)
 *     ↓ TRD rob (namerno)
 *   Ponudba       temno      kategorije, velikost sledi številu
 *     ↓ TRD rob (namerno)
 *   Obiščite nas  svetlo     razpolovljeno, zemljevid desno
 *     ↓ mehak prehod
 *   CTA           srednje    centrirano
 *
 * Tri zaporedne svetle sekcije prehodov med sabo ne rabijo — tvorijo en
 * svetel blok, ne tri ločene menjave.
 *
 * Prehod od CTA do footerja je tu, ker footer živi v `layout.tsx` in ga
 * stran ne more oviti.
 */
export default function HomePage() {
  // Besedila in sezone so iz `data/products.ts` — en vir resnice, da se
  // opis pridelka ne razhaja med to sekcijo in ostalo stranjo.
  const sparglji = getProduct('sparglji');
  const jagode = getProduct('jagode');

  return (
    <>
      <Hero />
      <SectionBridge from={surface.dark} to={surface.light} />

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

      {/* Ponudba je namerno brez prehoda na obeh straneh: trd rob jo
          odreže od svetlega bloka nad in pod njo, zato sekcija izstopi
          kot samostojen blok. Vsi ostali prehodi ostajajo mehki. */}
      <OfferingSection />

      <VisitSection />
      <SectionBridge from={surface.light} to={surface.mid} />

      <CTASection />
      <SectionBridge from={surface.mid} to={surface.dark} />
    </>
  );
}
