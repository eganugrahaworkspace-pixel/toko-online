'use client';

import { ChevronDown, Loader2, ShoppingBasket, Tag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { getCartQuote, type QuoteResult } from '@/app/actions';
import { cn, formatPrice } from '@/lib/format';
import type { DeliveryOption } from '@/lib/types';
import { type CartItem, useIsClient, useShop } from '@/store/shop';

function CartLine({ item, unitPrice }: { item: CartItem; unitPrice: number }) {
  const [confirming, setConfirming] = useState(false);
  const setQuantity = useShop((state) => state.setQuantity);
  const removeFromCart = useShop((state) => state.removeFromCart);
  const options = Array.from({ length: Math.max(1, Math.min(item.stock, 10, 99)) }, (_, i) => i + 1);
  if (!options.includes(item.quantity)) options.push(item.quantity);

  if (confirming) {
    return (
      <li className="flex flex-col items-center gap-3 rounded-card bg-white p-5 text-center shadow-soft">
        <p className="flex items-center gap-2 font-semibold">
          <Trash2 className="size-5" aria-hidden />
          Hapus “{item.title}”?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-11 w-28 rounded-full border-2 border-brand-500 font-bold text-brand-500 hover:bg-brand-50"
          >
            Tidak
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => removeFromCart(item.id)}
            className="h-11 w-28 rounded-full bg-brand-500 font-bold text-white shadow-float hover:bg-brand-600"
          >
            Ya
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex gap-4 rounded-card bg-white p-3 shadow-soft sm:p-4">
      <Link
        href={`/products/${item.id}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-tile sm:size-28"
      >
        <Image src={item.thumbnail} alt="" fill sizes="112px" className="object-contain p-2 mix-blend-multiply" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-1">
        <div>
          <Link href={`/products/${item.id}`} className="line-clamp-1 font-semibold hover:text-brand-500">
            {item.title}
          </Link>
          <p className="text-sm text-muted">{item.brand ?? 'Tanpa brand'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border-2 border-brand-500 px-3 py-1 text-sm font-bold text-brand-500">
            {formatPrice(unitPrice)}
          </span>
          <label className="relative ml-auto">
            <span className="sr-only">Jumlah {item.title}</span>
            <select
              value={item.quantity}
              onChange={(event) => setQuantity(item.id, Number(event.target.value))}
              className="h-10 appearance-none rounded-full bg-surface pl-4 pr-8 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              {options.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2" aria-hidden />
          </label>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Hapus ${item.title}`}
            className="grid size-10 place-items-center rounded-full bg-surface text-muted transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

function SummaryRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={cn('flex justify-between', emphasis ? 'text-xl font-extrabold' : 'text-muted')}>
      <dt>{label}</dt>
      <dd className={emphasis ? '' : 'font-medium text-ink'}>{value}</dd>
    </div>
  );
}

export function CartView() {
  const isClient = useIsClient();
  const cart = useShop((state) => state.cart);
  const promoCode = useShop((state) => state.promoCode);
  const delivery = useShop((state) => state.delivery);
  const setPromoCode = useShop((state) => state.setPromoCode);
  const setDelivery = useShop((state) => state.setDelivery);
  const setQuantity = useShop((state) => state.setQuantity);

  const items = useMemo(() => Object.values(cart), [cart]);
  const [promoInput, setPromoInput] = useState(promoCode);
  const [syncedPromo, setSyncedPromo] = useState(promoCode);
  if (promoCode !== syncedPromo) {
    setSyncedPromo(promoCode);
    setPromoInput(promoCode);
  }
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [checkoutNotice, setCheckoutNotice] = useState(false);

  const requestKey = JSON.stringify({
    items: items.map(({ id, quantity }) => ({ productId: id, quantity })),
    promoCode,
    delivery,
  });

  // Hitung ulang total di server setiap kali keranjang, promo, atau pengiriman berubah.
  useEffect(() => {
    if (items.length === 0) return;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const next = await getCartQuote(JSON.parse(requestKey));
        setResult(next);
        if (next.ok) {
          for (const line of next.quote.lines) {
            if (line.adjusted) setQuantity(line.productId, line.quantity);
          }
        }
      });
    }, 250);
    return () => clearTimeout(timer);
    // requestKey sudah mewakili items/promo/delivery.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  if (!isClient) {
    return <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-card bg-white" aria-busy="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto mt-6 flex max-w-md flex-col items-center rounded-card bg-white px-6 py-14 text-center shadow-soft">
        <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand-500">
          <ShoppingBasket className="size-8" aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-bold">Keranjang masih kosong</h1>
        <p className="mt-1 text-muted">Yuk, cari barang yang kamu suka.</p>
        <Link href="/" className="mt-6 rounded-full bg-brand-500 px-6 py-3 font-semibold text-white shadow-float">
          Mulai belanja
        </Link>
      </div>
    );
  }

  const quote = result?.ok ? result.quote : null;
  const priceOf = (id: number, fallback: number) =>
    quote?.lines.find((line) => line.productId === id)?.unitPrice ?? fallback;
  const estimate = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = quote?.total ?? estimate;
  const remainingForFree =
    quote && delivery === 'standard' && quote.shipping > 0
      ? quote.freeShippingThreshold - (quote.subtotal - quote.discount)
      : 0;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-5 text-2xl font-bold">
        Keranjang <span className="text-muted">({items.length})</span>
      </h1>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <ul className="space-y-3">
          {items.map((item) => (
            <CartLine key={item.id} item={item} unitPrice={priceOf(item.id, item.price)} />
          ))}
        </ul>

        <div className="space-y-3 lg:sticky lg:top-28">
          <form
            className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-soft"
            onSubmit={(event) => {
              event.preventDefault();
              setPromoCode(promoInput);
            }}
          >
            <Tag className="size-4 shrink-0 text-muted" aria-hidden />
            <label className="sr-only" htmlFor="promo">
              Kode promo
            </label>
            <input
              id="promo"
              value={promoInput}
              onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
              placeholder="Kode promo (coba HEMAT10)"
              maxLength={32}
              className="min-w-0 flex-1 bg-transparent py-2 text-[15px] uppercase outline-none placeholder:normal-case placeholder:text-muted"
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded-full bg-brand-500 px-5 text-sm font-bold text-white shadow-float hover:bg-brand-600"
            >
              Pakai
            </button>
          </form>
          {quote?.promo && (
            <p
              role="status"
              className={cn('px-5 text-sm font-medium', quote.promo.valid ? 'text-emerald-600' : 'text-red-600')}
            >
              {quote.promo.valid
                ? `Kode ${quote.promo.code} aktif: hemat ${quote.promo.percent}%`
                : `Kode ${quote.promo.code} tidak berlaku`}
            </p>
          )}

          <section className="rounded-card bg-white p-5 shadow-soft" aria-label="Ringkasan belanja">
            <dl className="space-y-2">
              <SummaryRow label="Total" value={formatPrice(total)} emphasis />
              <SummaryRow label="Subtotal" value={formatPrice(quote?.subtotal ?? estimate)} />
              {quote && quote.discount > 0 && (
                <SummaryRow label="Diskon promo" value={`−${formatPrice(quote.discount)}`} />
              )}
              <SummaryRow
                label="Ongkir"
                value={quote ? (quote.shipping === 0 ? 'Gratis' : formatPrice(quote.shipping)) : '—'}
              />
            </dl>

            <fieldset className="mt-4">
              <legend className="mb-2 font-semibold">Opsi pengiriman</legend>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1">
                {(
                  [
                    { value: 'standard', label: 'Standar' },
                    { value: 'pickup', label: 'Ambil sendiri' },
                  ] as { value: DeliveryOption; label: string }[]
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={delivery === option.value}
                    onClick={() => setDelivery(option.value)}
                    className={cn(
                      'h-11 rounded-full text-sm font-semibold transition',
                      delivery === option.value ? 'bg-brand-500 text-white shadow-float' : 'hover:bg-white',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {remainingForFree > 0 && (
                <p className="mt-2 text-sm text-muted">
                  Tambah {formatPrice(remainingForFree)} lagi untuk gratis ongkir.
                </p>
              )}
            </fieldset>

            {result && !result.ok && (
              <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                {result.error}
              </p>
            )}
          </section>

          <button
            type="button"
            onClick={() => setCheckoutNotice(true)}
            disabled={!quote || isPending}
            className="flex h-15 w-full items-center justify-center gap-2 rounded-full bg-brand-500 text-lg font-bold text-white shadow-float transition hover:bg-brand-600 disabled:opacity-70"
          >
            {isPending ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <ShoppingBasket className="size-5" aria-hidden />
            )}
            Checkout · {formatPrice(total)}
          </button>
          {checkoutNotice && (
            <p role="status" className="rounded-2xl bg-brand-50 p-4 text-center text-sm text-brand-800">
              Ini live demo, jadi pembayaran belum diaktifkan. Total di atas sudah dihitung oleh server.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
