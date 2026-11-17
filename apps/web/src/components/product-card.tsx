import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { type ProductSnapshot, toSnapshot } from '@/store/snapshot';
import { AddToCartPill, FavoriteButton } from './product-actions';

export function TopItemBadge({ className }: { className?: string }) {
  return (
    <span
      className={`rounded-full bg-sun px-3 py-1 text-xs font-bold text-ink shadow-sm ${className ?? ''}`}
    >
      Top item
    </span>
  );
}

export function ProductCard({
  product,
  rating,
  priority = false,
}: {
  product: ProductSnapshot;
  rating?: number;
  priority?: boolean;
}) {
  const href = `/products/${product.id}`;
  // Kirim hanya field yang dibutuhkan ke komponen client.
  const snapshot = toSnapshot(product);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-black/[0.03] transition duration-300 hover:-translate-y-1 hover:shadow-float">
      <div className="relative aspect-square bg-tile">
        <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0">
          <Image
            src={product.thumbnail}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 45vw, 50vw"
            className="object-contain p-6 mix-blend-multiply transition duration-500 group-hover:scale-105 sm:p-8"
          />
        </Link>
        <FavoriteButton product={snapshot} className="absolute right-3 top-3 z-20 size-9 sm:right-4 sm:top-4 sm:size-10" />
        {rating !== undefined && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold backdrop-blur sm:left-4 sm:top-4">
            {rating.toFixed(1)}
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
            <span className="sr-only">dari 5</span>
          </span>
        )}
        {product.isTopItem && (
          <TopItemBadge className="absolute -bottom-3 left-1/2 z-10 -translate-x-1/2" />
        )}
      </div>

      <div className="flex flex-1 flex-col items-center gap-3 px-3 pb-4 pt-6 text-center sm:px-5 sm:pb-5">
        <h3 className="line-clamp-2 min-h-[2.6em] text-sm font-semibold leading-snug sm:line-clamp-1 sm:min-h-0 sm:text-[17px]">
          <Link href={href} className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline">
            {product.title}
          </Link>
        </h3>
        <div className="relative z-10 mt-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {product.compareAtPrice && (
            <s className="text-sm font-medium text-muted">
              <span className="sr-only">Harga sebelum diskon </span>
              {formatPrice(product.compareAtPrice)}
            </s>
          )}
          <AddToCartPill product={snapshot} />
        </div>
      </div>
    </article>
  );
}
