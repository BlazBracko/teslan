import { RevealGroup, RevealItem } from '@/components/ui/Reveal';

const values = [
  {
    id: 'local',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
        <path d="M7 8h10M7 12h10M7 16h10M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: 'Lokalno pridelano',
    description: 'Vsak pridelek raste na naši zemlji v Podgori. Brez posrednikov, neposredno z njive k vam.',
  },
  {
    id: 'fresh',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: 'Vedno sveže',
    description: 'Pobrano zjutraj, pri vas popoldne. Naši izdelki ne potujejo po skladiščih in trgovinah.',
  },
  {
    id: 'sustainable',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
        <path
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: 'Trajnostno',
    description: 'Skrbimo za okolje z ekološkimi metodami pridelave in minimalno uporabo embalaže.',
  },
];

export default function ValuesSection() {
  return (
    <section className="bg-cream px-6 py-20 md:px-10">
      <div className="mx-auto max-w-7xl">
        <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {values.map((value) => (
            <RevealItem
              key={value.id}
              as="article"
              className="rounded-2xl border border-t-[3px] border-cream-dark border-t-green-light bg-white p-7"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-green-light/10 text-green-light">
                {value.icon}
              </div>
              <h3 className="type-h3 mb-3">{value.title}</h3>
              <p className="type-small text-ink-mid">{value.description}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
