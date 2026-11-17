'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

type Patch = Record<string, string | number | boolean | string[] | null | undefined>;

/** Mengubah filter katalog lewat URL, jadi hasil filter bisa dibagikan & di-bookmark. */
export function useCatalogUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    (patch: Patch, { resetPage = true }: { resetPage?: boolean } = {}) => {
      const params = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(patch)) {
        const empty =
          value === null ||
          value === undefined ||
          value === false ||
          value === '' ||
          (Array.isArray(value) && value.length === 0);
        if (empty) params.delete(key);
        else params.set(key, Array.isArray(value) ? value.join(',') : String(value));
      }
      if (resetPage) params.delete('page');
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  return { update, isPending, searchParams };
}
