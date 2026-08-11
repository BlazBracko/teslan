import './globals.css';
import { Manrope, DM_Serif_Display } from 'next/font/google';
import Header from '@/components/header';
import Footer from '@/components/footer';

export const metadata = {
  title: 'Domačija Tešlan — Sveža ekološka hrana iz Dolenjske',
  description: 'Lokalno pridelani šparglji, jagode, česen in krompir. Obiščite nas v Podgori pri Novem mestu.',
  keywords: 'kmetija, ekološko, šparglji, Dolenjska, Novo mesto, lokalna hrana',
  openGraph: {
    title: 'Domačija Tešlan',
    description: 'Iz naše zemlje, na vašo mizo.',
    locale: 'sl_SI',
  },
};

export const viewport = {
  // Barva sistemske vrstice na mobilnem. Vsaka stran se na vrhu začne s
  // temno zelenim blokom, zato mora biti ta; kremna je dajala svetel pas
  // tam, kjer telefon kaže uro.
  themeColor: '#1a3a2a',
};

// Oba fonta se izpostavita kot CSS spremenljivki. Literalno ime
// družine ("Manrope", "DM Serif Display") ne deluje — next/font
// generira hashirano ime, zato sme na fonta kazati samo ta var.
const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-manrope',
});

const dmSerifDisplay = DM_Serif_Display({
  weight: '400',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-dm-serif-display',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl" className={`${manrope.variable} ${dmSerifDisplay.variable}`}>
      <body className="min-h-[100dvh] bg-cream">
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
