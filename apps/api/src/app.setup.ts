import {
  type INestApplication,
  StandardSchemaValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { API_KEY_HEADER } from './common/auth/api-key.guard.js';
import { securityHeaders } from './common/security-headers.js';
import type { Env } from './config/env.js';

/** Konfigurasi bersama untuk main.ts dan e2e test. */
export function configureApp(app: INestApplication) {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.use(securityHeaders);
  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    methods: ['GET', 'POST'],
    allowedHeaders: ['content-type', API_KEY_HEADER],
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableShutdownHooks();
  return config;
}
