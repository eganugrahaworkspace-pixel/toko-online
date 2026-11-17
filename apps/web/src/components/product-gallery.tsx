'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/format';

export function ProductGallery({
  images,
  title,
  badge,
}: {
  images: string[];
  title: string;
  badge?: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0]!;

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-card bg-tile">
        <Image
          key={current}
          src={current}
          alt={`${title} — gambar ${active + 1} dari ${images.length}`}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-contain p-8 mix-blend-multiply sm:p-12"
        />
        {badge && <div className="absolute left-4 top-4">{badge}</div>}
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 sm:hidden">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Gambar ${index + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === active ? 'w-5 bg-brand-500' : 'w-1.5 bg-ink/20',
                )}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="scrollbar-none hidden gap-3 overflow-x-auto sm:flex" aria-label="Pilih gambar">
          {images.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Lihat gambar ${index + 1}`}
                aria-current={index === active}
                className={cn(
                  'relative block size-20 overflow-hidden rounded-2xl bg-tile ring-2 transition',
                  index === active ? 'ring-brand-500' : 'ring-transparent hover:ring-brand-200',
                )}
              >
                <Image src={image} alt="" fill sizes="80px" className="object-contain p-2 mix-blend-multiply" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
