'use client'
import React from 'react';
import Image from 'next/image';

export default function ProductCardMobile({ product }: { product: any }) {
  return (
    <div className="flex flex-col items-center rounded-lg p-6">
      {/* Naslov */}
      <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>

      {/* Slika */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full mb-4 mt-2">
        <Image
          className="w-full h-64 object-contain"
          src={product.imageUrl}
          alt={product.name}
          width={500}  // Set the width and height based on your design
          height={400} // Set the height based on your design
        />
      </div>

      {/* Opis */}
      <p className="text-gray-600 mb-4">{product.description}</p>

      {/* Cenik */}
      <div className="bg-gray-100 p-4 rounded-lg shadow-md w-full">
        <h3 className="text-lg font-medium text-gray-900">Cenik:</h3>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          {product.pricing.map((option: any, index: number) => (
            <li key={index} className="flex justify-between">
              <span>{option.weight}</span>
              <span>{option.price}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
