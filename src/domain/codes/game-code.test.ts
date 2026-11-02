import { describe, it, expect } from 'vitest';
import { GameCode, CodeStatus } from './game-code';
import { InvalidCodeError } from './game-code';
import { CodeKey } from './code-key';
import { GameId } from '../games/game-id';

const GLOBAL = GameId.create('blue-archive');

describe('GameCode', () => {
  it('normalizes codes to uppercase and dedupes via CodeKey', () => {
    const a = GameCode.discover({ gameId: GLOBAL, code: ' hanawotadotte ' });
    const b = GameCode.discover({ gameId: GLOBAL, code: 'HANAWOTADOTTE' });
    expect(a.code).toBe('HANAWOTADOTTE');
    expect(a.id.equals(b.id)).toBe(true);
    expect(CodeKey.create(GLOBAL, 'hanawotadotte').equals(b.id)).toBe(true);
  });

  it('rejects codes with invalid characters', () => {
    expect(() => GameCode.discover({ gameId: GLOBAL, code: 'NO!' })).toThrow(InvalidCodeError);
    expect(() => GameCode.discover({ gameId: GLOBAL, code: 'AB' })).toThrow(InvalidCodeError);
    expect(GameCode.isValid('x')).toBe(false);
    expect(GameCode.isValid('MAGICAL-PUMPKIN_2')).toBe(true);
  });

  it('starts ACTIVE and records CodeDiscovered', () => {
    const code = GameCode.discover({ gameId: GLOBAL, code: 'TESTCODE1' });
    expect(code.status).toBe(CodeStatus.ACTIVE);
    expect(code.isExpired()).toBe(false);
    const events = code.pullEvents();
    expect(events).toHaveLength(1);
    expect((events[0] as any).code).toBe('TESTCODE1');
    expect(code.pullEvents()).toHaveLength(0);
  });

  it('isExpired once expiresAt has passed', () => {
    const past = new Date('2026-01-01T00:00:00Z');
    const code = GameCode.discover({ gameId: GLOBAL, code: 'OLDCODE12', expiresAt: past });
    expect(code.isExpired()).toBe(true);
    code.expire(new Date('2026-06-01T00:00:00Z'));
    expect(code.status).toBe(CodeStatus.EXPIRED);
  });

  it('expire before expiresAt throws', () => {
    const future = new Date(Date.now() + 60_000);
    const code = GameCode.discover({ gameId: GLOBAL, code: 'FUTURECD1', expiresAt: future });
    expect(() => code.expire()).toThrow();
    expect(code.status).toBe(CodeStatus.ACTIVE);
  });
});
