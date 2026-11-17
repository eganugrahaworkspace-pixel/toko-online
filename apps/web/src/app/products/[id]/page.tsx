import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, PackageCheck, RotateCcw, ShieldCheck, Star, Truck } from 'lucide-react';
import { BuyBox } from '@/components/buy-box';
import { FavoriteButton } from '@/components/product-actions';
import { ProductCard, TopItemBadge } from '@/components/product-card';
import { ProductGallery } from '@/components/product-gallery';
import { ApiError, getProduct, getRelatedProducts } from '@/lib/api';
import { categoryLabel, formatDate, formatPrice } from '@/lib/format';
import type { ProductDetail } from '@/lib/types';
import { toSnapshot } from '@/store/snapshot';

type Params = Promise<{ id: string }>;

async function loadProduct(rawId: string): Promise<ProductDetail> {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  try {
    return await getProduct(id);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await loadProduct((await params).id);
  return {
    title: product.title,
    description: product.description.slice(0, 160),
    openGraph: { images: [product.thumbnail] },
  };
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-4 ${value >= star - 0.25 ? 'fill-amber-400 text-amber-400' : 'fill-line text-line'}`}
          aria-hidden
        />
      ))}
    </span>
  );
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = await loadProduct((await params).id);
  const related = await getRelatedProducts(product.id).catch(() => []);
  const snapshot = toSnapshot(product);

  const facts = [
    { icon: Truck, label: product.shippingInformation },
    { icon: ShieldCheck, label: product.warrantyInformation },
    { icon: RotateCcw, label: product.returnPolicy },
    {
      icon: PackageCheck,
      label: product.inStock ? `Stok tersedia: ${product.stock}` : 'Stok habis',
    },
  ].filter((fact): fact is { icon: typeof Truck; label: string } => Boolean(fact.label));

  return (
    <div className="space-y-8 pb-36 lg:pb-0">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="Kembali ke katalog"
          className="grid size-11 place-items-center rounded-full bg-white shadow-soft transition hover:bg-brand-50"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <p className="text-lg font-bold lg:hidden">Detail</p>
        <FavoriteButton product={snapshot} className="size-11 lg:hidden" />
        <nav aria-label="Breadcrumb" className="hidden flex-1 pl-4 text-sm text-muted lg:block">
          <Link href="/" className="hover:text-brand-500">
            Katalog
          </Link>
          {' / '}
          <Link href={`/?category=${product.category}`} className="hover:text-brand-500">
            {categoryLabel(product.category)}
          </Link>
          {' / '}
          <span className="text-ink">{product.title}</span>
        </nav>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <ProductGallery
          images={product.images}
          title={product.title}
          badge={product.isTopItem ? <TopItemBadge className="text-sm" /> : undefined}
        />

        <div className="space-y-4">
          <div className="rounded-card bg-white p-5 shadow-soft sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
                  {product.brand ?? categoryLabel(product.category)}
                </p>
                <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">{product.title}</h1>
              </div>
              <FavoriteButton product={snapshot} className="hidden size-11 shrink-0 lg:grid" />
            </div>

            <a href="#ulasan" className="mt-3 inline-flex items-center gap-2 text-sm">
              <Stars value={product.rating} />
              <span className="font-semibold">{product.rating.toFixed(1)}</span>
              <span className="text-muted">({product.reviewCount} ulasan)</span>
            </a>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-brand-500">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <>
                  <s className="text-lg text-muted">{formatPrice(product.compareAtPrice)}</s>
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-sm font-bold text-red-600">
                    -{product.discountPercentage}%
                  </span>
                </>
              )}
            </div>

            <p className="mt-4 leading-relaxed text-muted">{product.description}</p>

            {product.tags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-surface px-3 py-1 text-sm">
                    #{tag}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <BuyBox product={snapshot} />

          {facts.length > 0 && (
            <ul className="grid gap-2 rounded-card bg-white p-5 shadow-soft sm:grid-cols-2">
              {facts.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-500">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section id="ulasan" className="scroll-mt-28 rounded-card bg-white p-5 shadow-soft sm:p-6">
        <h2 className="text-xl font-bold">
          Ulasan <span className="text-muted">{product.reviewCount}</span>
        </h2>
        {product.reviews.length === 0 ? (
          <p className="mt-3 text-muted">Belum ada ulasan.</p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {product.reviews.map((review, index) => (
              <li key={`${review.author}-${index}`} className="rounded-2xl bg-surface p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
                    {review.author.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold">{review.author}</p>
                    <p className="text-xs text-muted">{formatDate(review.date)}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <Stars value={review.rating} />
                </div>
                <p className="mt-2">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">Produk serupa</h2>
          <ul className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:gap-5 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:px-0">
            {related.slice(0, 8).map((item) => (
              <li key={item.id} className="w-[46%] shrink-0 snap-start sm:w-[30%] lg:w-auto">
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
