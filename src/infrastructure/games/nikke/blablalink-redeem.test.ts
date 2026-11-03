import { describe, it, expect } from 'vitest';
import { classifyNikkeError, redeemOnNikke, verifyNikkeAccount } from './blablalink-redeem';
import { RedemptionStatus } from '../../../domain/redemptions/redemption-record';
import { GameId } from '../../../domain/games/game-id';
import { GameAccount } from '../../../domain/accounts/game-account';
import { GameCode } from '../../../domain/codes/game-code';

describe('classifyNikkeError', () => {
  it('maps the known BlaBlaLink error codes', () => {
    expect(classifyNikkeError('1302016')).toBe(RedemptionStatus.ALREADY_USED);
    expect(classifyNikkeError('1302015')).toBe(RedemptionStatus.INVALID_CODE);
    expect(classifyNikkeError('1302017')).toBe(RedemptionStatus.EXPIRED);
    expect(classifyNikkeError('1302009')).toBe(RedemptionStatus.FAILED);
    expect(classifyNikkeError('300001')).toBe(RedemptionStatus.NEEDS_MANUAL);
  });

  it('maps unknown error codes to FAILED', () => {
    expect(classifyNikkeError('9999999')).toBe(RedemptionStatus.FAILED);
    expect(classifyNikkeError('')).toBe(RedemptionStatus.FAILED);
  });
});

describe('redeemOnNikke guards', () => {
  const gameId = GameId.create('nikke');
  const code = GameCode.discover({ gameId, code: 'TESTCODE1' });

  function accountWith(sessionCookie: unknown): GameAccount {
    return GameAccount.create({
      id: 'a1',
      gameId,
      label: 'Main',
      server: 'global',
      credentials: { sessionCookie } as never,
    });
  }

  it('fails closed without a request on missing, incomplete or poisoned cookies', async () => {
    for (const cookie of ['', 'sessionid=only-web-cookie', { evil: 1 }, 42, null]) {
      const result = await redeemOnNikke(accountWith(cookie), code);
      expect(result.status).toBe(RedemptionStatus.FAILED);
      expect(result.rawMessage).toBe('account has no BlaBlaLink session cookie configured');
    }
  });
});

describe('verifyNikkeAccount local checks', () => {
  it('rejects cookies missing game_openid without touching the network', async () => {
    expect(
      (await verifyNikkeAccount({ server: 'global', credentials: { sessionCookie: 'game_token=abc; game_uid=1' } })).ok,
    ).toBe(false);
    expect((await verifyNikkeAccount({ server: 'global', credentials: { sessionCookie: '' } })).ok).toBe(false);
    expect((await verifyNikkeAccount({ server: 'global', credentials: null } as never)).ok).toBe(false);
  });
});
