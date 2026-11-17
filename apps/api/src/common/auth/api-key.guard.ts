import { createHash, timingSafeEqual } from 'node:crypto';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Env } from '../../config/env.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

export const API_KEY_HEADER = 'x-api-key';

// Hash dulu supaya panjang buffer selalu sama; timingSafeEqual butuh itu,
// dan perbandingan konstan-waktu mencegah serangan timing.
const digest = (value: string) => createHash('sha256').update(value).digest();

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly keyDigests: Buffer[];

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService<Env, true>,
  ) {
    this.keyDigests = config.get('API_KEYS', { infer: true }).map(digest);
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header(API_KEY_HEADER);
    if (!provided) {
      throw new UnauthorizedException(`Header ${API_KEY_HEADER} wajib diisi`);
    }

    const providedDigest = digest(provided);
    // Cek semua key (tanpa short-circuit) agar waktu respons tidak bocorkan posisi key.
    let valid = false;
    for (const keyDigest of this.keyDigests) {
      valid = timingSafeEqual(keyDigest, providedDigest) || valid;
    }
    if (!valid) throw new UnauthorizedException('API key tidak valid');
    return true;
  }
}
