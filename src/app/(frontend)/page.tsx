import Hero from '@/components/Hero';
import PageBackdrop from '@/components/ui/PageBackdrop';
import ValuesSection from '@/components/ValuesSection';
import PhotoFeature from '@/components/PhotoFeature';
import OfferingSection from '@/components/OfferingSection';
import VisitSection from '@/components/VisitSection';
import CTASection from '@/components/CTASection';
import { sectionStack } from '@/components/ui/sectionShell';
import { naloziKatalog } from '@/katalog/podatki';
import { najnizjaNarocljivaCena } from '@/katalog/razpolozljivost';
import { oznakaSezone, trenutniMesec } from '@/katalog/sezona';

/** Ponudba in sezone so iz CMS (gl. `app/(frontend)/products/page.tsx`). */
export const dynamic = 'force-dynamic';

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
export default async function HomePage() {
  const katalog = await naloziKatalog();
  const mesec = trenutniMesec();

  // Besedila in sezone so iz CMS — en vir resnice, da se opis pridelka ne
  // razhaja med to sekcijo in ostalo stranjo. Če lastnik izdelek skrije ali
  // izbriše, sekcija pač ostane brez sezone in opisa.
  const izdelek = (slug: string) => katalog.izdelki.find((i) => i.slug === slug);
  const sparglji = izdelek('sparglji');
  const jagode = izdelek('jagode');

  const skupine = katalog.skupine.map((skupina) => {
    const cene = katalog.izdelki
      .filter((i) => skupina.kategorije.includes(i.kategorija.id))
      .map((i) => najnizjaNarocljivaCena(i, mesec))
      .filter((c): c is number => c !== null);
    return { ...skupina, odCenti: cene.length > 0 ? Math.min(...cene) : null };
  });

  return (
    <>
      <PageBackdrop src="/strawberryFields.jpg" />
      <Hero />

      <div className={sectionStack}>
        <ValuesSection />

        <PhotoFeature
          side="left"
          label="Sezona špargljev"
          title={sparglji?.sezona ? oznakaSezone(sparglji.sezona) : 'Šparglji'}
          description={sparglji?.kratekOpis ?? ''}
          src="/slika1.jpeg"
          alt="Šparglji z Domačije Tešlan na žaru, v ozadju vas Podgora"
          cta={{ href: '/products', label: 'Poglej cenik' }}
        />

        <PhotoFeature
          side="right"
          label="Sezona jagod"
          title={jagode?.sezona ? oznakaSezone(jagode.sezona) : 'Jagode'}
          description={jagode?.kratekOpis ?? ''}
          src="/jagodeFB.jpg"
          alt="Jagode na rastlini na njivi Domačije Tešlan"
          /* Zrele rdeče jagode so v spodnji tretjini kadra, ne na sredini. */
          objectPosition="50% 72%"
          cta={{ href: '/products', label: 'Poglej cenik' }}
        />

        <OfferingSection groups={skupine} productCount={katalog.izdelki.length} />
        <VisitSection />
        <CTASection />
      </div>
    </>
  );
}
