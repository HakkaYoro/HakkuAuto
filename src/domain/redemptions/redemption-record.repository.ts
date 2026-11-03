import type { GameId } from '../games/game-id';
import type { RedemptionStatus } from './redemption-record';
import type { RedemptionRecord } from './redemption-record';

export interface RedemptionRecordRepository {
  save(record: RedemptionRecord): Promise<void>;
  /** Dedupe for auto-redeem — last record whose status is terminal for this account+code. */
  findNonRetryable(accountId: string, gameId: GameId, code: string): Promise<RedemptionRecord | null>;
  findHistory(filter: { gameId?: GameId; accountId?: string; status?: RedemptionStatus; limit?: number }): Promise<
    RedemptionRecord[]
  >;
}
