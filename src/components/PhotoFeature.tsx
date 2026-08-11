import Image from 'next/image';
import Reveal from '@/components/ui/Reveal';
import Pressable from '@/components/ui/Pressable';
import { cn } from '@/lib/utils';
import { sectionShell } from '@/components/ui/sectionShell';

interface PhotoFeatureProps {
  label: string;
  title: string;
  description: string;
  src: string;
  alt: string;
  /**
   * Na kateri strani stoji fotografija na namizju. Dve zaporedni taki
   * sekciji morata biti zrcalni, sicer se bereta kot ena ponovljena.
   * Na mobilnem se vedno zloži v stolpec s sliko na vrhu.
   */
  side?: 'left' | 'right';
  /**
   * `object-position` za obrez. Fotografije s kmetije so portretne in
   * subjekt na njih ni v sredini kadra, zato privzeti center obreže mimo.
   */
  objectPosition?: string;
  cta?: { href: string; label: string };
}

/**
 * Fotografija ob besedilu.
 *
 * Ta oblika obstaja zaradi ritma: ostale sekcije so centriran naslov nad
 * mrežo enako velikih kartic, in prav to ponavljanje utruja. Tu je
 * kompozicija razpolovljena in nesimetrična.
 *
 * Besedila so dobesedno iz `data/products.ts` — trditev o pridelavi si ne
 * izmišljamo.
 */
export default function PhotoFeature({
  label,
  title,
  description,
  src,
  alt,
  side = 'left',
  objectPosition = '50% 100%',
  cta,
}: PhotoFeatureProps) {
  return (
    <section className={`${sectionShell} bg-cream py-12 md:py-14`}>
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* 5/12 za fotografijo, 7/12 za besedilo: pri polovici je bila
            fotografija na namizju prevelika, besedilne vrstice pa predolge. */}
        <div className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
          <Reveal
            direction={side === 'left' ? 'left' : 'right'}
            className={cn(
              'overflow-hidden rounded-3xl border border-cream-dark bg-white p-1.5 shadow-lg',
              'md:col-span-5',
              side === 'right' && 'md:order-2',
            )}
          >
            <div className="relative aspect-4/3 overflow-hidden rounded-[18px]">
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                style={{ objectPosition }}
              />
            </div>
          </Reveal>

          <Reveal
            direction={side === 'left' ? 'right' : 'left'}
            className={cn(
              'flex flex-col items-start gap-4 md:col-span-7',
              side === 'right' && 'md:order-1',
            )}
          >
            <span className="type-label text-green-light">{label}</span>
            <h2 className="type-h2">{title}</h2>
            <p className="type-body-lg text-ink-mid">{description}</p>
            {cta && (
              <Pressable href={cta.href} variant="secondary" className="mt-2">
                {cta.label}
                <span aria-hidden>→</span>
              </Pressable>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
