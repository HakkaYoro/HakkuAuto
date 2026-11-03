import { setTimeout as sleep } from 'node:timers/promises';
import type { GameAccountRepository } from '../../domain/accounts/game-account.repository';
import type { GameCodeRepository } from '../../domain/codes/game-code.repository';
import type { RedemptionRecordRepository } from '../../domain/redemptions/redemption-record.repository';
import type { RedemptionGatewayPort } from '../ports/driven/redemption-gateway.port';
import type { GameId } from '../../domain/games/game-id';
import { RedemptionStatus } from '../../domain/redemptions/redemption-record';
import { CodeStatus } from '../../domain/codes/game-code';
import { RedeemCodeToAccountUseCase } from './redeem-code-to-account';

export interface AutoRedeemSummary {
  gameId: string;
  attempts: number;
  successful: number;
}

const DEFAULT_DELAY_MS = 1500;

/**
 * Full-auto flow: for every account of the game with autoRedeem enabled,
 * redeem all unexpired ACTIVE codes it has no terminal attempt recorded for yet.
 */
export class RedeemPendingCodesUseCase {
  private readonly redeemOne: RedeemCodeToAccountUseCase;

  constructor(
    private readonly accounts: GameAccountRepository,
    private readonly codes: GameCodeRepository,
    private readonly records: RedemptionRecordRepository,
    gateway: RedemptionGatewayPort,
    private readonly delayMs: number = DEFAULT_DELAY_MS,
  ) {
    this.redeemOne = new RedeemCodeToAccountUseCase(accounts, codes, records, gateway);
  }

  async execute(gameId: GameId): Promise<AutoRedeemSummary> {
    const [accounts, activeCodes] = await Promise.all([
      this.accounts.findByGameWithAutoRedeem(gameId),
      this.codes.findByGame(gameId, CodeStatus.ACTIVE),
    ]);

    let attempts = 0;
    let successful = 0;

    for (const account of accounts) {
      for (const code of activeCodes) {
        if (code.isExpired()) continue;
        if (await this.records.findNonRetryable(account.id, gameId, code.code)) continue;

        const record = await this.redeemOne.execute({ accountId: account.id, code: code.code });
        attempts++;
        if (record.status === RedemptionStatus.SUCCESS) successful++;
        if (this.delayMs > 0) await sleep(this.delayMs); // courtesy pause between redemptions of the same game
      }
    }

    return { gameId: gameId.value, attempts, successful };
  }
}
