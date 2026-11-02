import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GameCode, CodeStatus } from './game-code';
import { InvalidCodeError } from './game-code';
import { CodeKey } from './code-key';
import { GameId } from '../games/game-id';

const GLOBAL = GameId.create('blue-archive');

describe('GameCode', () => {
  it('normalizes codes to uppercase and dedupes via CodeKey', () => {
    const a = GameCode.discover({ gameId: GLOBAL, code: ' hanawotadotte ' });
    const b = GameCode.discover({ gameId: GLOBAL, code: 'HANAWOTADOTTE' });
    assert.equal(a.code, 'HANAWOTADOTTE');
    assert.ok(a.id.equals(b.id));
    assert.ok(CodeKey.create(GLOBAL, 'hanawotadotte').equals(b.id));
  });

  it('rejects codes with invalid characters', () => {
    assert.throws(() => GameCode.discover({ gameId: GLOBAL, code: 'NO!' }), InvalidCodeError);
    assert.throws(() => GameCode.discover({ gameId: GLOBAL, code: 'AB' }), InvalidCodeError);
    assert.ok(!GameCode.isValid('x'));
    assert.ok(GameCode.isValid('MAGICAL-PUMPKIN_2'));
  });

  it('starts ACTIVE and records CodeDiscovered', () => {
    const code = GameCode.discover({ gameId: GLOBAL, code: 'TESTCODE1' });
    assert.equal(code.status, CodeStatus.ACTIVE);
    assert.ok(code.isExpired() === false);
    const events = code.pullEvents();
    assert.equal(events.length, 1);
    assert.equal((events[0] as any).code, 'TESTCODE1');
    assert.equal(code.pullEvents().length, 0);
  });

  it('isExpired once expiresAt has passed', () => {
    const past = new Date('2026-01-01T00:00:00Z');
    const code = GameCode.discover({ gameId: GLOBAL, code: 'OLDCODE12', expiresAt: past });
    assert.ok(code.isExpired());
    code.expire(new Date('2026-06-01T00:00:00Z'));
    assert.equal(code.status, CodeStatus.EXPIRED);
  });

  it('expire before expiresAt throws', () => {
    const future = new Date(Date.now() + 60_000);
    const code = GameCode.discover({ gameId: GLOBAL, code: 'FUTURECD1', expiresAt: future });
    assert.throws(() => code.expire());
    assert.equal(code.status, CodeStatus.ACTIVE);
  });
});
