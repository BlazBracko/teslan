// types.ts or inside the file, wherever appropriate
export interface PricingOption {
  weight: string;
  price: string;
}

export interface Product {
  id: number;
  name: string;
  imageUrl: string;
  description: string;
  pricing: PricingOption[];
}
