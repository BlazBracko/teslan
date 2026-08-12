import type { Stock } from '@/data/availability';
import { cn } from '@/lib/utils';

/**
 * Oznaka razpoložljivosti.
 *
 * Barve so tiste, ki jih paleta v `navodila.md` predvideva: rjava za
 * sezonske oznake, zelena za razpoložljivo.
 *
 * „Ni na voljo“ je namenoma nevtralno sivo in ne rdeče. Kmetija, ki ima
 * šparglje samo od aprila do junija, ni v napaki — rdeča bi to brala kot
 * okvaro namesto kot letni čas.
 */
const videz: Record<Stock['kind'], { pika: string; ovoj: string }> = {
  'na-zalogi': {
    pika: 'bg-green-bright',
    ovoj: 'bg-green-bright/15 text-green-mid',
  },
  kmalu: {
    pika: 'bg-brown-light',
    ovoj: 'bg-brown-light/20 text-brown',
  },
  'ni-na-voljo': {
    pika: 'bg-ink-light/60',
    ovoj: 'bg-cream-dark text-ink-light',
  },
};

export default function StockTag({ stock }: { stock: Stock }) {
  const { pika, ovoj } = videz[stock.kind];

  return (
    <span
      className={cn(
        'type-small inline-flex items-center gap-2 rounded-full px-3 py-1 whitespace-nowrap',
        ovoj,
      )}
    >
      <span aria-hidden className={cn('h-1.5 w-1.5 shrink-0 rounded-full', pika)} />
      {stock.label}
    </span>
  );
}
