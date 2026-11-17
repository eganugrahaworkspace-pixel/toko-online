import Link from 'next/link';
import { cn } from '@/lib/format';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Toko — beranda"
      className={cn('inline-flex items-center gap-2 text-ink', className)}
    >
      <span className="grid size-9 place-items-center rounded-xl bg-brand-500 text-white shadow-float">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
          <path
            d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9 8V7a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="2" />
        </svg>
      </span>
      <span className="text-xl font-extrabold tracking-tight">
        toko<span className="text-brand-500">.</span>
      </span>
    </Link>
  );
}
