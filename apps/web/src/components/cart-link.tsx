'use client';

import Link from 'next/link';
import { ShoppingBasket } from 'lucide-react';
import { selectCartCount, useIsClient, useShop } from '@/store/shop';

export function CartBadge({ className }: { className?: string }) {
  const count = useShop(selectCartCount);
  const isClient = useIsClient();
  if (!isClient || count === 0) return null;
  return (
    <span
      className={`absolute grid min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-5 text-white ring-2 ring-white ${className ?? '-right-1.5 -top-1.5'}`}
    >
      {count > 99 ? '99+' : count}
      <span className="sr-only"> item di keranjang</span>
    </span>
  );
}

export function CartLink() {
  return (
    <Link
      href="/cart"
      className="inline-flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium hover:bg-surface"
    >
      <span className="relative">
        <ShoppingBasket className="size-5" aria-hidden />
        <CartBadge />
      </span>
      Keranjang
    </Link>
  );
}
