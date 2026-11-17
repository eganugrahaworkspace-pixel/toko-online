'use client';

import { Check, Heart, ShoppingBasket } from 'lucide-react';
import Link from 'next/link';
import { cn, formatPrice } from '@/lib/format';
import { type ProductSnapshot, useIsClient, useShop } from '@/store/shop';

export function FavoriteButton({
  product,
  className,
}: {
  product: ProductSnapshot;
  className?: string;
}) {
  const isClient = useIsClient();
  const isFavorite = useShop((state) => Boolean(state.favorites[product.id]));
  const toggleFavorite = useShop((state) => state.toggleFavorite);
  const active = isClient && isFavorite;

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(product)}
      aria-pressed={active}
      aria-label={active ? `Hapus ${product.title} dari favorit` : `Tambah ${product.title} ke favorit`}
      className={cn(
        'grid size-10 place-items-center rounded-full bg-white text-brand-500 shadow-soft transition hover:scale-105 active:scale-95',
        className,
      )}
    >
      <Heart className="size-5" fill={active ? 'currentColor' : 'none'} strokeWidth={2} />
    </button>
  );
}

/** Tombol harga ala desain: pill outline dengan ikon keranjang. */
export function AddToCartPill({ product }: { product: ProductSnapshot }) {
  const isClient = useIsClient();
  const inCart = useShop((state) => Boolean(state.cart[product.id]));
  const addToCart = useShop((state) => state.addToCart);
  const soldOut = product.stock === 0;

  if (soldOut) {
    return (
      <span className="inline-flex h-10 items-center rounded-full border-2 border-line px-4 text-sm font-semibold text-muted">
        Stok habis
      </span>
    );
  }

  if (isClient && inCart) {
    return (
      <Link
        href="/cart"
        className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-brand-200 px-4 text-sm font-bold text-brand-500 transition hover:bg-brand-50"
      >
        <Check className="size-4" strokeWidth={3} aria-hidden />
        Di keranjang
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => addToCart(product)}
      aria-label={`Tambah ${product.title} ke keranjang, ${formatPrice(product.price)}`}
      className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-brand-500 px-4 text-[15px] font-bold text-brand-500 transition hover:bg-brand-500 hover:text-white active:scale-95"
    >
      <ShoppingBasket className="size-[18px]" aria-hidden />
      {formatPrice(product.price)}
    </button>
  );
}
