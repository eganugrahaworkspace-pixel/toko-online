import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { API_KEY_HEADER } from './common/auth/api-key.guard.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Di belakang proxy (Render/Railway/Fly) supaya req.ip adalah IP asli.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const config = configureApp(app);

  if (config.get('NODE_ENV', { infer: true }) !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Toko Online API')
        .setVersion('1.0')
        .addApiKey(
          { type: 'apiKey', in: 'header', name: API_KEY_HEADER },
          'api-key',
        )
        .build(),
    );
    SwaggerModule.setup('docs', app, document);
  }

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`API berjalan di http://localhost:${port}`, 'Bootstrap');
}

await bootstrap();
