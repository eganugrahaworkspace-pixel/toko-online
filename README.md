# toko. — Toko Online (Next.js + NestJS)

Demo toko online dengan **frontend Next.js 16** dan **backend NestJS 12** yang terpisah.
Data produk diambil dari [DummyJSON](https://dummyjson.com/docs/products) (194 produk) lewat backend.

Live demo: https://toko-online-jade.vercel.app

## Arsitektur

```
Browser ──► Next.js (Vercel, apps/web) ──x-api-key──► NestJS (Render, apps/api) ──► DummyJSON
            Server Components & Server Actions         guard, validasi, cache, rate limit
```

- **API key tidak pernah sampai ke browser.** Semua panggilan ke backend terjadi di server
  Next.js (`src/lib/api.ts` memakai `server-only`, jadi build gagal kalau ada komponen client yang
  meng-import-nya). Variabel env tidak memakai prefix `NEXT_PUBLIC_`.
- **Harga dihitung ulang di server.** Keranjang hanya mengirim `productId` + `quantity` ke
  `POST /v1/cart/quote`; harga, diskon promo, dan ongkir dihitung backend dalam satuan sen (integer).
- **Backend tahan gangguan upstream.** Katalog di-cache di memori (TTL), memakai *single-flight*
  untuk request bersamaan, dan tetap menyajikan data lama kalau DummyJSON sedang down.

## Fitur

| | |
|---|---|
| Katalog | Chip kategori, pencarian, filter harga (slider + histogram skala log), rating, brand, stok, sort, paginasi. Semua filter tersimpan di URL. |
| Detail | Galeri gambar, badge *Top item*, harga coret, ulasan, produk serupa, bar beli menempel di mobile. |
| Keranjang | Ubah jumlah, konfirmasi hapus, kode promo (`HEMAT10`), opsi pengiriman, total dari server. |
| Favorit | Disimpan di `localStorage`. |

## Backend API (`apps/api`)

Semua endpoint `/v1/*` wajib header `x-api-key`. Dokumentasi Swagger di `/docs` (non-production).

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/health` | Publik, untuk health check |
| GET | `/v1/products` | `q, category, brands, minPrice, maxPrice, minRating, inStock, sort, page, limit` → `data`, `meta`, `facets` |
| GET | `/v1/products/:id` | Detail + ulasan (email reviewer dibuang) |
| GET | `/v1/products/:id/related` | Produk sekategori |
| GET | `/v1/categories` | Kategori + jumlah produk |
| POST | `/v1/cart/quote` | `{ items: [{productId, quantity}], promoCode?, delivery }` |

Keamanan: perbandingan key konstan-waktu (`timingSafeEqual`), dukungan beberapa key untuk rotasi
tanpa downtime, validasi Zod untuk env/query/body, `helmet`, CORS terbatas, rate limit per pengunjung.

## Menjalankan lokal

Butuh Node.js 22+.

```bash
npm run install:all

# 1. Backend
cp apps/api/.env.example apps/api/.env
# isi API_KEYS, contoh: openssl rand -hex 32
npm run dev:api            # http://localhost:4000, Swagger di /docs

# 2. Frontend (terminal lain)
cp apps/web/.env.example apps/web/.env.local
# API_KEY = salah satu nilai API_KEYS di backend
npm run dev:web            # http://localhost:3000
```

Test backend (upstream di-mock): `npm test`

## Deploy

### Opsi A: Render (backend + frontend sekaligus)

1. Render → **New → Blueprint** → pilih repo ini (`render.yaml`).
2. Saat diminta nilai `API_BASE_URL`, isi `https://toko-online-api.onrender.com`
   (cek URL asli backend di dashboard Render setelah dibuat; ubah kalau berbeda).
3. `API_KEY` di frontend otomatis disamakan dengan `API_KEYS` di backend.

> Paket gratis Render tidur setelah idle, jadi request pertama bisa lambat ~30–60 detik.
> Halaman error frontend sudah menangani ini dengan tombol "Coba lagi".

### Opsi B: Vercel

- **Backend**: project baru, Root Directory `apps/api` (NestJS terdeteksi otomatis),
  env `API_KEYS` (hasil `openssl rand -hex 32`) dan `NODE_ENV=production`.
- **Frontend**: Root Directory `apps/web`, Node.js 22+, env `API_BASE_URL` (URL backend)
  dan `API_KEY` (salah satu nilai `API_KEYS`).

## Tech stack

Next.js 16 · React 19 · Tailwind CSS 4 · Zustand · Zod · NestJS 12 · Vitest · Supertest
