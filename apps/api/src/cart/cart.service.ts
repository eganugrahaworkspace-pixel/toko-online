import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CatalogService } from '../catalog/catalog.service.js';
import type { Env } from '../config/env.js';
import type { CartQuoteInput } from './cart.schema.js';

export const FREE_SHIPPING_THRESHOLD_CENTS = 5000;
export const STANDARD_SHIPPING_CENTS = 499;

const toCents = (value: number) => Math.round(value * 100);
const fromCents = (cents: number) => cents / 100;

export interface CartQuote {
  lines: {
    productId: number;
    title: string;
    thumbnail: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    stock: number;
    /** true kalau quantity dikurangi karena stok tidak cukup. */
    adjusted: boolean;
  }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  delivery: CartQuoteInput['delivery'];
  promo: { code: string; valid: boolean; percent: number } | null;
  freeShippingThreshold: number;
}

/**
 * Harga dihitung ulang di server dari katalog. Harga yang dikirim client tidak
 * pernah dipercaya; client hanya mengirim productId dan quantity.
 * Semua aritmetika uang memakai sen (integer) untuk menghindari error floating point.
 */
@Injectable()
export class CartService {
  constructor(
    private readonly catalog: CatalogService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async quote(input: CartQuoteInput): Promise<CartQuote> {
    const { byId } = await this.catalog.getSnapshot();

    // Gabungkan item duplikat.
    const quantities = new Map<number, number>();
    for (const item of input.items) {
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.quantity,
      );
    }

    const missing = [...quantities.keys()].filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw new UnprocessableEntityException({
        message: 'Sebagian produk tidak ditemukan',
        missingProductIds: missing,
      });
    }

    const lines = [...quantities].map(([productId, requested]) => {
      const product = byId.get(productId)!;
      const quantity = Math.min(requested, 99, product.stock);
      const unitCents = toCents(product.price);
      return {
        productId,
        title: product.title,
        thumbnail: product.thumbnail,
        unitPrice: fromCents(unitCents),
        quantity,
        lineTotalCents: unitCents * quantity,
        stock: product.stock,
        adjusted: quantity !== requested,
      };
    });

    const subtotalCents = lines.reduce(
      (sum, line) => sum + line.lineTotalCents,
      0,
    );

    let promo: CartQuote['promo'] = null;
    let discountCents = 0;
    if (input.promoCode) {
      const percent = this.config
        .get('PROMO_CODES', { infer: true })
        .get(input.promoCode);
      promo = {
        code: input.promoCode,
        valid: percent !== undefined,
        percent: percent ?? 0,
      };
      if (percent) discountCents = Math.round((subtotalCents * percent) / 100);
    }

    const afterDiscount = subtotalCents - discountCents;
    const shippingCents =
      input.delivery === 'pickup' ||
      afterDiscount === 0 ||
      afterDiscount >= FREE_SHIPPING_THRESHOLD_CENTS
        ? 0
        : STANDARD_SHIPPING_CENTS;

    return {
      lines: lines.map(({ lineTotalCents, ...line }) => ({
        ...line,
        lineTotal: fromCents(lineTotalCents),
      })),
      subtotal: fromCents(subtotalCents),
      discount: fromCents(discountCents),
      shipping: fromCents(shippingCents),
      total: fromCents(afterDiscount + shippingCents),
      delivery: input.delivery,
      promo,
      freeShippingThreshold: fromCents(FREE_SHIPPING_THRESHOLD_CENTS),
    };
  }
}
