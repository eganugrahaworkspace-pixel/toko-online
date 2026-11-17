import 'server-only';

import type { CartQuote, Category, ProductDetail, ProductList, Product } from './types';
import type { CatalogFilters } from './search-params';

/**
 * Client untuk backend NestJS. File ini diberi `server-only`, jadi build akan gagal
 * kalau ada komponen client yang meng-import-nya. Dengan begitu API_KEY tidak
 * mungkin ikut terkirim ke browser.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const CATALOG_REVALIDATE_SECONDS = 300;
const REQUEST_TIMEOUT_MS = 8000;

function getConfig() {
  const baseUrl = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;
  if (!baseUrl || !apiKey) {
    throw new ApiError(500, 'API_BASE_URL dan API_KEY wajib diset di environment server');
  }
  return { baseUrl, apiKey };
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  /** Diteruskan ke backend untuk rate limit per pengunjung. */
  clientIp?: string;
  cache?: 'catalog' | 'no-store';
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { baseUrl, apiKey } = getConfig();
  const headers: Record<string, string> = {
    accept: 'application/json',
    'x-api-key': apiKey,
  };
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  if (options.clientIp) headers['x-client-ip'] = options.clientIp;

  let response: Response;
  try {
    response = await fetch(new URL(path, baseUrl), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...(options.cache === 'catalog'
        ? { next: { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ['catalog'] } }
        : { cache: 'no-store' as const }),
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'network';
    console.error(`[api] ${options.method ?? 'GET'} ${path} gagal (${reason})`, error);
    throw new ApiError(503, 'Server toko sedang tidak bisa dihubungi');
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: unknown } | null;
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : typeof payload?.message === 'string'
        ? payload.message
        : `HTTP ${response.status}`;
    // Jangan tampilkan detail 401/5xx ke pengunjung; cukup di log server.
    if (response.status === 401) console.error('[api] API key ditolak backend. Cek API_KEY.');
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export function getProducts(filters: CatalogFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.brands.length) params.set('brands', filters.brands.join(','));
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  if (filters.minRating !== undefined) params.set('minRating', String(filters.minRating));
  if (filters.inStock) params.set('inStock', 'true');
  if (filters.sort !== 'relevance') params.set('sort', filters.sort);
  params.set('page', String(filters.page));
  params.set('limit', '24');
  return request<ProductList>(`/v1/products?${params}`, { cache: 'catalog' });
}

export function getProduct(id: number) {
  return request<ProductDetail>(`/v1/products/${id}`, { cache: 'catalog' });
}

export function getRelatedProducts(id: number) {
  return request<Product[]>(`/v1/products/${id}/related`, { cache: 'catalog' });
}

export function getCategories() {
  return request<Category[]>('/v1/categories', { cache: 'catalog' });
}

export function quoteCart(
  body: { items: { productId: number; quantity: number }[]; promoCode?: string; delivery: string },
  clientIp?: string,
) {
  return request<CartQuote>('/v1/cart/quote', { method: 'POST', body, clientIp });
}
