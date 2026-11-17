import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { z } from 'zod';
import type { Env } from '../config/env.js';
import {
  type Category,
  type ProductDetail,
  type UpstreamProduct,
  upstreamCategoryListSchema,
  upstreamProductListSchema,
} from './catalog.schema.js';

interface Snapshot {
  products: ProductDetail[];
  byId: Map<number, ProductDetail>;
  categories: Category[];
  fetchedAt: number;
}

const TOP_ITEM_MIN_RATING = 4.5;

const toCents = (value: number) => Math.round(value * 100);
const fromCents = (cents: number) => cents / 100;

export function toProduct(raw: UpstreamProduct): ProductDetail {
  const priceCents = toCents(raw.price);
  const discount = raw.discountPercentage;
  // Harga upstream adalah harga jual; harga coret dihitung balik dari diskonnya.
  const compareAtCents =
    discount >= 1 ? Math.round(priceCents / (1 - discount / 100)) : null;

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    category: raw.category,
    brand: raw.brand ?? null,
    price: fromCents(priceCents),
    compareAtPrice: compareAtCents ? fromCents(compareAtCents) : null,
    discountPercentage: Math.round(discount),
    rating: Math.round(raw.rating * 10) / 10,
    reviewCount: raw.reviews.length,
    stock: raw.stock,
    inStock: raw.stock > 0,
    isTopItem: raw.rating >= TOP_ITEM_MIN_RATING,
    thumbnail: raw.thumbnail,
    images: raw.images.length > 0 ? raw.images : [raw.thumbnail],
    tags: raw.tags,
    // Email reviewer sengaja tidak diteruskan ke client.
    reviews: raw.reviews.map((review) => ({
      rating: review.rating,
      comment: review.comment,
      date: review.date,
      author: review.reviewerName,
    })),
    shippingInformation: raw.shippingInformation ?? null,
    warrantyInformation: raw.warrantyInformation ?? null,
    returnPolicy: raw.returnPolicy ?? null,
  };
}

/**
 * Sumber data katalog. Data diambil sekali dari upstream lalu di-cache di memori
 * dengan TTL. Kalau upstream sedang down, data lama (stale) tetap disajikan
 * supaya toko tidak ikut mati. Untuk pindah ke database sendiri, cukup ganti
 * implementasi kelas ini; controller dan frontend tidak perlu berubah.
 */
@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  private snapshot: Snapshot | null = null;
  private inflight: Promise<Snapshot> | null = null;

  constructor(private readonly config: ConfigService<Env, true>) {}

  async getSnapshot(): Promise<Snapshot> {
    const ttlMs =
      this.config.get('CATALOG_CACHE_TTL_SECONDS', { infer: true }) * 1000;
    const fresh = this.snapshot && Date.now() - this.snapshot.fetchedAt < ttlMs;
    if (fresh && this.snapshot) return this.snapshot;

    // Single-flight: banyak request bersamaan hanya memicu satu fetch ke upstream.
    this.inflight ??= this.refresh().finally(() => {
      this.inflight = null;
    });

    try {
      return await this.inflight;
    } catch (error) {
      if (this.snapshot) {
        this.logger.warn(
          `Upstream gagal, menyajikan data cache: ${(error as Error).message}`,
        );
        return this.snapshot;
      }
      this.logger.error(
        `Upstream gagal tanpa cache: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException(
        'Katalog sedang tidak tersedia. Coba lagi sebentar lagi.',
      );
    }
  }

  private async refresh(): Promise<Snapshot> {
    const [productList, categories] = await Promise.all([
      this.fetchJson('/products?limit=0', upstreamProductListSchema),
      this.fetchJson('/products/categories', upstreamCategoryListSchema),
    ]);

    const products = productList.products.map(toProduct);
    this.snapshot = {
      products,
      byId: new Map(products.map((product) => [product.id, product])),
      categories: categories.map(({ slug, name }) => ({ slug, name })),
      fetchedAt: Date.now(),
    };
    this.logger.log(`Katalog dimuat: ${products.length} produk`);
    return this.snapshot;
  }

  private async fetchJson<T extends z.ZodType>(
    path: string,
    schema: T,
  ): Promise<z.infer<T>> {
    const baseUrl = this.config.get('CATALOG_UPSTREAM_URL', { infer: true });
    const timeout = this.config.get('UPSTREAM_TIMEOUT_MS', { infer: true });

    const response = await fetch(new URL(path, baseUrl), {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) {
      throw new Error(`GET ${path} -> HTTP ${response.status}`);
    }

    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) {
      throw new Error(
        `Format upstream ${path} tidak valid: ${parsed.error.message}`,
      );
    }
    return parsed.data;
  }
}
