// Kontrak data dari backend NestJS (apps/api).

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  brand: string | null;
  price: number;
  compareAtPrice: number | null;
  discountPercentage: number;
  rating: number;
  reviewCount: number;
  stock: number;
  inStock: boolean;
  isTopItem: boolean;
  thumbnail: string;
  images: string[];
  tags: string[];
}

export interface Review {
  rating: number;
  comment: string;
  date: string;
  author: string;
}

export interface ProductDetail extends Product {
  reviews: Review[];
  shippingInformation: string | null;
  warrantyInformation: string | null;
  returnPolicy: string | null;
}

export interface Category {
  slug: string;
  name: string;
  count: number;
}

export interface PriceFacet {
  min: number;
  max: number;
  average: number;
  /** Bucket histogram dibagi pada skala log1p. */
  scale: 'log';
  histogram: number[];
}

export interface ProductList {
  data: Product[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  facets: { price: PriceFacet; brands: { name: string; count: number }[] };
}

export type DeliveryOption = 'standard' | 'pickup';

export interface CartQuote {
  lines: {
    productId: number;
    title: string;
    thumbnail: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    stock: number;
    adjusted: boolean;
  }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  delivery: DeliveryOption;
  promo: { code: string; valid: boolean; percent: number } | null;
  freeShippingThreshold: number;
}
