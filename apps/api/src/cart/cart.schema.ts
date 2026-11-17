import { z } from 'zod';

export const DELIVERY_OPTIONS = ['standard', 'pickup'] as const;

export const cartQuoteSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, 'Keranjang kosong')
    .max(50),
  promoCode: z.string().trim().toUpperCase().max(32).optional(),
  delivery: z.enum(DELIVERY_OPTIONS).default('standard'),
});

export type CartQuoteInput = z.infer<typeof cartQuoteSchema>;
