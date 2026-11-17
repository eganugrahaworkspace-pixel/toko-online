import { z } from 'zod';

export const SORT_OPTIONS = [
  'relevance',
  'price-asc',
  'price-desc',
  'rating',
  'discount',
] as const;

const csvList = z
  .string()
  .max(500)
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

export const listProductsQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    category: z.string().trim().max(60).optional(),
    brands: csvList.optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    inStock: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    sort: z.enum(SORT_OPTIONS).default('relevance'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(60).default(24),
  })
  .refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      query.minPrice <= query.maxPrice,
    {
      message: 'minPrice tidak boleh lebih besar dari maxPrice',
      path: ['minPrice'],
    },
  );

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const productIdSchema = z.coerce.number().int().positive();
