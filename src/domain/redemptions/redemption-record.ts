import { Entity } from '../shared/entity';
import { GameId } from '../games/game-id';

/** Outcome of one redemption attempt (append-only history, never mutated). */
export enum RedemptionStatus {
  SUCCESS = 'SUCCESS',
  ALREADY_USED = 'ALREADY_USED',
  EXPIRED = 'EXPIRED',
  INVALID_CODE = 'INVALID_CODE',
  NEEDS_MANUAL = 'NEEDS_MANUAL',
  FAILED = 'FAILED',
}

/** Terminal outcomes: a later scan can never change them, so auto-redeem skips them. */
export const NON_RETRYABLE_STATUSES: readonly RedemptionStatus[] = [
  RedemptionStatus.SUCCESS,
  RedemptionStatus.ALREADY_USED,
  RedemptionStatus.EXPIRED,
  RedemptionStatus.INVALID_CODE,
];

export interface RedemptionRecordProps {
  id: string;
  accountId: string;
  gameId: GameId;
  code: string;
  status: RedemptionStatus;
  rawMessage?: string;
  attemptedAt: Date;
}

export class RedemptionRecord extends Entity<string> {
  private constructor(private props: RedemptionRecordProps) {
    super(props.id);
  }

  static create(input: {
    id: string;
    accountId: string;
    gameId: GameId;
    code: string;
    status: RedemptionStatus;
    rawMessage?: string;
  }): RedemptionRecord {
    return new RedemptionRecord({
      id: input.id,
      accountId: input.accountId,
      gameId: input.gameId,
      code: input.code,
      status: input.status,
      rawMessage: input.rawMessage,
      attemptedAt: new Date(),
    });
  }

  /** Rehydrate from persistence. */
  static fromPersistence(props: RedemptionRecordProps): RedemptionRecord {
    return new RedemptionRecord(props);
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get gameId(): GameId {
    return this.props.gameId;
  }

  get code(): string {
    return this.props.code;
  }

  get status(): RedemptionStatus {
    return this.props.status;
  }

  get rawMessage(): string | undefined {
    return this.props.rawMessage;
  }

  get attemptedAt(): Date {
    return this.props.attemptedAt;
  }
}
