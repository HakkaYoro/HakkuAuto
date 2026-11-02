import type { GameDefinition } from '../../domain/games/game-definition';
import type { GameId } from '../../domain/games/game-id';

/** Driven port: the registry of supported games (supplied by game plugins). */
export interface GameCatalogPort {
  list(): GameDefinition[];
  get(gameId: GameId): GameDefinition | undefined;
}
