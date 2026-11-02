import type { GameId } from '../games/game-id';
import type { RedemptionStatus } from './redemption-record';
import type { RedemptionRecord } from './redemption-record';

export interface RedemptionRecordRepository {
  save(record: RedemptionRecord): Promise<void>;
  /** Successful attempts (SUCCESS / ALREADY_USED) for one account+code — dedupe for auto-redeem. */
  findSuccessful(accountId: string, gameId: GameId, code: string): Promise<RedemptionRecord | null>;
  findHistory(filter: { gameId?: GameId; accountId?: string; status?: RedemptionStatus; limit?: number }): Promise<
    RedemptionRecord[]
  >;
}
