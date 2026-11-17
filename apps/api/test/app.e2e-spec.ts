import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { mockUpstreamFetch } from './fixtures.js';

const API_KEY = 'test-key-0123456789abcdef0123456789abcdef';

describe('Toko Online API (e2e)', () => {
  let app: INestApplication<App>;
  let fetchMock: ReturnType<typeof mockUpstreamFetch>;

  beforeAll(async () => {
    fetchMock = mockUpstreamFetch();
    vi.stubGlobal('fetch', fetchMock);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    vi.unstubAllGlobals();
  });

  const api = () => request(app.getHttpServer());

  describe('autentikasi', () => {
    it('health check publik', () => api().get('/health').expect(200));

    it('menolak request tanpa API key', () =>
      api().get('/v1/products').expect(401));

    it('menolak API key yang salah', () =>
      api().get('/v1/products').set('x-api-key', 'salah').expect(401));

    it('menerima key kedua (rotasi key)', () =>
      api()
        .get('/v1/categories')
        .set('x-api-key', 'another-key-0123456789abcdef01234567')
        .expect(200));
  });

  describe('GET /v1/products', () => {
    it('mengembalikan data, meta, dan facet', async () => {
      const res = await api()
        .get('/v1/products')
        .set('x-api-key', API_KEY)
        .expect(200);
      expect(res.body.meta).toMatchObject({ total: 3, page: 1, totalPages: 1 });
      expect(res.body.facets.price.histogram).toHaveLength(24);
      expect(res.body.facets.brands).toEqual(
        expect.arrayContaining([{ name: 'Knoll', count: 1 }]),
      );
      // Ringkasan tidak membawa ulasan.
      expect(res.body.data[0].reviews).toBeUndefined();
    });

    it('menghitung harga coret dan top item', async () => {
      const res = await api()
        .get('/v1/products/2')
        .set('x-api-key', API_KEY)
        .expect(200);
      expect(res.body.isTopItem).toBe(true);
      expect(res.body.compareAtPrice).toBe(510.25);
      expect(res.body.images).toEqual([res.body.thumbnail]);
    });

    it('tidak membocorkan email reviewer', async () => {
      const res = await api()
        .get('/v1/products/1')
        .set('x-api-key', API_KEY)
        .expect(200);
      expect(JSON.stringify(res.body)).not.toContain('@x.dummyjson.com');
      expect(res.body.reviews[0].author).toBe('Eleanor Collins');
    });

    it('filter kategori, harga, dan sort', async () => {
      const res = await api()
        .get('/v1/products?minPrice=1&maxPrice=100&sort=price-desc')
        .set('x-api-key', API_KEY)
        .expect(200);
      expect(res.body.data.map((p: { id: number }) => p.id)).toEqual([1, 3]);
    });

    it('validasi query yang salah -> 400', async () => {
      await api()
        .get('/v1/products?minPrice=50&maxPrice=10')
        .set('x-api-key', API_KEY)
        .expect(400);
      await api()
        .get('/v1/products?sort=hack')
        .set('x-api-key', API_KEY)
        .expect(400);
      await api()
        .get('/v1/products?limit=1000')
        .set('x-api-key', API_KEY)
        .expect(400);
    });

    it('produk tidak ada -> 404, id tidak valid -> 400', async () => {
      await api().get('/v1/products/999').set('x-api-key', API_KEY).expect(404);
      await api().get('/v1/products/abc').set('x-api-key', API_KEY).expect(400);
    });

    it('kategori tanpa produk disembunyikan', async () => {
      const res = await api()
        .get('/v1/categories')
        .set('x-api-key', API_KEY)
        .expect(200);
      expect(res.body.map((c: { slug: string }) => c.slug)).toEqual([
        'beauty',
        'furniture',
        'groceries',
      ]);
    });

    it('upstream di-cache (single fetch)', () => {
      // 2 panggilan: /products dan /products/categories, sekali saja.
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST /v1/cart/quote', () => {
    const quote = (body: object) =>
      api().post('/v1/cart/quote').set('x-api-key', API_KEY).send(body);

    it('menghitung total di server dengan promo dan ongkir', async () => {
      const res = await quote({
        items: [
          { productId: 1, quantity: 2 },
          { productId: 1, quantity: 1 },
          { productId: 3, quantity: 1 },
        ],
        promoCode: 'hemat10',
      }).expect(200);

      // 3 x 9.99 + 2.49 = 32.46; diskon 10% = 3.25; ongkir 4.99 (di bawah $50)
      expect(res.body).toMatchObject({
        subtotal: 32.46,
        discount: 3.25,
        shipping: 4.99,
        total: 34.2,
        promo: { code: 'HEMAT10', valid: true, percent: 10 },
      });
      expect(res.body.lines).toHaveLength(2);
    });

    it('membatasi quantity sesuai stok dan gratis ongkir', async () => {
      const res = await quote({
        items: [{ productId: 2, quantity: 5 }],
      }).expect(200);
      expect(res.body.lines[0]).toMatchObject({ quantity: 2, adjusted: true });
      expect(res.body.shipping).toBe(0);
    });

    it('promo tidak dikenal ditandai tidak valid', async () => {
      const res = await quote({
        items: [{ productId: 3, quantity: 1 }],
        promoCode: 'NGAWUR',
        delivery: 'pickup',
      }).expect(200);
      expect(res.body.promo).toMatchObject({ valid: false });
      expect(res.body.discount).toBe(0);
      expect(res.body.shipping).toBe(0);
    });

    it('mengabaikan harga dari client dan menolak body tidak valid', async () => {
      await quote({ items: [] }).expect(400);
      await quote({ items: [{ productId: 1, quantity: 0 }] }).expect(400);
      await quote({ items: [{ productId: 999, quantity: 1 }] }).expect(422);
    });
  });
});
