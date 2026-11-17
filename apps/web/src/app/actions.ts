'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { ApiError, quoteCart } from '@/lib/api';
import type { CartQuote } from '@/lib/types';

const quoteInputSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
  promoCode: z.string().trim().max(32).optional(),
  delivery: z.enum(['standard', 'pickup']),
});

export type QuoteResult =
  | { ok: true; quote: CartQuote }
  | { ok: false; error: string };

/**
 * Server Action: browser memanggil fungsi ini, lalu server Next.js yang
 * meneruskan ke NestJS dengan API key. Key tidak pernah sampai ke browser.
 */
export async function getCartQuote(input: unknown): Promise<QuoteResult> {
  const parsed = quoteInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Data keranjang tidak valid' };

  const requestHeaders = await headers();
  const clientIp =
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    requestHeaders.get('x-real-ip') ??
    undefined;

  try {
    const quote = await quoteCart(
      { ...parsed.data, promoCode: parsed.data.promoCode || undefined },
      clientIp,
    );
    return { ok: true, quote };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) {
        return { ok: false, error: 'Terlalu banyak permintaan. Tunggu sebentar.' };
      }
      if (error.status === 422) {
        return { ok: false, error: 'Ada produk di keranjang yang sudah tidak tersedia.' };
      }
    }
    return { ok: false, error: 'Gagal menghitung total. Coba lagi.' };
  }
}
