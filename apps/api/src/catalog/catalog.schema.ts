import { z } from 'zod';

/**
 * Bentuk data dari upstream (DummyJSON). Hanya field yang dipakai yang divalidasi,
 * sisanya dibuang. Kalau upstream berubah format, kita gagal dengan pesan jelas
 * alih-alih mengirim data rusak ke frontend.
 */
export const upstreamReviewSchema = z.object({
  rating: z.number().min(0).max(5),
  comment: z.string(),
  date: z.string(),
  reviewerName: z.string(),
});

export const upstreamProductSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().default(''),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  discountPercentage: z.number().min(0).max(100).default(0),
  rating: z.number().min(0).max(5).default(0),
  stock: z.number().int().min(0).default(0),
  brand: z.string().optional(),
  tags: z.array(z.string()).default([]),
  thumbnail: z.url(),
  images: z.array(z.url()).default([]),
  reviews: z.array(upstreamReviewSchema).default([]),
  shippingInformation: z.string().optional(),
  warrantyInformation: z.string().optional(),
  returnPolicy: z.string().optional(),
});

export const upstreamProductListSchema = z.object({
  products: z.array(upstreamProductSchema),
  total: z.number().int(),
});

export const upstreamCategoryListSchema = z.array(
  z.object({ slug: z.string(), name: z.string() }),
);

export type UpstreamProduct = z.infer<typeof upstreamProductSchema>;

/** Representasi produk yang dikirim API kita ke client. */
export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  brand: string | null;
  price: number;
  /** Harga sebelum diskon, null kalau tidak ada diskon. */
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

export interface ProductDetail extends Product {
  reviews: { rating: number; comment: string; date: string; author: string }[];
  shippingInformation: string | null;
  warrantyInformation: string | null;
  returnPolicy: string | null;
}

export interface Category {
  slug: string;
  name: string;
}
