import { AggregateRoot } from '../shared/entity';
import { DomainError } from '../shared/errors';
import { GameId } from '../games/game-id';

export interface GameAccountProps {
  id: string;
  gameId: GameId;
  label: string;
  server: string;
  /** Per-game credentials validated against the game's AccountField schema. */
  credentials: Record<string, string>;
  autoRedeem: boolean;
  createdAt: Date;
}

export class InvalidAccountError extends DomainError {
  constructor(reason: string) {
    super(`Invalid game account: ${reason}`);
  }
}

export class AccountNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Game account ${id} not found`);
  }
}

/** A player account of one game, holding the credentials needed to redeem codes. */
export class GameAccount extends AggregateRoot<string> {
  private constructor(
    id: string,
    private props: GameAccountProps,
  ) {
    super(id);
  }

  static create(input: {
    id: string;
    gameId: GameId;
    label: string;
    server: string;
    credentials: Record<string, string>;
    autoRedeem?: boolean;
    createdAt?: Date;
  }): GameAccount {
    const label = input.label.trim();
    if (!label) throw new InvalidAccountError('label must not be empty');

    const account = new GameAccount(input.id, {
      id: input.id,
      gameId: input.gameId,
      label,
      server: input.server.trim(),
      credentials: { ...input.credentials },
      autoRedeem: input.autoRedeem ?? true,
      createdAt: input.createdAt ?? new Date(),
    });
    return account;
  }

  /** Rehydrate from persistence. */
  static fromPersistence(props: GameAccountProps): GameAccount {
    return new GameAccount(props.id, props);
  }

  get gameId(): GameId {
    return this.props.gameId;
  }

  get label(): string {
    return this.props.label;
  }

  get server(): string {
    return this.props.server;
  }

  get credentials(): Record<string, string> {
    return { ...this.props.credentials };
  }

  get autoRedeem(): boolean {
    return this.props.autoRedeem;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  enableAutoRedeem(): void {
    this.props = { ...this.props, autoRedeem: true };
  }

  disableAutoRedeem(): void {
    this.props = { ...this.props, autoRedeem: false };
  }

  rename(label: string): void {
    const trimmed = label.trim();
    if (!trimmed) throw new InvalidAccountError('label must not be empty');
    this.props = { ...this.props, label: trimmed };
  }

  updateCredentials(server: string, credentials: Record<string, string>): void {
    this.props = { ...this.props, server: server.trim(), credentials: { ...credentials } };
  }
}
