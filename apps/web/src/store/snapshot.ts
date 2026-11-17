import type { Product } from '@/lib/types';

/** Snapshot ringan untuk tampilan. Harga final selalu dihitung ulang di server. */
export type ProductSnapshot = Pick<
  Product,
  'id' | 'title' | 'thumbnail' | 'price' | 'compareAtPrice' | 'stock' | 'isTopItem' | 'brand'
>;

export const toSnapshot = (product: Product | ProductSnapshot): ProductSnapshot => ({
  id: product.id,
  title: product.title,
  thumbnail: product.thumbnail,
  price: product.price,
  compareAtPrice: product.compareAtPrice,
  stock: product.stock,
  isTopItem: product.isTopItem,
  brand: product.brand,
});

