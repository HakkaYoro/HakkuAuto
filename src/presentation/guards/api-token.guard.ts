import { createHash, timingSafeEqual } from 'node:crypto';
import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { TOKENS } from '../../infrastructure/di-tokens';

/**
 * Opt-in LAN auth: TOKENS.ApiToken comes from API_TOKEN; empty keeps the API
 * open (default). Compares SHA-256 digests so the check is timing-safe without
 * manual length handling — shared secret for a shared LAN.
 */
@Injectable()
export class ApiTokenGuard implements CanActivate {
  private readonly expected: Buffer | null;

  constructor(@Inject(TOKENS.ApiToken) token: string) {
    this.expected = token ? sha256(token) : null;
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.expected) return true;
    const provided = context.switchToHttp().getRequest().headers['x-api-token'];
    if (typeof provided === 'string' && timingSafeEqual(this.expected, sha256(provided))) return true;
    throw new UnauthorizedException();
  }
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}
