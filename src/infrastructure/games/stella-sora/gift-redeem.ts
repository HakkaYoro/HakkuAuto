import { getJson, postJson } from '../../http/http';
import { RedemptionStatus } from '../../../domain/redemptions/redemption-record';
import type { RedemptionResult } from '../../../application/ports/driven/redemption-gateway.port';
import type { GameAccount } from '../../../domain/accounts/game-account';
import type { GameCode } from '../../../domain/codes/game-code';
import type { AccountVerifyInput } from '../game-plugin';

// Endpoint map: docs/redemption/stella-sora.md
const SITE = 'https://stellasora.global';
const HEADERS = { Origin: SITE, Referer: `${SITE}/gift` };

interface SsEnvelope {
  code: number;
  message: string;
  data?: { player_nickname?: string; sdkErrorCode?: number };
}

export async function redeemOnStellaSora(account: GameAccount, code: GameCode): Promise<RedemptionResult> {
  const uid = account.credentials.uid?.trim();
  if (!uid) return { status: RedemptionStatus.FAILED, rawMessage: 'account has no uid configured' };

  try {
    const res = await postJson<SsEnvelope>(`${SITE}/api/game/redeem`, { uid, code: code.code }, HEADERS);
    if (res.code === 0) return { status: RedemptionStatus.SUCCESS, rawMessage: res.message || 'redeemed' };
    const message = res.data?.sdkErrorCode ? `${res.message} (sdk ${res.data.sdkErrorCode})` : res.message;
    return { status: classifySsError(res), rawMessage: message };
  } catch (err) {
    const httpError = err as Error & { status?: number; body?: string };
    // 1011 = rate-limited / transient per the official SPA; signal manual retry via NEEDS_MANUAL.
    if (httpError.body?.includes('1011')) {
      return { status: RedemptionStatus.NEEDS_MANUAL, rawMessage: 'rate-limited by Yostar (1011), retry later' };
    }
    return { status: RedemptionStatus.FAILED, rawMessage: `redeem request failed: ${httpError.message}` };
  }
}

function classifySsError(res: SsEnvelope): RedemptionResult['status'] {
  const msg = (res.message ?? '').toLowerCase();
  if (msg.includes('expire')) return RedemptionStatus.EXPIRED;
  if (msg.includes('already') || msg.includes('already used') || msg.includes('duplicate')) return RedemptionStatus.ALREADY_USED;
  if (msg.includes('invalid') || msg.includes('not exist') || msg.includes('not found')) return RedemptionStatus.INVALID_CODE;
  return RedemptionStatus.FAILED;
}

export async function verifyStellaSoraAccount(input: AccountVerifyInput): Promise<{ ok: boolean; message?: string }> {
  const uid = input.credentials.uid?.trim() ?? '';
  if (uid.length < 9) return { ok: false, message: 'UID must be at least 9 characters (Profile → copy UID).' };
  try {
    const res = await getJson<SsEnvelope>(`${SITE}/api/game/info?sdkuid=${encodeURIComponent(uid)}`, HEADERS);
    const nickname = res.data?.player_nickname?.trim();
    if (res.code === 0 && nickname) return { ok: true, message: `Account verified: ${nickname}` };
    return { ok: false, message: 'UID not found — create your character in-game first, then retry.' };
  } catch (err) {
    return { ok: false, message: `Could not reach Yostar: ${(err as Error).message}` };
  }
}
