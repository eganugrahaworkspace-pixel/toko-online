'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/format';

function pagesToShow(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, page - 1, page, page + 1]);
  const sorted = [...pages].filter((value) => value >= 1 && value <= total).sort((a, b) => a - b);
  return sorted.flatMap((value, index) =>
    index > 0 && value - sorted[index - 1]! > 1 ? (['…', value] as const) : [value],
  );
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams(searchParams);
    if (target === 1) params.delete('page');
    else params.set('page', String(target));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const arrow = 'grid size-11 place-items-center rounded-full bg-white shadow-soft transition hover:bg-brand-50';

  return (
    <nav aria-label="Halaman" className="flex items-center justify-center gap-1.5 pt-4">
      {page > 1 ? (
        <Link href={href(page - 1)} className={arrow} aria-label="Halaman sebelumnya">
          <ChevronLeft className="size-5" />
        </Link>
      ) : (
        <span className={cn(arrow, 'opacity-40')} aria-hidden>
          <ChevronLeft className="size-5" />
        </span>
      )}
      {pagesToShow(page, totalPages).map((value, index) =>
        value === '…' ? (
          <span key={`gap-${index}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <Link
            key={value}
            href={href(value)}
            aria-current={value === page ? 'page' : undefined}
            className={cn(
              'grid size-11 place-items-center rounded-full text-sm font-semibold transition',
              value === page ? 'bg-brand-500 text-white shadow-float' : 'bg-white shadow-soft hover:bg-brand-50',
            )}
          >
            {value}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={href(page + 1)} className={arrow} aria-label="Halaman berikutnya">
          <ChevronRight className="size-5" />
        </Link>
      ) : (
        <span className={cn(arrow, 'opacity-40')} aria-hidden>
          <ChevronRight className="size-5" />
        </span>
      )}
    </nav>
  );
}
