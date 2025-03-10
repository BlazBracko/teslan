import React from 'react';
import Footer from '@/components/footer'; // Predpostavljamo, da imate komponento Footer v mapo components

export default function ProductsPage() {
  // Primer izdelkov (zamenjajte z dejanskimi podatki iz vaše API ali baze podatkov)
  const products = [
    {
      id: 1,
      name: "Šparglji",
      imageUrl: "../sparglji.jpg",
      description: "Sveži šparglji, gojeni na lokalnih kmetijah. Popolni za pripravo okusnih solat ali kot priloga k mesnim jedem.",
      pricing: [
        { weight: "250g", price: "€3.50" },
        { weight: "500g", price: "€6.50" },
        { weight: "1kg", price: "€12.00" },
      ],
    },
    {
      id: 2,
      name: "Jagode",
      imageUrl: "../jagode.png",
      description: "Sočne in sladke jagode, pobrane v sezoni. Idealne za sladice, smoothije ali kar za neposredno uživanje.",
      pricing: [
        { weight: "250g", price: "€2.00" },
        { weight: "500g", price: "€3.50" },
        { weight: "1kg", price: "€6.50" },
      ],
    },
    {
      id: 3,
      name: "Svež česen",
      imageUrl: "../cesen.jpg",
      description: "Organski svež česen z bogatim okusom, idealen za vse vrste kuhanja. Dodajte ga za izjemen okus v jedeh.",
      pricing: [
        { weight: "250g", price: "€10.00" },
        { weight: "500g", price: "€18.00" },
        { weight: "1kg", price: "€35.00" },
      ],
    },
    {
      id: 4,
      name: "Domač krompir",
      imageUrl: "../krompir.jpg",
      description: "Krompir, pridelan na naših kmetijah, idealen za pečenje, pire ali kuhanje. Okusno in zdravo.",
      pricing: [
        { weight: "1kg", price: "€4.00" },
        { weight: "2kg", price: "€7.50" },
        { weight: "5kg", price: "€15.00" },
      ],
    },
  ];

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Naši Izdelki</h1>

        <div className="space-y-6 mb-16">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={`flex items-center ${index % 2 === 0 ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full md:w-2/3 lg:w-1/2">
                <img
                  className="w-full h-64 object-scale-down bg-white"
                  src={product.imageUrl}
                  alt={product.name}
                />
              </div>
              <div className="w-full md:w-1/3 lg:w-1/4 p-6">
                <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-900">Cenik:</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {product.pricing.map((option, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{option.weight}</span>
                        <span>{option.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="p-6 w-full">
                <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
                <p className="text-gray-600 mt-2">{product.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
