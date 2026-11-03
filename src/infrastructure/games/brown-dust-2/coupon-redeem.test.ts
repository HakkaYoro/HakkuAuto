import { describe, it, expect } from 'vitest';
import { classifyBd2Error, verifyBrownDust2Account } from './coupon-redeem';
import { RedemptionStatus } from '../../../domain/redemptions/redemption-record';

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
});
