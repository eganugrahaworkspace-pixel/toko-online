import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // ConfigModule membaca env saat modul di-import, jadi env diset di sini.
    env: {
      NODE_ENV: 'test',
      API_KEYS:
        'test-key-0123456789abcdef0123456789abcdef,another-key-0123456789abcdef01234567',
      PROMO_CODES: 'HEMAT10:10',
      THROTTLE_LIMIT: '1000',
    },
  },
});
