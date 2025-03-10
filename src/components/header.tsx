import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          {/* Popravljen Image komponenta s pravilno potjo do slike */}
          <Image src="/sparglji.jpg" alt="Šparglji" width={100} height={100} />
          <span className="ml-2 text-xl font-semibold text-gray-900">TEŠLAN</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-sm font-medium text-gray-700 hover:text-gray-900">Domov</Link>
          <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-gray-900">Izdelki</Link>
        </div>
      </div>
    </header>
  );
}
