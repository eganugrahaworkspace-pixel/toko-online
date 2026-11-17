'use client';

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ChevronDown, Loader2, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { type CatalogFilters, SORT_OPTIONS } from '@/lib/search-params';
import type { ProductList } from '@/lib/types';
import { useCatalogUrl } from '@/lib/use-catalog-url';
import { FilterPanel } from './filter-panel';

function activeCount(filters: CatalogFilters) {
  return (
    filters.brands.length +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.inStock ? 1 : 0)
  );
}

export function CatalogToolbar({
  filters,
  facets,
  total,
  heading,
}: {
  filters: CatalogFilters;
  facets: ProductList['facets'];
  total: number;
  heading: string;
}) {
  const { update, isPending } = useCatalogUrl();
  const [open, setOpen] = useState(false);
  const count = activeCount(filters);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold sm:text-2xl">{heading}</h1>
        <p className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
          {total} produk
          {isPending && <Loader2 className="size-4 animate-spin text-brand-500" aria-label="Memuat" />}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold shadow-soft lg:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filter
          {count > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-brand-500 text-[11px] text-white">
              {count}
            </span>
          )}
        </button>

        <label className="relative">
          <span className="sr-only">Urutkan</span>
          <select
            value={filters.sort}
            onChange={(event) => update({ sort: event.target.value === 'relevance' ? null : event.target.value })}
            className="h-11 appearance-none rounded-full bg-white pl-4 pr-10 text-sm font-semibold shadow-soft outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2" aria-hidden />
        </label>
      </div>

      <Dialog open={open} onClose={setOpen} className="relative z-50 lg:hidden">
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm" aria-hidden />
        <div className="fixed inset-x-0 bottom-0 flex max-h-[88dvh] flex-col">
          <DialogPanel className="flex min-h-0 flex-col rounded-t-[2rem] bg-surface">
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <DialogTitle className="text-lg font-bold">Filter</DialogTitle>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup filter"
                className="grid size-10 place-items-center rounded-full bg-white shadow-soft"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto px-4 pb-4">
              <FilterPanel filters={filters} facets={facets} />
            </div>
            <div className="border-t border-line bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand-500 text-base font-bold text-white shadow-float"
              >
                {isPending && <Loader2 className="size-5 animate-spin" aria-hidden />}
                Lihat {total} produk
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
