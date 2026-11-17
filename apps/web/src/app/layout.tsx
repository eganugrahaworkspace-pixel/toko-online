import type { Metadata, Viewport } from 'next';
import { BottomNav } from '@/components/bottom-nav';
import { Header } from '@/components/header';
import { StoreHydrator } from '@/components/store-hydrator';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Toko — Belanja semua kebutuhan', template: '%s · Toko' },
  description:
    'Demo toko online: Next.js 16 + NestJS. Katalog dengan filter harga, rating, dan brand, keranjang dengan perhitungan harga di server.',
};

export const viewport: Viewport = {
  themeColor: '#f1f2f6',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-dvh font-sans">
        <StoreHydrator />
        <Header />
        <main className="mx-auto w-full max-w-7xl px-4 pb-32 pt-4 sm:px-6 lg:pb-16 lg:pt-6">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
