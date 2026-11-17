'use client';

import { useEffect } from 'react';
import { useShop } from '@/store/shop';

/** Memuat keranjang & favorit dari localStorage setelah halaman ter-hydrate. */
export function StoreHydrator() {
  useEffect(() => {
    void useShop.persist.rehydrate();
  }, []);
  return null;
}
