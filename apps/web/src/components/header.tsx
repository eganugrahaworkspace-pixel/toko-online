import Link from 'next/link';
import { Suspense } from 'react';
import { Heart } from 'lucide-react';
import { CartLink } from './cart-link';
import { Logo } from './logo';
import { MobileSearchRow, SearchBox } from './search-box';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:gap-8 lg:py-4">
        <Logo className="max-lg:mx-auto" />
        <div className="hidden flex-1 lg:block">
          <Suspense fallback={<div className="h-12 max-w-md rounded-full bg-surface" />}>
            <SearchBox />
          </Suspense>
        </div>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-2 lg:flex">
          <Link
            href="/favorites"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium hover:bg-surface"
          >
            <Heart className="size-5" aria-hidden />
            Favorit
          </Link>
          <CartLink />
        </nav>
      </div>
      <MobileSearchRow>
        <Suspense fallback={<div className="h-12 rounded-full bg-surface" />}>
          <SearchBox />
        </Suspense>
      </MobileSearchRow>
    </header>
  );
}
