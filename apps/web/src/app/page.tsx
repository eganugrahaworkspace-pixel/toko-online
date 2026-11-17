import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { CategoryChips } from '@/components/category-chips';
import { CatalogToolbar } from '@/components/filters/catalog-toolbar';
import { FilterPanel } from '@/components/filters/filter-panel';
import { Pagination } from '@/components/pagination';
import { ProductCard } from '@/components/product-card';
import { getCategories, getProducts } from '@/lib/api';
import { categoryLabel } from '@/lib/format';
import { hasActiveFilters, parseCatalogParams } from '@/lib/search-params';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const filters = parseCatalogParams(await searchParams);
  if (filters.q) return { title: `Hasil untuk “${filters.q}”` };
  if (filters.category) return { title: categoryLabel(filters.category) };
  return {};
}

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseCatalogParams(await searchParams);
  const [categories, result] = await Promise.all([getCategories(), getProducts(filters)]);

  const activeCategory = categories.find((category) => category.slug === filters.category);
  const heading = filters.q
    ? `Hasil untuk “${filters.q}”`
    : (activeCategory?.name ?? 'Semua Produk');

  return (
    <div className="space-y-5 lg:space-y-6">
      <CategoryChips categories={categories} active={filters.category} q={filters.q} />

      <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="hidden lg:sticky lg:top-28 lg:block" aria-label="Filter produk">
          <FilterPanel filters={filters} facets={result.facets} />
        </aside>

        <section className="space-y-5" aria-label="Daftar produk">
          <CatalogToolbar
            filters={filters}
            facets={result.facets}
            total={result.meta.total}
            heading={heading}
          />

          {result.data.length === 0 ? (
            <div className="flex flex-col items-center rounded-card bg-white px-6 py-16 text-center shadow-soft">
              <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand-500">
                <SearchX className="size-8" aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-bold">Produk tidak ditemukan</h2>
              <p className="mt-1 max-w-sm text-muted">
                Coba kata kunci lain atau longgarkan filter harga, rating, dan brand.
              </p>
              {(hasActiveFilters(filters) || filters.q) && (
                <Link
                  href={filters.category ? `/?category=${encodeURIComponent(filters.category)}` : '/'}
                  className="mt-6 rounded-full bg-brand-500 px-6 py-3 font-semibold text-white shadow-float"
                >
                  Reset filter
                </Link>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {result.data.map((product, index) => (
                <li key={product.id}>
                  <ProductCard product={product} rating={product.rating} priority={index < 3} />
                </li>
              ))}
            </ul>
          )}

          <Pagination page={result.meta.page} totalPages={result.meta.totalPages} />
        </section>
      </div>
    </div>
  );
}
