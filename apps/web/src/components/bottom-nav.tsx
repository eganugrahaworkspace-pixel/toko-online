'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, House, ShoppingBasket } from 'lucide-react';
import { cn } from '@/lib/format';
import { CartBadge } from './cart-link';

const ITEMS = [
  { href: '/', label: 'Beranda', icon: House, match: (path: string) => path === '/' || path.startsWith('/products') },
  { href: '/favorites', label: 'Favorit', icon: Heart, match: (path: string) => path === '/favorites' },
  { href: '/cart', label: 'Keranjang', icon: ShoppingBasket, match: (path: string) => path === '/cart' },
];

/** Navigasi bawah mengambang untuk mobile, mengikuti desain referensi. */
export function BottomNav() {
  const pathname = usePathname();
  // Halaman detail memakai bar beli sendiri di bawah layar.
  if (pathname.startsWith('/products/')) return null;

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="flex items-center gap-1 rounded-full bg-white/95 p-1.5 shadow-soft ring-1 ring-line backdrop-blur">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                className={cn(
                  'flex h-12 items-center gap-2 rounded-full transition-all',
                  active ? 'bg-brand-500 px-5 text-white shadow-float' : 'w-12 justify-center text-ink hover:bg-surface',
                )}
              >
                <span className="relative">
                  <Icon className="size-[22px]" aria-hidden />
                  {href === '/cart' && <CartBadge className="-right-2 -top-2" />}
                </span>
                {active && <span className="text-sm font-semibold">{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
