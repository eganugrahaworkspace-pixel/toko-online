import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import type { Env } from '../config/env.js';
import { IS_PUBLIC_KEY } from './auth/public.decorator.js';

/** Header yang dikirim server Next.js berisi IP pengunjung asli. */
export const CLIENT_IP_HEADER = 'x-client-ip';

const MAX_TRACKED_CLIENTS = 10_000;

/**
 * Rate limit fixed-window di memori. Pengganti @nestjs/throttler, yang masih
 * CommonJS dan gagal dimuat bersama NestJS 12 (ESM-only) di runtime Vercel.
 *
 * Catatan: di serverless, memori tidak dibagi antar instance, jadi batasnya
 * berlaku per instance. Untuk limit global, simpan counter di Redis/KV.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService<Env, true>,
  ) {
    this.limit = config.get('THROTTLE_LIMIT', { infer: true });
    this.windowMs = config.get('THROTTLE_TTL_MS', { infer: true });
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    // Header klien hanya dipercaya karena ApiKeyGuard sudah lolos lebih dulu.
    const tracker = request.header(CLIENT_IP_HEADER) ?? request.ip ?? 'unknown';

    const now = Date.now();
    let entry = this.hits.get(tracker);
    if (!entry || entry.resetAt <= now) {
      if (this.hits.size >= MAX_TRACKED_CLIENTS) this.evictExpired(now);
      entry = { count: 0, resetAt: now + this.windowMs };
      this.hits.set(tracker, entry);
    }
    entry.count += 1;

    const remaining = Math.max(0, this.limit - entry.count);
    response.setHeader('X-RateLimit-Limit', this.limit);
    response.setHeader('X-RateLimit-Remaining', remaining);

    if (entry.count > this.limit) {
      response.setHeader(
        'Retry-After',
        Math.ceil((entry.resetAt - now) / 1000),
      );
      throw new HttpException(
        'Terlalu banyak permintaan',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private evictExpired(now: number) {
    for (const [key, value] of this.hits) {
      if (value.resetAt <= now) this.hits.delete(key);
    }
    // Kalau masih penuh, buang yang paling lama (urutan sisip Map).
    while (this.hits.size >= MAX_TRACKED_CLIENTS) {
      const oldest = this.hits.keys().next().value;
      if (oldest === undefined) break;
      this.hits.delete(oldest);
    }
  }
}
