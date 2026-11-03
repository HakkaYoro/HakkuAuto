import { describe, it, expect } from 'vitest';
import { classifyBd2Error, redeemOnBrownDust2, verifyBrownDust2Account } from './coupon-redeem';
import { RedemptionStatus } from '../../../domain/redemptions/redemption-record';
import { GameId } from '../../../domain/games/game-id';
import { GameAccount } from '../../../domain/accounts/game-account';
import { GameCode } from '../../../domain/codes/game-code';

describe('classifyBd2Error', () => {
  it('maps the four known thebd2pulse errorCodes', () => {
    expect(classifyBd2Error('AlreadyUsed')).toBe(RedemptionStatus.ALREADY_USED);
    expect(classifyBd2Error('InvalidCode')).toBe(RedemptionStatus.INVALID_CODE);
    expect(classifyBd2Error('ExpiredCode')).toBe(RedemptionStatus.EXPIRED);
    expect(classifyBd2Error('IncorrectUser')).toBe(RedemptionStatus.FAILED);
  });

  it('maps unknown errorCodes to FAILED', () => {
    expect(classifyBd2Error('MaintenanceMode')).toBe(RedemptionStatus.FAILED);
    expect(classifyBd2Error('')).toBe(RedemptionStatus.FAILED);
  });
});

describe('verifyBrownDust2Account', () => {
  it('rejects empty or out-of-range nicknames locally', async () => {
    expect((await verifyBrownDust2Account({ server: 'global', credentials: { nickname: '' } })).ok).toBe(false);
    expect((await verifyBrownDust2Account({ server: 'global', credentials: { nickname: ' a ' } })).ok).toBe(false);
    expect(
      (await verifyBrownDust2Account({ server: 'global', credentials: { nickname: 'x'.repeat(21) } })).ok,
    ).toBe(false);
  });

  it('accepts a well-formed nickname (real check happens on first redeem)', async () => {
    const result = await verifyBrownDust2Account({ server: 'global', credentials: { nickname: 'Guest_12345' } });
    expect(result.ok).toBe(true);
  });

  it('degrades poisoned credentials to a refusal instead of throwing', async () => {
    // A row persisted before boundary validation existed can hold non-string values.
    expect(
      (await verifyBrownDust2Account({ server: 'global', credentials: { nickname: { evil: 1 } } as never })).ok,
    ).toBe(false);
    expect(
      (await verifyBrownDust2Account({ server: 'global', credentials: { nickname: 42 } as never })).ok,
    ).toBe(false);
    expect((await verifyBrownDust2Account({ server: 'global', credentials: null } as never)).ok).toBe(false);
  });

  it('redeem fails closed on a poisoned nickname (no throw, no request)', async () => {
    const gameId = GameId.create('brown-dust-2');
    const account = GameAccount.create({
      id: 'a1',
      gameId,
      label: 'Main',
      server: 'global',
      credentials: { nickname: { evil: 1 } } as never,
    });
    const code = GameCode.discover({ gameId, code: 'TESTCODE1' });
    const result = await redeemOnBrownDust2(account, code);
    expect(result.status).toBe(RedemptionStatus.FAILED);
    expect(result.rawMessage).toBe('account has no nickname configured');
  });
});
