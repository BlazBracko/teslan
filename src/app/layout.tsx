import './globals.css';
import { Manrope } from 'next/font/google';
import Header from '@/components/header';
import Footer from '@/components/footer';

export const metadata = {
  title: 'Domačija Tešlan',
  description: 'Skrbno pridelana hrana, neposredno iz naše kmetije na vaše mize.',
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}>
      <body className="min-h-[100dvh] flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
