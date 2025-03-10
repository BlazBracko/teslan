'use client'
import React from 'react';
import Image from 'next/image';
import { Product, PricingOption } from './types';  // Importing the Product type

interface ProductCardDesktopProps {
    product: Product;
    index: number;
  }

  export default function ProductCardDesktop({ product, index }: ProductCardDesktopProps) {
    return (
    <div className={`flex items-center space-x-6 rounded-lg p-6 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* Slika */}
      <div className=" shadow-lg rounded-lg overflow-hidden w-full md:w-2/4 lg:w-1/3">
        <Image
          className="w-full h-64 object-contain"
          src={product.imageUrl}
          alt={product.name}
          width={500}  // Set the width and height based on your design
          height={400} // Set the height based on your design
        />
      </div>

     
      {/* Cenik */}
      <div className="w-full md:w-1/3 lg:w-1/4 p-6">
        <div className="bg-gray-100 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900">Cenik:</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            {product.pricing.map((option: PricingOption, index: number) => (
              <li key={index} className="flex justify-between">
                <span>{option.weight}</span>
                <span>{option.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
       {/* Opis */}
       <div className="w-full md:w-1/3 lg:w-1/4">
        <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
        <p className="text-gray-600 mt-2">{product.description}</p>
      </div>

    </div>
  );
}
