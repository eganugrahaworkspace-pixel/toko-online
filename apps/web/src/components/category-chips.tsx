import Link from 'next/link';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/format';

function hrefFor(category: string | null, q?: string) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

/** Chip kategori yang bisa digeser; filter lain di-reset saat ganti kategori. */
export function CategoryChips({
  categories,
  active,
  q,
}: {
  categories: Category[];
  active?: string;
  q?: string;
}) {
  const chips = [{ slug: null, name: 'Semua Kategori' }, ...categories];

  return (
    <nav aria-label="Kategori" className="-mx-4 sm:-mx-6 lg:mx-0">
      <ul className="scrollbar-none flex snap-x gap-2.5 overflow-x-auto px-4 py-1 sm:px-6 lg:flex-wrap lg:px-0">
        {chips.map((chip) => {
          const isActive = (chip.slug ?? undefined) === active;
          return (
            <li key={chip.slug ?? 'all'} className="snap-start">
              <Link
                href={hrefFor(chip.slug, q)}
                scroll={false}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'block whitespace-nowrap rounded-full px-5 py-2.5 text-[15px] font-medium transition',
                  isActive
                    ? 'bg-brand-500 text-white shadow-float'
                    : 'bg-white text-ink shadow-soft hover:bg-brand-50 hover:text-brand-600',
                )}
              >
                {chip.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
