import Link from 'next/link';
import Image from 'next/image';
import { contact } from '@/data/contact';

const pages = [
  { href: '/', label: 'Domov' },
  { href: '/products', label: 'Izdelki' },
  { href: '/about', label: 'O nas' },
  { href: '/privacyPolicy', label: 'Zasebnost' },
];

const linkClass =
  'type-small touch-manipulation text-cream/75 transition-colors duration-200 hover:text-green-bright';

export default function Footer() {
  return (
    <footer className="bg-green-deep text-cream">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="" width={48} height={48} className="rounded-full" />
              <span className="type-h3 text-cream">Tešlan</span>
            </div>
            <p className="type-small text-cream/75">Domačija Tešlan — Podgora, Dolenjska</p>
          </div>

          <nav aria-label="Strani">
            <h2 className="type-label mb-4 text-green-bright">Strani</h2>
            <ul className="flex flex-col gap-2">
              {pages.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className={linkClass}>
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="type-label mb-4 text-green-bright">Kontakt</h2>
            <ul className="flex flex-col gap-2">
              <li>
                <a href={`mailto:${contact.email}`} className={linkClass}>
                  {contact.email}
                </a>
              </li>
              <li>
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className={linkClass}>
                  {contact.phone}
                </a>
              </li>
              <li>
                <a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Navodila za pot <span aria-hidden>→</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-cream/15">
        <div className="mx-auto max-w-7xl px-6 py-6 md:px-12">
          <div className="type-small flex flex-col items-center justify-between gap-4 text-cream/70 md:flex-row">
            {/* Leto je bilo trdo zapisano na 2025 in je zastarelo. */}
            <p>© {new Date().getFullYear()} Domačija Tešlan. Vse pravice pridržane.</p>
            <p className="italic">Izdelano z ljubeznijo na Dolenjskem.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
