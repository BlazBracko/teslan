export interface Product {
  id: string;
  name: string;
  description: string;
  season: string;
  status: 'available' | 'soon' | 'autumn';
  statusLabel: string;
  image?: string;
}

export const products: Product[] = [
  {
    id: 'sparglji',
    name: 'Šparglji',
    description: 'Sveži zeleni šparglji, ročno pobrani vsako jutro. Nežen okus, popolni za na žar ali v solato.',
    season: 'April — Junij',
    status: 'available',
    statusLabel: 'Na voljo',
  },
  {
    id: 'jagode',
    name: 'Jagode',
    description: 'Sladke, sočne jagode pridelane brez pesticidov. Popolne za sveže uživanje ali predelavo.',
    season: 'Maj — Julij',
    status: 'soon',
    statusLabel: 'Kmalu',
  },
  {
    id: 'cesen',
    name: 'Česen',
    description: 'Domači česen z intenzivnim okusom. Idealen za kuhanje, kisanje ali kot naravno zdravilo.',
    season: 'September — Oktober',
    status: 'autumn',
    statusLabel: 'Jesen',
  },
  {
    id: 'krompir',
    name: 'Krompir',
    description: 'Domači krompir raznih sort. Odličen za pečenje, kuhanje ali kot priloga.',
    season: 'Avgust — Oktober',
    status: 'autumn',
    statusLabel: 'Jesen',
  },
];
