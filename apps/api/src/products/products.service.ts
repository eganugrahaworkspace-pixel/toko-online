import { Injectable, NotFoundException } from '@nestjs/common';
import type { Product, ProductDetail } from '../catalog/catalog.schema.js';
import { CatalogService } from '../catalog/catalog.service.js';
import type { ListProductsQuery } from './products.schema.js';

const HISTOGRAM_BUCKETS = 24;

export interface ProductListResponse {
  data: Product[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  facets: {
    /** Rentang & histogram harga dihitung tanpa filter harga, untuk slider. */
    /**
     * Histogram harga untuk slider. Bucket dibagi pada skala logaritmik (log1p)
     * karena harga sangat timpang ($1 sampai $2.500): pada skala linear hampir
     * semua produk menumpuk di satu bucket.
     */
    price: {
      min: number;
      max: number;
      average: number;
      scale: 'log';
      histogram: number[];
    };
    brands: { name: string; count: number }[];
  };
}

function toSummary(product: ProductDetail): Product {
  const {
    reviews: _reviews,
    shippingInformation: _shipping,
    warrantyInformation: _warranty,
    returnPolicy: _returns,
    ...summary
  } = product;
  return summary;
}

function matchesText(product: Product, q: string): boolean {
  const needle = q.toLowerCase();
  return [product.title, product.brand ?? '', product.category, ...product.tags]
    .join(' ')
    .toLowerCase()
    .includes(needle);
}

function buildPriceFacet(products: Product[]) {
  if (products.length === 0) {
    return { min: 0, max: 0, average: 0, scale: 'log' as const, histogram: [] };
  }
  const prices = products.map((product) => product.price);
  const min = Math.floor(Math.min(...prices));
  const max = Math.ceil(Math.max(...prices));
  const average =
    Math.round(
      (prices.reduce((sum, price) => sum + price, 0) / prices.length) * 100,
    ) / 100;

  const histogram: number[] = Array.from(
    { length: HISTOGRAM_BUCKETS },
    () => 0,
  );
  const logMin = Math.log1p(min);
  const logSpan = Math.max(Math.log1p(max) - logMin, Number.EPSILON);
  for (const price of prices) {
    const index = Math.min(
      HISTOGRAM_BUCKETS - 1,
      Math.max(
        0,
        Math.floor(
          ((Math.log1p(price) - logMin) / logSpan) * HISTOGRAM_BUCKETS,
        ),
      ),
    );
    histogram[index]! += 1;
  }
  return { min, max, average, scale: 'log' as const, histogram };
}

@Injectable()
export class ProductsService {
  constructor(private readonly catalog: CatalogService) {}

  async list(query: ListProductsQuery): Promise<ProductListResponse> {
    const { products } = await this.catalog.getSnapshot();

    // Tahap 1: filter yang tidak memengaruhi facet harga/brand.
    const scoped = products.filter(
      (product) =>
        (!query.category || product.category === query.category) &&
        (!query.q || matchesText(product, query.q)),
    );

    // Tahap 2: sisa filter.
    const brandSet = query.brands?.length
      ? new Set(query.brands.map((brand) => brand.toLowerCase()))
      : null;

    const filtered = scoped.filter(
      (product) =>
        (!brandSet || brandSet.has((product.brand ?? '').toLowerCase())) &&
        (query.minPrice === undefined || product.price >= query.minPrice) &&
        (query.maxPrice === undefined || product.price <= query.maxPrice) &&
        (query.minRating === undefined || product.rating >= query.minRating) &&
        (query.inStock === undefined || product.inStock === query.inStock),
    );

    const sorted = [...filtered];
    switch (query.sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'discount':
        sorted.sort((a, b) => b.discountPercentage - a.discountPercentage);
        break;
      default:
        break;
    }

    const total = sorted.length;
    const start = (query.page - 1) * query.limit;

    const brandCounts = new Map<string, number>();
    for (const product of scoped) {
      if (product.brand) {
        brandCounts.set(
          product.brand,
          (brandCounts.get(product.brand) ?? 0) + 1,
        );
      }
    }

    return {
      data: sorted.slice(start, start + query.limit).map(toSummary),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
      facets: {
        price: buildPriceFacet(scoped),
        brands: [...brandCounts]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      },
    };
  }

  async findOne(id: number): Promise<ProductDetail> {
    const { byId } = await this.catalog.getSnapshot();
    const product = byId.get(id);
    if (!product) throw new NotFoundException(`Produk ${id} tidak ditemukan`);
    return product;
  }

  async related(id: number, limit = 8): Promise<Product[]> {
    const product = await this.findOne(id);
    const { products } = await this.catalog.getSnapshot();
    return products
      .filter((item) => item.category === product.category && item.id !== id)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
      .map(toSummary);
  }

  async categories() {
    const { categories, products } = await this.catalog.getSnapshot();
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }
    return categories
      .map((category) => ({
        ...category,
        count: counts.get(category.slug) ?? 0,
      }))
      .filter((category) => category.count > 0);
  }
}
