'use client';

import { Check, Star } from 'lucide-react';
import { useState } from 'react';
import { cn, formatPrice } from '@/lib/format';
import type { CatalogFilters } from '@/lib/search-params';
import type { ProductList } from '@/lib/types';
import { useCatalogUrl } from '@/lib/use-catalog-url';
import { PriceRange } from './price-range';

const VISIBLE_BRANDS = 7;

function Section({
  title,
  onReset,
  children,
}: {
  title: string;
  onReset?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card bg-white p-5 shadow-soft ring-1 ring-black/[0.03]">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        {onReset && (
          <button type="button" onClick={onReset} className="text-sm text-muted hover:text-brand-500">
            Reset
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export function FilterPanel({
  filters,
  facets,
}: {
  filters: CatalogFilters;
  facets: ProductList['facets'];
}) {
  const { update } = useCatalogUrl();
  const [showAllBrands, setShowAllBrands] = useState(false);
  const selectedBrands = new Set(filters.brands.map((brand) => brand.toLowerCase()));
  const brands = showAllBrands ? facets.brands : facets.brands.slice(0, VISIBLE_BRANDS);
  const priceActive = filters.minPrice !== undefined || filters.maxPrice !== undefined;

  const toggleBrand = (name: string) => {
    const next = selectedBrands.has(name.toLowerCase())
      ? filters.brands.filter((brand) => brand.toLowerCase() !== name.toLowerCase())
      : [...filters.brands, name];
    update({ brands: next });
  };

  return (
    <div className="space-y-3">
      {facets.price.max > facets.price.min && (
        <Section
          title="Rentang Harga"
          onReset={priceActive ? () => update({ minPrice: null, maxPrice: null }) : undefined}
        >
          <p className="mt-0.5 text-sm text-muted">
            Rata-rata harga {formatPrice(facets.price.average)}
          </p>
          <PriceRange
            facet={facets.price}
            value={{ min: filters.minPrice, max: filters.maxPrice }}
            onCommit={({ min, max }) => update({ minPrice: min, maxPrice: max })}
          />
        </Section>
      )}

      <Section
        title="Rating"
        onReset={filters.minRating ? () => update({ minRating: null }) : undefined}
      >
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex" role="radiogroup" aria-label="Rating minimum">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = (filters.minRating ?? 0) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={filters.minRating === star}
                  aria-label={`${star} bintang ke atas`}
                  onClick={() => update({ minRating: filters.minRating === star ? null : star })}
                  className="p-0.5 transition hover:scale-110"
                >
                  <Star
                    className={cn('size-7', filled ? 'fill-amber-400 text-amber-400' : 'fill-line text-line')}
                  />
                </button>
              );
            })}
          </div>
          <span className="text-sm text-muted">
            {filters.minRating ? `${filters.minRating} bintang ke atas` : 'Semua rating'}
          </span>
        </div>
      </Section>

      {facets.brands.length > 0 && (
        <Section
          title="Brand"
          onReset={filters.brands.length ? () => update({ brands: null }) : undefined}
        >
          <ul className="mt-3 space-y-1">
            {brands.map((brand) => {
              const checked = selectedBrands.has(brand.name.toLowerCase());
              return (
                <li key={brand.name}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-2 hover:bg-surface">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-xs font-bold text-brand-600">
                      {brand.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="flex-1 truncate text-[15px]">{brand.name}</span>
                    <span className="text-xs text-muted">{brand.count}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBrand(brand.name)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden
                      className={cn(
                        'grid size-7 place-items-center rounded-lg border-2 transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500',
                        checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-brand-200 bg-white',
                      )}
                    >
                      {checked && <Check className="size-4" strokeWidth={3} />}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {facets.brands.length > VISIBLE_BRANDS && (
            <button
              type="button"
              onClick={() => setShowAllBrands((value) => !value)}
              className="mt-2 text-sm font-medium text-brand-500 hover:underline"
            >
              {showAllBrands ? 'Tampilkan lebih sedikit' : `Lihat semua brand (${facets.brands.length})`}
            </button>
          )}
        </Section>
      )}

      <Section title="Ketersediaan">
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-surface p-1">
          {[
            { label: 'Semua', value: false },
            { label: 'Ada stok', value: true },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={filters.inStock === option.value}
              onClick={() => update({ inStock: option.value })}
              className={cn(
                'h-11 rounded-full text-[15px] font-semibold transition',
                filters.inStock === option.value ? 'bg-brand-500 text-white shadow-float' : 'text-ink hover:bg-white',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
