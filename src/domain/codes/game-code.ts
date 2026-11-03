import { AggregateRoot } from '../shared/entity';
import { DomainError } from '../shared/errors';
import { GameId } from '../games/game-id';
import { CodeKey } from './code-key';
import { CodeDiscovered } from './events';

export enum CodeStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
}

export class InvalidCodeError extends DomainError {
  constructor(raw: string) {
    super(`Invalid code "${raw}": 3-32 alphanumeric characters expected`);
  }
}

export interface GameCodeProps {
  key: CodeKey;
  status: CodeStatus;
  reward?: string;
  expiresAt?: Date;
  sourceUrl?: string;
  discoveredAt: Date;
}

const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;

/** A gift code of a game. Codes never change: they are discovered, then they expire. */
export class GameCode extends AggregateRoot<CodeKey> {
  private constructor(
    key: CodeKey,
    private props: GameCodeProps,
  ) {
    super(key);
  }

  static discover(input: {
    gameId: GameId;
    code: string;
    reward?: string;
    expiresAt?: Date;
    sourceUrl?: string;
    discoveredAt?: Date;
  }): GameCode {
    const normalized = input.code.trim().toUpperCase();
    if (!CODE_PATTERN.test(normalized)) throw new InvalidCodeError(input.code);

    const discoveredAt = input.discoveredAt ?? new Date();
    const key = CodeKey.create(input.gameId, normalized);
    const code = new GameCode(key, {
      key,
      status: CodeStatus.ACTIVE,
      reward: input.reward,
      expiresAt: input.expiresAt,
      sourceUrl: input.sourceUrl,
      discoveredAt,
    });
    code.record(new CodeDiscovered(input.gameId, normalized, input.reward, input.expiresAt, discoveredAt));
    return code;
  }

  /** Rehydrate from persistence (no events recorded). */
  static fromPersistence(props: GameCodeProps): GameCode {
    return new GameCode(props.key, props);
  }

  static isValid(raw: string): boolean {
    return CODE_PATTERN.test(raw.trim().toUpperCase());
  }

  get gameId(): GameId {
    return this.props.key.gameId;
  }

  get code(): string {
    return this.props.key.code;
  }

  get status(): CodeStatus {
    return this.props.status;
  }

  get reward(): string | undefined {
    return this.props.reward;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get sourceUrl(): string | undefined {
    return this.props.sourceUrl;
  }

  get discoveredAt(): Date {
    return this.props.discoveredAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.status === CodeStatus.EXPIRED || (!!this.props.expiresAt && this.props.expiresAt <= now);
  }
}
