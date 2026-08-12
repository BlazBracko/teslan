import { sectionShell } from '@/components/ui/sectionShell';
import Reveal, { RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { cn } from '@/lib/utils';

/**
 * Ikone so isti emojiji kot na `/about`, da se stran sama s sabo ne razhaja.
 * Ujemanje po pomenu, ne po vrstnem redu: 📍 lokalno, ♻️ trajnostno, 🌱 pa
 * na `/about` stoji ob „Ekološko“ in tu ob „Vedno sveže“ — oboje je klica.
 */
const values = [
  {
    id: 'local',
    icon: '📍',
    title: 'Lokalno pridelano',
    description: 'Vsak pridelek raste na naši zemlji v Podgori. Brez posrednikov, neposredno z njive k vam.',
  },
  {
    id: 'fresh',
    icon: '🌱',
    title: 'Vedno sveže',
    description: 'Pobrano zjutraj, pri vas popoldne. Naši izdelki ne potujejo po skladiščih in trgovinah.',
  },
  {
    id: 'sustainable',
    icon: '♻️',
    title: 'Trajnostno',
    description: 'Skrbimo za okolje z ekološkimi metodami pridelave in minimalno uporabo embalaže.',
  },
];

const cardClass =
  'rounded-2xl border border-t-[3px] border-cream-dark border-t-green-light bg-white p-7';

/**
 * Emoji ne podeduje `currentColor`, zato zeleni tinte ne potrebuje več —
 * obarval bi ozadje, ne ikone. Ostane le velikost in poravnava.
 */
function ValueIcon({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center text-4xl leading-none">
      {children}
    </div>
  );
}

/**
 * Vrednote v nesimetrični razporeditvi.
 *
 * Prej so bile tri enako velike kartice v mreži — enak vzorec kot izdelki,
 * cenik in vrednote na `/about`. Zdaj sta prvi dve različno široki (7/5),
 * tretja pa je polna širina z vodoravno postavitvijo. Ista vsebina, druga
 * oblika: ritem strani ne sme nastajati samo iz barve.
 */
export default function ValuesSection() {
  const [first, second, third] = values;

  return (
    <section className={`${sectionShell} bg-cream px-6 py-14 md:px-10 md:py-16`}>
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-10">
          {/* Sekcija prej ni imela naslova in se je začela kar s karticami.
              Besedilo je tisto, ki ga stran za te tri vrednote že uporablja
              na `/about` — nove trditve nisem dodajal. */}
          <h2 className="type-h2 max-w-xl">Naše vrednote</h2>
        </Reveal>

        <RevealGroup className="grid gap-5 md:grid-cols-12">
          {[
            { value: first, span: 'md:col-span-7' },
            { value: second, span: 'md:col-span-5' },
          ].map(({ value, span }) => (
            <RevealItem key={value.id} as="article" className={cn(cardClass, span)}>
              <div className="mb-5">
                <ValueIcon>{value.icon}</ValueIcon>
              </div>
              <h3 className="type-h3 mb-3">{value.title}</h3>
              <p className="type-small text-ink-mid">{value.description}</p>
            </RevealItem>
          ))}

          {/* Tretja je vodoravna in čez celo širino — s tem se mreža razbije. */}
          <RevealItem
            as="article"
            className={cn(
              cardClass,
              'flex flex-col gap-5 md:col-span-12 md:flex-row md:items-center md:gap-7',
            )}
          >
            <ValueIcon>{third.icon}</ValueIcon>
            <div className="md:flex md:items-baseline md:gap-7">
              <h3 className="type-h3 mb-2 whitespace-nowrap md:mb-0">{third.title}</h3>
              <p className="type-small max-w-2xl text-ink-mid">{third.description}</p>
            </div>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  );
}
