import { ValueObject } from '../shared/value-object';
import { GameId } from '../games/game-id';

/**
 * Identity of a code: unique per game. The code is normalized
 * (trimmed, uppercased) so scraped variants dedupe to one entry.
 */
export class CodeKey extends ValueObject {
  private constructor(
    public readonly gameId: GameId,
    public readonly code: string,
  ) {
    super();
  }

  static create(gameId: GameId, rawCode: string): CodeKey {
    return new CodeKey(gameId, rawCode.trim().toUpperCase());
  }

  /** Stable identity string: "<gameId>:<CODE>" — used as persistence key. */
  toString(): string {
    return `${this.gameId.value}:${this.code}`;
  }
}
