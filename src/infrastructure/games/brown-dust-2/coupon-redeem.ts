import { postJson } from '../../http/http';
import { RedemptionStatus } from '../../../domain/redemptions/redemption-record';
import type { RedemptionResult } from '../../../application/ports/driven/redemption-gateway.port';
import type { GameAccount } from '../../../domain/accounts/game-account';
import type { GameCode } from '../../../domain/codes/game-code';
import type { AccountVerifyInput } from '../game-plugin';

// Flow reverse-engineered from BD2-Archive (MIT, github.com/rm6alalauau/BD2-Archive),
// the public redemption service behind thebd2pulse.com. Endpoint map: docs/redemption/brown-dust-2.md
const REDEEM_URL = 'https://api.thebd2pulse.com/redeem/coupon';
const HEADERS = { Origin: 'https://thebd2pulse.com', Referer: 'https://thebd2pulse.com/en/' };

interface PulseEnvelope {
  success?: boolean;
  errorCode?: string;
  message?: string;
}

const BD2_ERRORS: Record<string, { status: RedemptionStatus; message: string }> = {
  AlreadyUsed: { status: RedemptionStatus.ALREADY_USED, message: 'code already used on this account' },
  InvalidCode: { status: RedemptionStatus.INVALID_CODE, message: 'code does not exist (check for typos)' },
  ExpiredCode: { status: RedemptionStatus.EXPIRED, message: 'code has expired' },
  IncorrectUser: { status: RedemptionStatus.FAILED, message: 'nickname not found — check spelling (in-game profile → copy)' },
};

export function classifyBd2Error(errorCode: string): RedemptionStatus {
  return BD2_ERRORS[errorCode]?.status ?? RedemptionStatus.FAILED;
}

export async function redeemOnBrownDust2(account: GameAccount, code: GameCode): Promise<RedemptionResult> {
  // typeof guard (not ?.trim()): a poisoned non-string credential must degrade to
  // FAILED here, not throw before the try — a throw would abort the whole auto-redeem pass.
  const nickname = typeof account.credentials.nickname === 'string' ? account.credentials.nickname.trim() : '';
  if (!nickname) return { status: RedemptionStatus.FAILED, rawMessage: 'account has no nickname configured' };

  try {
    const res = await postJson<PulseEnvelope>(
      REDEEM_URL,
      { appId: 'bd2-live', userId: nickname, code: code.code },
      HEADERS,
    );
    if (res.success === true) return { status: RedemptionStatus.SUCCESS, rawMessage: res.message || 'redeemed' };
    const known = BD2_ERRORS[res.errorCode ?? ''];
    return {
      status: classifyBd2Error(res.errorCode ?? ''),
      rawMessage: res.message || known?.message || `unexpected errorCode: ${res.errorCode ?? 'none'}`,
    };
  } catch (err) {
    const httpError = err as Error & { status?: number; body?: string };
    // 429 = rate-limited / transient; signal manual retry via NEEDS_MANUAL.
    if (httpError.status === 429) {
      return { status: RedemptionStatus.NEEDS_MANUAL, rawMessage: 'rate-limited by thebd2pulse (429), retry later' };
    }
    return { status: RedemptionStatus.FAILED, rawMessage: `redeem request failed: ${httpError.message}` };
  }
}

export async function verifyBrownDust2Account(input: AccountVerifyInput): Promise<{ ok: boolean; message?: string }> {
  const nickname = typeof input.credentials?.nickname === 'string' ? input.credentials.nickname.trim() : '';
  if (nickname.length < 2 || nickname.length > 20) {
    return { ok: false, message: 'Nickname must be 2–20 characters (in-game profile → copy).' };
  }
  // No public lookup endpoint exists: the real check happens on the first redeem
  // (IncorrectUser there means a misspelled nickname).
  return { ok: true, message: 'Nickname looks valid — it is really checked on the first redeem.' };
}
