import type { GameAccount } from '../../../domain/accounts/game-account';
import type { GameCode } from '../../../domain/codes/game-code';
import { RedemptionStatus } from '../../../domain/redemptions/redemption-record';

export interface RedemptionResult {
  status: RedemptionStatus;
  /** Raw response from the game's redemption service, for the history log. */
  rawMessage?: string;
}

/**
 * Driven port: redeems a code on a game account through the game's official
 * redemption service. NEEDS_MANUAL means automation is not possible right now
 * (e.g. captcha) — the UI then links to the official site with the code copied.
 */
export interface RedemptionGatewayPort {
  redeem(account: GameAccount, code: GameCode): Promise<RedemptionResult>;
}
