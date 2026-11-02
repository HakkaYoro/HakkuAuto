import type { GameId } from '../games/game-id';
import type { CodeKey } from './code-key';
import type { CodeStatus } from './game-code';
import type { GameCode } from './game-code';

export interface GameCodeRepository {
  /** Upsert: discovery of an already-known code refreshes metadata, keeps original discoveredAt. */
  save(code: GameCode): Promise<void>;
  findByKey(key: CodeKey): Promise<GameCode | null>;
  findByGame(gameId: GameId, status?: CodeStatus): Promise<GameCode[]>;
  findByGameAndCodes(gameId: GameId, codes: string[]): Promise<GameCode[]>;
}
