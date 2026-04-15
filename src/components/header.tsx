'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX } from 'react-icons/hi';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: '/', label: 'Domov' },
    { href: '/products', label: 'Izdelki' },
    { href: '/about', label: 'O nas' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? 'py-1 bg-[#f5f0e8]/95 border-[#e8e0d0] backdrop-blur-[12px]'
            : 'py-1 bg-[#f5f0e8]/92 border-[#e8e0d0] backdrop-blur-[12px]'
        }`}
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <img
                src="/logo.png"
                alt="Tešlan logo"
                style={{ width: '48px', height: '48px', maxWidth: '48px', maxHeight: '48px' }}
                className="object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-semibold text-[#1a3a2a] hover:text-[#4a8c5e] transition-colors duration-300"
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="#visit"
                className="px-5 py-1.5 bg-[#1a3a2a] text-[#f5f0e8] rounded-full text-sm font-semibold hover:bg-[#4a8c5e] transition-all duration-300 hover:shadow-lg"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Obiščite nas
              </a>
            </nav>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#1a3a2a] hover:text-[#4a8c5e] transition-colors duration-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-[#f5f0e8] z-50 md:hidden shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Close Button */}
                <div className="flex justify-end p-4 border-b border-[#e8e0d0]">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-[#1a3a2a] hover:text-[#4a8c5e] transition-colors duration-300"
                    aria-label="Close menu"
                  >
                    <HiX className="w-6 h-6" />
                  </button>
                </div>

                {/* Mobile Navigation Links */}
                <nav className="flex flex-col p-6 gap-6">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.1 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg font-semibold text-[#1a3a2a] hover:text-[#4a8c5e] transition-colors duration-300 block"
                        style={{ fontFamily: 'Manrope, sans-serif' }}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}

                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: navLinks.length * 0.1 + 0.1 }}
                    className="mt-4"
                  >
                    <a
                      href="#visit"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full px-6 py-3 bg-[#1a3a2a] text-[#f5f0e8] text-center rounded-full text-sm font-semibold hover:bg-[#4a8c5e] transition-all duration-300"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      Obiščite nas
                    </a>
                  </motion.div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
