import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          {/* Slika se bo prilagodila glede na velikost zaslona */}
          <Image src="/sparglji2.png" alt="Šparglji" width={80} height={40} className="w-16 h-16 sm:w-24 sm:h-24" />
          <span className="ml-2 text-xl sm:text-2xl font-semibold text-gray-900">TEŠLAN</span>
        </Link>
        <div className="flex items-center space-x-4">
          {/* Prilagoditev velikosti gumba na različnih zaslonih */}
          <Link href="/" className="text-sm sm:text-base font-medium text-gray-700 hover:text-gray-900">Domov</Link>
          <Link href="/products" className="text-sm sm:text-base font-medium text-gray-700 hover:text-gray-900">Izdelki</Link>
        </div>
      </div>
    </header>
  );
}
