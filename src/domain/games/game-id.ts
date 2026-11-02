import { ValueObject } from '../shared/value-object';
import { DomainError } from '../shared/errors';

export class InvalidGameIdError extends DomainError {
  constructor(value: string) {
    super(`Invalid game id "${value}": must be a lowercase kebab-case slug`);
  }
}

const GAME_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Slug identifier of a game, e.g. "blue-archive". */
export class GameId extends ValueObject {
  private constructor(public readonly value: string) {
    super();
  }

  static create(value: string): GameId {
    const normalized = value.trim().toLowerCase();
    if (!GAME_ID_PATTERN.test(normalized)) throw new InvalidGameIdError(value);
    return new GameId(normalized);
  }

  static from(value: string): GameId {
    return new GameId(value);
  }

  toString(): string {
    return this.value;
  }
}
