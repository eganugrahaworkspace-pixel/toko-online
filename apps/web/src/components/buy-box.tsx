'use client';

import { Minus, Plus, ShoppingBasket } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { formatPrice } from '@/lib/format';
import { type ProductSnapshot, useIsClient, useShop } from '@/store/shop';

/** Kotak beli. Di mobile menempel di bawah layar seperti desain referensi. */
export function BuyBox({ product }: { product: ProductSnapshot }) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const isClient = useIsClient();
  const inCartQty = useShop((state) => state.cart[product.id]?.quantity ?? 0);
  const addToCart = useShop((state) => state.addToCart);
  const maxQty = Math.min(99, product.stock);
  const soldOut = product.stock === 0;

  const add = () => {
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:static lg:rounded-card lg:border-0 lg:p-5 lg:shadow-soft">
      <div className="mx-auto flex max-w-xl items-center gap-3 lg:max-w-none">
        <div className="flex h-13 items-center rounded-full bg-surface p-1" aria-label="Jumlah">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1 || soldOut}
            aria-label="Kurangi jumlah"
            className="grid size-11 place-items-center rounded-full transition hover:bg-white disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <output className="w-8 text-center font-bold" aria-live="polite">
            {quantity}
          </output>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(maxQty, value + 1))}
            disabled={quantity >= maxQty || soldOut}
            aria-label="Tambah jumlah"
            className="grid size-11 place-items-center rounded-full transition hover:bg-white disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={add}
          disabled={soldOut}
          className="flex h-13 flex-1 items-center justify-center gap-2 rounded-full bg-brand-500 px-5 text-base font-bold text-white shadow-float transition hover:bg-brand-600 active:scale-[0.98] disabled:bg-muted disabled:shadow-none"
        >
          <ShoppingBasket className="size-5" aria-hidden />
          {soldOut ? 'Stok habis' : justAdded ? 'Ditambahkan!' : formatPrice(product.price * quantity)}
        </button>
      </div>
      {isClient && inCartQty > 0 && (
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted lg:max-w-none">
          {inCartQty} di keranjang ·{' '}
          <Link href="/cart" className="font-semibold text-brand-500 hover:underline">
            Lihat keranjang
          </Link>
        </p>
      )}
    </div>
  );
}
