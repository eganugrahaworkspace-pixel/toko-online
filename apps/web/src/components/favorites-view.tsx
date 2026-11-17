'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useIsClient, useShop } from '@/store/shop';
import { ProductCard } from './product-card';

export function FavoritesView() {
  const isClient = useIsClient();
  const favorites = useShop((state) => state.favorites);
  const items = Object.values(favorites);

  if (!isClient) {
    return <div className="h-96 animate-pulse rounded-card bg-white" aria-busy="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto mt-6 flex max-w-md flex-col items-center rounded-card bg-white px-6 py-14 text-center shadow-soft">
        <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand-500">
          <Heart className="size-8" aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-bold">Belum ada favorit</h1>
        <p className="mt-1 text-muted">Ketuk ikon hati di produk untuk menyimpannya di sini.</p>
        <Link href="/" className="mt-6 rounded-full bg-brand-500 px-6 py-3 font-semibold text-white shadow-float">
          Jelajahi produk
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">
        Favorit <span className="text-muted">({items.length})</span>
      </h1>
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}
