import './globals.css';
import { Fraunces, Inter } from 'next/font/google';
import Header from '@/components/header';
import Footer from '@/components/footer';

export const metadata = {
  title: 'Domačija Tešlan — Sveža ekološka hrana iz Dolenjske',
  description: 'Lokalno pridelani šparglji, jagode, česen in krompir. Obiščite nas v Podgori pri Novem mestu.',
  keywords: 'kmetija, ekološko, šparglji, Dolenjska, Novo mesto, lokalna hrana',
  openGraph: {
    title: 'Domačija Tešlan',
    description: 'Iz naše zemlje na vašo mizo.',
    locale: 'sl_SI',
  },
};

export const viewport = {
  // Barva sistemske vrstice na mobilnem. Vsaka stran se na vrhu začne s
  // temno zelenim blokom, zato mora biti ta; kremna je dajala svetel pas
  // tam, kjer telefon kaže uro.
  themeColor: '#1a3a2a',
};

// Pisavi identitete (Z1): Fraunces za naslove, Inter za besedilo in
// vmesnik. Obe sta spremenljivi z osjo optične velikosti in obe imata
// latin-ext (č, š, ž). Izpostavita se kot CSS spremenljivki, ki ju
// `globals.css` preslika v `--font-display` in `--font-sans`; literalno
// ime družine ne deluje, ker ga next/font hashira.
const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  axes: ['opsz', 'SOFT'],
  display: 'swap',
  variable: '--font-fraunces',
});

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-[100dvh] bg-green-deep">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-full focus:bg-green-deep focus:px-5 focus:py-2.5 focus:text-cream type-nav"
        >
          Skoči na vsebino
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
