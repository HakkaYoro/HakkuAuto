import { postJson } from '../../http/http';
import { RedemptionStatus } from '../../../domain/redemptions/redemption-record';
import type { RedemptionResult } from '../../../application/ports/driven/redemption-gateway.port';
import type { GameAccount } from '../../../domain/accounts/game-account';
import type { GameCode } from '../../../domain/codes/game-code';
import type { AccountVerifyInput } from '../game-plugin';

// Flow reverse-engineered from Small-tailqwq/Nikke-CDK-Tool (MIT,
// github.com/Small-tailqwq/Nikke-CDK-Tool) — BlaBlaLink is the Level Infinite web portal
// behind the in-game CD-Key Redemption Portal. Endpoint map: docs/redemption/nikke.md
// The captcha lives only in the browser login (never automated); the user pastes their web
// session cookie, which carries game_token / game_openid / game_uid — no request signing.
const REDEEM_URL = 'https://api.blablalink.com/api/game/proxy/Game/RecordCdkRedemption';
const VERIFY_URL = 'https://api.blablalink.com/api/ugc/direct/standalonesite/User/GetUserGamePlayerInfo';
const SITE = 'https://www.blablalink.com';
const DEFAULT_GAME_ID = '29080';

// x-common-params is a JSON string packed into a single header.
function blablalinkHeaders(cookie: string): Record<string, string> {
  return {
    Origin: SITE,
    Referer: `${SITE}/`,
    'x-channel-type': '2',
    'x-language': 'en',
    'x-common-params': JSON.stringify({
      game_id: '16',
      area_id: 'global',
      source: 'pc_web',
      intl_game_id: DEFAULT_GAME_ID,
      language: 'en',
      env: 'prod',
    }),
    Cookie: cookie,
  };
}

interface BlaBlaEnvelope {
  code?: unknown;
  msg?: string;
  data?: { area_id?: unknown };
}

const NIKKE_ERRORS: Record<string, RedemptionStatus> = {
  '1302016': RedemptionStatus.ALREADY_USED,
  '1302015': RedemptionStatus.INVALID_CODE,
  '1302017': RedemptionStatus.EXPIRED,
  '1302009': RedemptionStatus.FAILED,
  '300001': RedemptionStatus.NEEDS_MANUAL,
};

const NIKKE_MESSAGES: Record<string, string> = {
  '1302016': 'code already redeemed by this account',
  '1302015': 'invalid CDK (check for typos)',
  '1302017': 'CDK global uses exhausted',
  '1302009': 'account redemption limit reached — retried on the next pass',
  '300001': 'session cookie expired — re-login on blablalink.com and update the account cookie',
};

export function classifyNikkeError(code: string): RedemptionStatus {
  return NIKKE_ERRORS[code] ?? RedemptionStatus.FAILED;
}

export async function redeemOnNikke(account: GameAccount, code: GameCode): Promise<RedemptionResult> {
  // typeof guard (not ?.trim()): a poisoned non-string credential must degrade to
  // FAILED here, not throw before the try — a throw would abort the whole auto-redeem pass.
  const cookie = typeof account.credentials.sessionCookie === 'string' ? account.credentials.sessionCookie.trim() : '';
  if (!cookie || !cookie.includes('game_token=')) {
    return { status: RedemptionStatus.FAILED, rawMessage: 'account has no BlaBlaLink session cookie configured' };
  }

  try {
    const res = await postJson<BlaBlaEnvelope>(REDEEM_URL, { cdkey: code.code }, blablalinkHeaders(cookie));
    if (res.code === 0) return { status: RedemptionStatus.SUCCESS, rawMessage: res.msg || 'redeemed' };
    const errorCode = String(res.code);
    return {
      status: classifyNikkeError(errorCode),
      rawMessage: NIKKE_MESSAGES[errorCode] ?? `unexpected error code: ${errorCode}`,
    };
  } catch (err) {
    const httpError = err as Error & { status?: number; body?: string };
    // 429 = rate-limited / transient; signal manual retry via NEEDS_MANUAL.
    if (httpError.status === 429) {
      return { status: RedemptionStatus.NEEDS_MANUAL, rawMessage: 'rate-limited by blablalink (429), retry later' };
    }
    return { status: RedemptionStatus.FAILED, rawMessage: `redeem request failed: ${httpError.message}` };
  }
}

export async function verifyNikkeAccount(input: AccountVerifyInput): Promise<{ ok: boolean; message?: string }> {
  const cookie = typeof input.credentials?.sessionCookie === 'string' ? input.credentials.sessionCookie.trim() : '';
  if (!cookie.includes('game_token=') || !cookie.includes('game_openid=')) {
    return {
      ok: false,
      message: 'Paste the full cookie value of an api.blablalink.com request (F12 → Network → Request Headers) while logged in on blablalink.com.',
    };
  }

  try {
    const openid = cookie.match(/game_openid=([^;]+)/)?.[1] ?? '';
    const gameId = cookie.match(/game_gameid=([^;]+)/)?.[1] ?? DEFAULT_GAME_ID;
    const res = await postJson<BlaBlaEnvelope>(VERIFY_URL, { intl_openid: `${gameId}-${openid}` }, blablalinkHeaders(cookie));
    if (res.code === 0 && res.data) {
      return { ok: true, message: `region: ${String(res.data.area_id ?? 'unknown')}` };
    }
    if (String(res.code) === '300001') {
      return { ok: false, message: 'Session expired — re-login on blablalink.com and paste a fresh cookie.' };
    }
    return { ok: false, message: `BlaBlaLink rejected the cookie (code ${String(res.code ?? 'unknown')})` };
  } catch (err) {
    return { ok: false, message: `verify request failed: ${(err as Error).message}` };
  }
}
