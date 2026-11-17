'use client';

import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQ = pathname === '/' ? (searchParams.get('q') ?? '') : '';
  const [value, setValue] = useState(currentQ);
  const [syncedQ, setSyncedQ] = useState(currentQ);

  // Sinkronkan input saat URL berubah (mis. tombol back).
  if (currentQ !== syncedQ) {
    setSyncedQ(currentQ);
    setValue(currentQ);
  }

  function submit(next: string) {
    const params = new URLSearchParams(pathname === '/' ? searchParams : undefined);
    const q = next.trim();
    if (q) params.set('q', q);
    else params.delete('q');
    params.delete('page');
    const query = params.toString();
    router.push(query ? `/?${query}` : '/');
  }

  return (
    <form
      role="search"
      className="relative max-w-md"
      onSubmit={(event) => {
        event.preventDefault();
        submit(value);
      }}
    >
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Cari produk, brand, kategori…"
        aria-label="Cari produk"
        maxLength={100}
        className="h-12 w-full rounded-full bg-surface pl-12 pr-11 text-[15px] outline-none ring-brand-300 transition placeholder:text-muted focus:bg-white focus:ring-2 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue('');
            if (currentQ) submit('');
          }}
          aria-label="Hapus pencarian"
          className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-line"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  );
}

/** Di mobile, kolom pencarian hanya tampil di beranda (seperti desain referensi). */
export function MobileSearchRow({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname !== '/') return null;
  return <div className="px-4 pb-3 sm:px-6 lg:hidden">{children}</div>;
}
