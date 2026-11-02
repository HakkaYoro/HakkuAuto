import type { GameId } from '../games/game-id';
import type { GameAccount } from './game-account';

export interface GameAccountRepository {
  save(account: GameAccount): Promise<void>;
  findById(id: string): Promise<GameAccount | null>;
  findByGame(gameId: GameId): Promise<GameAccount[]>;
  findByGameWithAutoRedeem(gameId: GameId): Promise<GameAccount[]>;
  delete(id: string): Promise<void>;
}
