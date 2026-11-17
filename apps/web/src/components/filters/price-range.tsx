'use client';

import { useEffect, useRef, useState } from 'react';
import type { PriceFacet } from '@/lib/types';
import { formatPrice } from '@/lib/format';

interface Props {
  facet: PriceFacet;
  value: { min?: number; max?: number };
  onCommit: (range: { min?: number; max?: number }) => void;
}

const STEPS = 1000;

const compact = (value: number) =>
  value >= 1000 ? `$${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k` : `$${Math.round(value)}`;

/**
 * Slider dua sisi + histogram, seperti desain referensi. Posisi slider memakai
 * skala logaritmik yang sama dengan histogram dari API, jadi rentang $1–$100
 * yang paling padat tetap mudah dipilih walau ada produk seharga ribuan dolar.
 */
export function PriceRange({ facet, value, onCommit }: Props) {
  const logMin = Math.log1p(facet.min);
  const logSpan = Math.max(Math.log1p(facet.max) - logMin, Number.EPSILON);
  const toPrice = (position: number) => Math.expm1(logMin + (position / STEPS) * logSpan);
  const toPosition = (price: number) =>
    Math.round(((Math.log1p(Math.min(Math.max(price, facet.min), facet.max)) - logMin) / logSpan) * STEPS);

  const lowPos = value.min === undefined ? 0 : toPosition(value.min);
  const highPos = value.max === undefined ? STEPS : toPosition(value.max);
  const [draft, setDraft] = useState({ low: lowPos, high: highPos });
  const [synced, setSynced] = useState({ low: lowPos, high: highPos });

  // Sinkronkan saat URL berubah dari luar (reset, ganti kategori).
  if (synced.low !== lowPos || synced.high !== highPos) {
    setSynced({ low: lowPos, high: highPos });
    setDraft({ low: lowPos, high: highPos });
  }

  const lowPrice = Math.floor(toPrice(draft.low));
  const highPrice = Math.ceil(toPrice(draft.high));
  const peak = Math.max(...facet.histogram, 1);
  const pct = (position: number) => (position / STEPS) * 100;

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const commit = (next = draft) => {
    clearTimeout(timer.current);
    const low = Math.floor(toPrice(next.low));
    const high = Math.ceil(toPrice(next.high));
    onCommit({
      min: next.low <= 0 || low <= facet.min ? undefined : low,
      max: next.high >= STEPS || high >= facet.max ? undefined : high,
    });
  };

  // Keyboard & geser: tunggu pengguna berhenti dulu agar tidak memicu banyak request.
  const change = (next: { low: number; high: number }) => {
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), 450);
  };

  const bubbles = [
    { key: 'low', position: draft.low, label: compact(lowPrice) },
    { key: 'high', position: draft.high, label: compact(highPrice) },
  ];

  return (
    <div>
      <div className="relative mt-10 h-24" aria-hidden>
        <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-[3px]">
          {facet.histogram.map((count, index) => {
            const start = (index / facet.histogram.length) * STEPS;
            const end = ((index + 1) / facet.histogram.length) * STEPS;
            const inRange = end > draft.low && start < draft.high;
            return (
              <div
                key={index}
                className={`flex-1 rounded-t-md transition-colors ${inRange ? 'bg-brand-300' : 'bg-brand-100'}`}
                style={{ height: `${count === 0 ? 4 : Math.max(10, (count / peak) * 100)}%` }}
              />
            );
          })}
        </div>
        {bubbles.map((bubble) => (
          <span
            key={bubble.key}
            className="absolute -top-9 -translate-x-1/2 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-ink after:content-['']"
            style={{ left: `clamp(1.5rem, ${pct(bubble.position)}%, calc(100% - 1.5rem))` }}
          >
            {bubble.label}
          </span>
        ))}
      </div>

      <div className="relative mt-1 h-5">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-500"
          style={{ left: `${pct(draft.low)}%`, right: `${100 - pct(draft.high)}%` }}
        />
        <input
          type="range"
          min={0}
          max={STEPS}
          value={draft.low}
          aria-label="Harga minimum"
          aria-valuetext={formatPrice(lowPrice)}
          onChange={(event) =>
            change({ ...draft, low: Math.min(Number(event.target.value), draft.high - 10) })
          }
          onPointerUp={() => commit()}
          className="range-thumb absolute inset-0 h-5 w-full"
        />
        <input
          type="range"
          min={0}
          max={STEPS}
          value={draft.high}
          aria-label="Harga maksimum"
          aria-valuetext={formatPrice(highPrice)}
          onChange={(event) =>
            change({ ...draft, high: Math.max(Number(event.target.value), draft.low + 10) })
          }
          onPointerUp={() => commit()}
          className="range-thumb absolute inset-0 h-5 w-full"
        />
      </div>
    </div>
  );
}
