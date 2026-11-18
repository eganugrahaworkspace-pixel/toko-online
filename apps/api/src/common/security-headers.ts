import type { NextFunction, Request, Response } from 'express';

/**
 * Header keamanan untuk API JSON. Pengganti `helmet` yang tidak bergantung pada
 * cara bundler membaca modul CJS/ESM (helmet gagal di-compile di Vercel).
 * Swagger UI (/docs, hanya non-production) dikecualikan dari CSP karena butuh script.
 */
export function securityHeaders(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  );
  if (!req.path.startsWith('/docs')) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'",
    );
  }
  next();
}
