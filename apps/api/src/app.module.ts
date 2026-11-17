import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { Request } from 'express';
import { CartController } from './cart/cart.controller.js';
import { CartService } from './cart/cart.service.js';
import { CatalogService } from './catalog/catalog.service.js';
import { ApiKeyGuard } from './common/auth/api-key.guard.js';
import { type Env, validateEnv } from './config/env.js';
import { HealthController } from './health/health.controller.js';
import { ProductsController } from './products/products.controller.js';
import { ProductsService } from './products/products.service.js';

/** Header yang dikirim server Next.js berisi IP pengunjung asli. */
export const CLIENT_IP_HEADER = 'x-client-ip';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL_MS', { infer: true }),
            limit: config.get('THROTTLE_LIMIT', { infer: true }),
          },
        ],
        // Semua request datang dari server Next.js (IP sama), jadi limit dihitung
        // per pengunjung memakai header dari web. Header ini hanya bisa dikirim oleh
        // pemegang API key karena ApiKeyGuard dijalankan lebih dulu.
        getTracker: (req: Record<string, unknown>) => {
          const request = req as unknown as Request;
          return request.header(CLIENT_IP_HEADER) ?? request.ip ?? 'unknown';
        },
      }),
    }),
  ],
  controllers: [HealthController, ProductsController, CartController],
  providers: [
    CatalogService,
    ProductsService,
    CartService,
    // Urutan penting: autentikasi dulu, baru rate limit.
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
