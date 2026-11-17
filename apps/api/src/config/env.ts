import { z } from 'zod';

const csv = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * Schema environment variable. Aplikasi menolak start kalau ada yang tidak valid,
 * jadi salah konfigurasi ketahuan saat deploy, bukan saat ada request pertama.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // Satu atau lebih API key, dipisah koma. Lebih dari satu key memungkinkan
  // rotasi tanpa downtime: tambah key baru, deploy web, lalu hapus key lama.
  API_KEYS: z
    .string()
    .transform(csv)
    .pipe(
      z
        .array(z.string().min(32, 'Setiap API key minimal 32 karakter'))
        .min(1, 'API_KEYS wajib diisi'),
    ),

  CORS_ORIGINS: z.string().default('').transform(csv),

  CATALOG_UPSTREAM_URL: z.url().default('https://dummyjson.com'),
  CATALOG_CACHE_TTL_SECONDS: z.coerce.number().int().min(0).default(300),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),

  // Format: KODE:persen, contoh "HEMAT10:10,MERDEKA17:17"
  PROMO_CODES: z
    .string()
    .default('HEMAT10:10')
    .transform((value, ctx) => {
      const entries = csv(value).map((entry) => {
        const [code, percent] = entry.split(':');
        const pct = Number(percent);
        if (!code || !Number.isInteger(pct) || pct < 1 || pct > 90) {
          ctx.addIssue({
            code: 'custom',
            message: `Promo tidak valid: "${entry}"`,
          });
        }
        return [code?.toUpperCase() ?? '', pct] as const;
      });
      return new Map(entries);
    }),

  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment variable tidak valid:\n${details}`);
  }
  return result.data;
}
