'use client';

import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DeliveryOption } from '@/lib/types';
import { type ProductSnapshot, toSnapshot } from './snapshot';

export { type ProductSnapshot, toSnapshot };

export interface CartItem extends ProductSnapshot {
  quantity: number;
}

interface ShopState {
  cart: Record<number, CartItem>;
  favorites: Record<number, ProductSnapshot>;
  promoCode: string;
  delivery: DeliveryOption;
  addToCart: (product: ProductSnapshot, quantity?: number) => void;
  setQuantity: (id: number, quantity: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  toggleFavorite: (product: ProductSnapshot) => void;
  setPromoCode: (code: string) => void;
  setDelivery: (delivery: DeliveryOption) => void;
}

const MAX_QTY = 99;

export const useShop = create<ShopState>()(
  persist(
    (set) => ({
      cart: {},
      favorites: {},
      promoCode: '',
      delivery: 'standard',
      addToCart: (product, quantity = 1) =>
        set((state) => {
          const current = state.cart[product.id]?.quantity ?? 0;
          const limit = Math.min(MAX_QTY, Math.max(product.stock, 1));
          return {
            cart: {
              ...state.cart,
              [product.id]: { ...toSnapshot(product), quantity: Math.min(current + quantity, limit) },
            },
          };
        }),
      setQuantity: (id, quantity) =>
        set((state) => {
          const item = state.cart[id];
          if (!item) return state;
          const clamped = Math.max(1, Math.min(quantity, MAX_QTY, Math.max(item.stock, 1)));
          return { cart: { ...state.cart, [id]: { ...item, quantity: clamped } } };
        }),
      removeFromCart: (id) =>
        set((state) => {
          const rest = { ...state.cart };
          delete rest[id];
          return { cart: rest };
        }),
      clearCart: () => set({ cart: {}, promoCode: '' }),
      toggleFavorite: (product) =>
        set((state) => {
          if (state.favorites[product.id]) {
            const rest = { ...state.favorites };
            delete rest[product.id];
            return { favorites: rest };
          }
          return { favorites: { ...state.favorites, [product.id]: toSnapshot(product) } };
        }),
      setPromoCode: (promoCode) => set({ promoCode: promoCode.trim().toUpperCase().slice(0, 32) }),
      setDelivery: (delivery) => set({ delivery }),
    }),
    {
      name: 'toko-online:shop',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Hidrasi manual setelah mount agar HTML server dan client sama.
      skipHydration: true,
    },
  ),
);

const subscribeNoop = () => () => {};

/** true setelah komponen berjalan di browser; dipakai untuk menghindari hydration mismatch. */
export function useIsClient() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

export const selectCartCount = (state: ShopState) =>
  Object.values(state.cart).reduce((sum, item) => sum + item.quantity, 0);
