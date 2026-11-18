import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { CartController } from './cart/cart.controller.js';
import { CartService } from './cart/cart.service.js';
import { CatalogService } from './catalog/catalog.service.js';
import { ApiKeyGuard } from './common/auth/api-key.guard.js';
import { RateLimitGuard } from './common/rate-limit.guard.js';
import { validateEnv } from './config/env.js';
import { HealthController } from './health/health.controller.js';
import { ProductsController } from './products/products.controller.js';
import { ProductsService } from './products/products.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
  ],
  controllers: [HealthController, ProductsController, CartController],
  providers: [
    CatalogService,
    ProductsService,
    CartService,
    // Urutan penting: autentikasi dulu, baru rate limit.
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class AppModule {}
