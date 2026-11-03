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
  });

  it('rejects a wrong header with 401', () => {
    const guard = new ApiTokenGuard('secret');
    expect(() => guard.canActivate(ctxWith({ 'x-api-token': 'nope' }))).toThrow(UnauthorizedException);
  });

  it('rejects a duplicated (array) header with 401', () => {
    const guard = new ApiTokenGuard('secret');
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ headers: { 'x-api-token': ['secret', 'secret'] } }) }),
    } as unknown as ExecutionContext;
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
