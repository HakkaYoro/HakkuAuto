import { postJson } from '../../http/http';
import { RedemptionStatus } from '../../../domain/redemptions/redemption-record';
import type { RedemptionResult } from '../../../application/ports/driven/redemption-gateway.port';
import type { GameAccount } from '../../../domain/accounts/game-account';
import type { GameCode } from '../../../domain/codes/game-code';
import type { AccountVerifyInput } from '../game-plugin';

// Endpoint map and error codes: docs/redemption/blue-archive.md
const BASE = 'https://mcoupon.nexon.com/bluearchive/coupon/api/v1/';

interface McouponResponse {
  result?: boolean;
  code?: number;
  message?: string;
  info?: unknown;
}

interface BaCharacter {
  id: string | number;
  name: string;
  world?: string | number;
}

const STATUS_BY_CODE: Record<number, RedemptionResult['status']> = {
  0: RedemptionStatus.SUCCESS,
  1171: RedemptionStatus.SUCCESS, // success + extra reward
  95100: RedemptionStatus.ALREADY_USED,
  90434: RedemptionStatus.ALREADY_USED,
  95550: RedemptionStatus.ALREADY_USED,
  95170: RedemptionStatus.ALREADY_USED,
  95150: RedemptionStatus.ALREADY_USED,
  95120: RedemptionStatus.ALREADY_USED,
  95130: RedemptionStatus.EXPIRED,
  94202: RedemptionStatus.INVALID_CODE,
  95110: RedemptionStatus.INVALID_CODE,
  95160: RedemptionStatus.INVALID_CODE,
  90433: RedemptionStatus.INVALID_CODE,
};

export async function redeemOnMcoupon(account: GameAccount, code: GameCode): Promise<RedemptionResult> {
  const npaCode = account.credentials.memberCode?.trim();
  if (!npaCode) return { status: RedemptionStatus.FAILED, rawMessage: 'account has no memberCode configured' };

  const region = account.server;
  let characters: BaCharacter[];
  try {
    const res = await postJson<McouponResponse>(`${BASE}characters-by-npacode`, {
      npaCode,
      coupon: code.code,
      region,
    });
    if (!res.result) return toResult(res);
    characters = Array.isArray(res.info) ? (res.info as BaCharacter[]) : [];
  } catch (err) {
    return { status: RedemptionStatus.FAILED, rawMessage: `character lookup failed: ${(err as Error).message}` };
  }

  const wanted = account.credentials.characterName?.trim().toLowerCase();
  const chosen = (wanted ? characters.find((c) => String(c.name).toLowerCase().includes(wanted)) : undefined) ?? characters[0];
  if (!chosen) return { status: RedemptionStatus.FAILED, rawMessage: 'account returned no characters (wrong memberCode or region?)' };

  try {
    const res = await postJson<McouponResponse>(`${BASE}redeem-coupon-by-npacode`, {
      npaCode,
      coupon: code.code,
      id: chosen.id,
      name: chosen.name,
      world: chosen.world,
      region,
    });
    return toResult(res, `delivered to ${chosen.name}`);
  } catch (err) {
    return { status: RedemptionStatus.FAILED, rawMessage: `redeem request failed: ${(err as Error).message}` };
  }
}

function toResult(res: McouponResponse, context?: string): RedemptionResult {
  const code = res.code ?? -1;
  const status = STATUS_BY_CODE[code] ?? RedemptionStatus.FAILED;
  const prefix = context ? `${context}: ` : '';
  return { status, rawMessage: `${prefix}${code === 0 ? 'redeemed' : `code ${code}`}${res.message ? ` — ${res.message}` : ''}` };
}

export async function verifyMcouponAccount(input: AccountVerifyInput): Promise<{ ok: boolean; message?: string }> {
  const npaCode = input.credentials.memberCode?.trim() ?? '';
  if (!/^[A-Za-z0-9]{12,13}$/.test(npaCode)) {
    return { ok: false, message: 'Member code must be 12–13 alphanumeric characters (Menu → Account → Customer Center).' };
  }
  try {
    const res = await postJson<McouponResponse>(`${BASE}game-servers-by-npacode`, { npaCode, region: input.server });
    return res.result
      ? { ok: true, message: 'Member code accepted by Nexon.' }
      : { ok: false, message: `Nexon rejected the member code (code ${res.code ?? '?'}).` };
  } catch (err) {
    return { ok: false, message: `Could not reach Nexon: ${(err as Error).message}` };
  }
}
