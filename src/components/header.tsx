'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 transition-all duration-300',
        scrolled ? 'py-1 shadow-sm' : 'py-3'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/sparglji2.png"
            alt="Šparglji"
            width={56}
            height={56}
            className={clsx(
              'transition-all duration-300',
              scrolled ? 'w-8 h-8 sm:w-12 sm:h-12' : 'w-12 h-12 sm:w-16 sm:h-16'
            )}
          />
          <span
            className={clsx(
              'ml-2 font-semibold text-gray-900 transition-all duration-300',
              scrolled ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
            )}
          >
            TEŠLAN
          </span>
        </Link>
        <div className="flex items-center space-x-3 sm:space-x-5">
          <Link href="/" className="text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900">Domov</Link>
          <Link href="/products" className="text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900">Izdelki</Link>
        </div>
      </div>
    </header>
  );
}
