import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { ApiTokenGuard } from './api-token.guard';

function ctxWith(headers: Record<string, string>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => ({ headers }) }) } as unknown as ExecutionContext;
}

describe('ApiTokenGuard', () => {
  it('allows everything when no token is configured', () => {
    const guard = new ApiTokenGuard('');
    expect(guard.canActivate(ctxWith({}))).toBe(true);
    expect(guard.canActivate(ctxWith({ 'x-api-token': 'wrong' }))).toBe(true);
  });

  it('allows a matching x-api-token header', () => {
    const guard = new ApiTokenGuard('secret');
    expect(guard.canActivate(ctxWith({ 'x-api-token': 'secret' }))).toBe(true);
  });

  it('rejects a missing header with 401', () => {
    const guard = new ApiTokenGuard('secret');
    expect(() => guard.canActivate(ctxWith({}))).toThrow(UnauthorizedException);
    try {
      guard.canActivate(ctxWith({}));
    } catch (err) {
      expect((err as UnauthorizedException).getStatus()).toBe(401);
    }
  });

  it('rejects a wrong header with 401', () => {
    const guard = new ApiTokenGuard('secret');
    expect(() => guard.canActivate(ctxWith({ 'x-api-token': 'nope' }))).toThrow(UnauthorizedException);
  });
});
