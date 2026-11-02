import type { GameId } from '../../../domain/games/game-id';

/** A code entry as scraped from an external source. */
export interface ScrapedCodeEntry {
  code: string;
  reward?: string;
  expiresAt?: Date;
  sourceUrl?: string;
}

/**
 * Driven port: fetches current codes for a game from external sources
 * (rentry, official news, fan wikis). Implemented per game in infrastructure.
 */
export interface CodeSourcePort {
  fetchLatest(gameId: GameId): Promise<ScrapedCodeEntry[]>;
}
