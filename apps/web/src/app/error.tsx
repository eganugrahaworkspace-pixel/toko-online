'use client';

import { RefreshCw, ServerCrash } from 'lucide-react';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-card bg-white px-6 py-14 text-center shadow-soft">
      <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand-500">
        <ServerCrash className="size-8" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-bold">Toko sedang tidak bisa dimuat</h1>
      <p className="mt-1 text-muted">
        Server sedang sibuk atau baru bangun. Biasanya beres dalam beberapa detik.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 font-semibold text-white shadow-float"
      >
        <RefreshCw className="size-4" aria-hidden />
        Coba lagi
      </button>
      {error.digest && <p className="mt-4 text-xs text-muted">Kode: {error.digest}</p>}
    </div>
  );
}
