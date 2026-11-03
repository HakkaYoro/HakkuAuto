import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { TOKENS } from '../../infrastructure/di-tokens';

/**
 * Opt-in LAN auth: TOKENS.ApiToken comes from API_TOKEN; empty keeps the API
 * open (default). Plain string compare on purpose — shared secret for a
 * trusted LAN, not an internet-facing endpoint.
 */
@Injectable()
export class ApiTokenGuard implements CanActivate {
  constructor(@Inject(TOKENS.ApiToken) private readonly token: string) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.token) return true;
    const provided = context.switchToHttp().getRequest().headers['x-api-token'];
    if (provided === this.token) return true;
    throw new UnauthorizedException();
  }
}
