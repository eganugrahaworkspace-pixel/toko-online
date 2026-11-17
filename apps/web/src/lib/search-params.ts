import { z } from 'zod';

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Paling relevan' },
  { value: 'rating', label: 'Rating tertinggi' },
  { value: 'discount', label: 'Diskon terbesar' },
  { value: 'price-asc', label: 'Harga terendah' },
  { value: 'price-desc', label: 'Harga tertinggi' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];
const sortValues = SORT_OPTIONS.map((option) => option.value) as [SortValue, ...SortValue[]];

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);
const optionalNumber = z.preprocess(
  (value) => {
    const raw = first(value);
    return raw === undefined || raw === '' ? undefined : raw;
  },
  z.coerce.number().min(0).optional().catch(undefined),
);

/**
 * Search params dari URL adalah input pengguna. Nilai yang tidak valid diabaikan
 * (pakai default) alih-alih membuat halaman error.
 */
const catalogSchema = z.object({
  q: z.preprocess(first, z.string().trim().max(100).optional().catch(undefined)),
  category: z.preprocess(first, z.string().trim().max(60).optional().catch(undefined)),
  brands: z.preprocess(
    (value) =>
      String(first(value) ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20),
    z.array(z.string().max(60)).catch([]),
  ),
  minPrice: optionalNumber,
  maxPrice: optionalNumber,
  minRating: z.preprocess(first, z.coerce.number().int().min(1).max(5).optional().catch(undefined)),
  inStock: z.preprocess((value) => first(value) === 'true', z.boolean()),
  sort: z.preprocess(first, z.enum(sortValues).catch('relevance')),
  page: z.preprocess(first, z.coerce.number().int().min(1).max(500).catch(1)),
});

export type CatalogFilters = z.infer<typeof catalogSchema>;

export function parseCatalogParams(raw: Record<string, string | string[] | undefined>): CatalogFilters {
  const filters = catalogSchema.parse(raw);
  if (
    filters.minPrice !== undefined &&
    filters.maxPrice !== undefined &&
    filters.minPrice > filters.maxPrice
  ) {
    return { ...filters, minPrice: filters.maxPrice, maxPrice: filters.minPrice };
  }
  return filters;
}

export function hasActiveFilters(filters: CatalogFilters) {
  return Boolean(
    filters.brands.length ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.minRating !== undefined ||
      filters.inStock,
  );
}
