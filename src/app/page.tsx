import Hero from '@/components/Hero';
import ValuesSection from '@/components/ValuesSection';
import PhotoFeature from '@/components/PhotoFeature';
import ProductsSection from '@/components/ProductsSection';
import VisitSection from '@/components/VisitSection';
import CTASection from '@/components/CTASection';
import SectionBridge, { surface } from '@/components/ui/SectionBridge';

/**
 * Menjava svetle in temne podlage je namerna, vsaka meja pa dobi mehak
 * prehod. Prej so bile te meje trde in prav to je bila pritožba.
 *
 *   Hero          temno      cel zaslon, centrirano
 *   Vrednote      svetlo     nesimetrična mreža, naslov levo
 *   Šparglji      svetlo     razpolovljeno, fotografija LEVO
 *   Jagode        svetlo     razpolovljeno, fotografija DESNO (zrcalno)
 *   Izdelki       temno      centriran naslov nad mrežo
 *   Obiščite nas  svetlo     razpolovljeno, zemljevid desno
 *   CTA           srednje    centrirano
 *
 * Štiri zaporedne sekcije so svetle, zato med njimi prehodov ni — tvorijo
 * en svetel blok in ne štiri ločene menjave.
 *
 * Prehod od CTA do footerja je tu, ker footer živi v `layout.tsx` in ga
 * stran ne more oviti.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <SectionBridge from={surface.dark} to={surface.light} />

      <ValuesSection />

      {/* Besedili in sezoni sta iz `data/products.ts`. */}
      <PhotoFeature
        side="left"
        label="Sezona špargljev"
        title="April — Junij"
        description="Sveži zeleni šparglji, ročno pobrani vsako jutro. Nežen okus, popolni za na žar ali v solato."
        src="/slika1.jpeg"
        alt="Šparglji z Domačije Tešlan na žaru, v ozadju vas Podgora"
        cta={{ href: '/products', label: 'Poglej cenik' }}
      />

      <PhotoFeature
        side="right"
        label="Sezona jagod"
        title="Maj — Julij"
        description="Sladke, sočne jagode pridelane brez pesticidov. Popolne za sveže uživanje ali predelavo."
        src="/jagodeFB.jpg"
        alt="Jagode na rastlini na njivi Domačije Tešlan"
        /* Zrele rdeče jagode so v spodnji tretjini kadra, ne na sredini. */
        objectPosition="50% 72%"
        cta={{ href: '/products', label: 'Poglej cenik' }}
      />

      <SectionBridge from={surface.light} to={surface.dark} />

      <ProductsSection />
      <SectionBridge from={surface.dark} to={surface.light} />

      <VisitSection />
      <SectionBridge from={surface.light} to={surface.mid} />

      <CTASection />
      <SectionBridge from={surface.mid} to={surface.dark} />
    </>
  );
}
