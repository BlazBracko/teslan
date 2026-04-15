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
  }
};

const manrope = Manrope({ subsets: ['latin'] });
const dmSerifDisplay = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display'
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl" className={`${manrope.className} ${dmSerifDisplay.variable}`}>
      <body className="min-h-[100dvh]" style={{ backgroundColor: '#f5f0e8' }}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
