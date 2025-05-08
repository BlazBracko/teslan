'use client'
import React, { useState, useEffect } from 'react';

import ProductCardMobile from './ProductCardMobile';
import ProductCardDesktop from './ProductCardDesktop';

export default function ProductsPage() {
  // Primer izdelkov (zamenjajte z dejanskimi podatki iz vaše API ali baze podatkov)
  const products = [
    {
      id: 1,
      name: "Šparglji",
      imageUrl: "/sparglji.jpg",
      description: "Sveži šparglji. Popolni za pripravo okusnih solat ali kot priloga k mesnim jedem.",
      pricing: [
        { weight: "šopek (0.5 kg)", price: "5 €" },
      ],
    },
    {
      id: 2,
      name: "Jagode",
      imageUrl: "/jagode.png",
      description: "Sočne in sladke jagode, pobrane v sezoni. Idealne za sladice, smoothije ali kar za neposredno uživanje.",
      pricing: [
        { weight: "košarica (0.5 kg)", price: "5 €" },
      ],
    },
    // {
    //   id: 3,
    //   name: "Svež česen",
    //   imageUrl: "/cesen.jpg",
    //   description: "Organski svež česen z bogatim okusom, idealen za vse vrste kuhanja. Dodajte ga za izjemen okus v jedeh.",
    //   pricing: [
    //     { weight: "250g", price: "€10.00" },
    //     { weight: "500g", price: "€18.00" },
    //     { weight: "1kg", price: "€35.00" },
    //   ],
    // },
    // {
    //   id: 4,
    //   name: "Domač krompir",
    //   imageUrl: "/krompir.jpg",
    //   description: "Krompir, pridelan na naših kmetijah, idealen za pečenje, pire ali kuhanje. Okusno in zdravo.",
    //   pricing: [
    //     { weight: "1kg", price: "€4.00" },
    //     { weight: "2kg", price: "€7.50" },
    //     { weight: "5kg", price: "€15.00" },
    //   ],
    // },
  ];

  // State za spremljanje širine zaslona
  const [isMobile, setIsMobile] = useState(false);

  // Funkcija za preverjanje širine zaslona
  const checkIfMobile = () => {
    setIsMobile(window.innerWidth <= 768); // 768px je običajno meja za mobilne naprave
  };

  // Uporaba useEffect za spremljanje sprememb velikosti okna
  useEffect(() => {
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-8 text-center">
          Naši Izdelki
        </h1>
        <div className="space-y-6 mb-16">
          {products.map((product, index) => (
            isMobile ? (
              <ProductCardMobile key={product.id} product={product} />
            ) : (
                <ProductCardDesktop key={product.id} product={product} index={index} />
                )
          ))}
        </div>
      </main>
    </>
  );
}
