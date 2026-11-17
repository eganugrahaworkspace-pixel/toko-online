import Link from 'next/link';
import { PackageSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-card bg-white px-6 py-14 text-center shadow-soft">
      <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand-500">
        <PackageSearch className="size-8" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-bold">Halaman tidak ditemukan</h1>
      <p className="mt-1 text-muted">Produk ini mungkin sudah tidak dijual.</p>
      <Link href="/" className="mt-6 rounded-full bg-brand-500 px-6 py-3 font-semibold text-white shadow-float">
        Kembali belanja
      </Link>
    </div>
  );
}
