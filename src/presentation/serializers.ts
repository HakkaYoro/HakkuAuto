import type { GameCode } from '../domain/codes/game-code';
import type { GameAccount } from '../domain/accounts/game-account';
import type { RedemptionRecord } from '../domain/redemptions/redemption-record';

export function serializeCode(code: GameCode) {
  return {
    gameId: code.gameId.value,
    code: code.code,
    status: code.status,
    expired: code.isExpired(),
    reward: code.reward ?? null,
    expiresAt: code.expiresAt?.toISOString() ?? null,
    sourceUrl: code.sourceUrl ?? null,
    discoveredAt: code.discoveredAt.toISOString(),
  };
}

export function serializeAccount(account: GameAccount) {
  return {
    id: account.id,
    gameId: account.gameId.value,
    label: account.label,
    server: account.server,
    credentials: account.credentials,
    autoRedeem: account.autoRedeem,
    createdAt: account.createdAt.toISOString(),
  };
}

export function serializeRecord(record: RedemptionRecord) {
  return {
    id: record.id,
    accountId: record.accountId,
    gameId: record.gameId.value,
    code: record.code,
    status: record.status,
    rawMessage: record.rawMessage ?? null,
    attemptedAt: record.attemptedAt.toISOString(),
  };
}
