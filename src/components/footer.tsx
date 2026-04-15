'use client';

import Link from 'next/link';
import Image from 'next/image';
import { contact } from '@/data/contact';

export default function Footer() {
  return (
    <footer className="bg-[#1a3a2a] text-[#f5f0e8]">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-12 py-9">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Column 1 - Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Tešlan logo"
                width={48}
                height={48}
                className="rounded-full"
              />
              <span className="text-xl font-bold">Tešlan</span>
            </div>
            <p className="text-sm text-[#e5dcc8]">
              Domačija Tešlan — Podgora, Dolenjska
            </p>
          </div>

          {/* Column 2 - Pages */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Strani</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-[#e5dcc8] hover:text-[#6b8e23] transition-colors"
                >
                  Domov
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-[#e5dcc8] hover:text-[#6b8e23] transition-colors"
                >
                  Izdelki
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-[#e5dcc8] hover:text-[#6b8e23] transition-colors"
                >
                  O nas
                </Link>
              </li>
              <li>
                <Link
                  href="/privacyPolicy"
                  className="text-[#e5dcc8] hover:text-[#6b8e23] transition-colors"
                >
                  Zasebnost
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Kontakt</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-[#e5dcc8] hover:text-[#6b8e23] transition-colors"
                >
                  {contact.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="text-[#e5dcc8] hover:text-[#6b8e23] transition-colors"
                >
                  {contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#e5dcc8] hover:text-[#6b8e23] transition-colors"
                >
                  Navodila za pot →
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="border-t border-[#2d5a3f]">
        <div className="max-w-7xl mx-auto px-12 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#e5dcc8]">
            <p>© 2025 Domačija Tešlan. Vse pravice pridržane.</p>
            <p className="italic">Izdelano z ljubeznijo na Dolenjskem.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
