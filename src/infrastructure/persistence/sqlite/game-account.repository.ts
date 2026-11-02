import type { DatabaseSync } from 'node:sqlite';
import { GameAccount } from '../../../domain/accounts/game-account';
import { GameId } from '../../../domain/games/game-id';
import type { GameAccountRepository } from '../../../domain/accounts/game-account.repository';

interface AccountRow {
  id: string;
  game_id: string;
  label: string;
  server: string;
  credentials: string;
  auto_redeem: number;
  created_at: number;
}

function toDomain(row: AccountRow): GameAccount {
  return GameAccount.fromPersistence({
    id: row.id,
    gameId: GameId.from(row.game_id),
    label: row.label,
    server: row.server,
    credentials: JSON.parse(row.credentials) as Record<string, string>,
    autoRedeem: row.auto_redeem === 1,
    createdAt: new Date(row.created_at),
  });
}

export class SqliteGameAccountRepository implements GameAccountRepository {
  constructor(private readonly db: DatabaseSync) {}

  async save(account: GameAccount): Promise<void> {
    this.db.prepare(
      `INSERT INTO game_accounts (id, game_id, label, server, credentials, auto_redeem, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         label = excluded.label,
         server = excluded.server,
         credentials = excluded.credentials,
         auto_redeem = excluded.auto_redeem`,
    ).run(
      account.id,
      account.gameId.value,
      account.label,
      account.server,
      JSON.stringify(account.credentials),
      account.autoRedeem ? 1 : 0,
      account.createdAt.getTime(),
    );
  }

  async findById(id: string): Promise<GameAccount | null> {
    const row = this.db.prepare('SELECT * FROM game_accounts WHERE id = ?').get(id) as AccountRow | undefined;
    return row ? toDomain(row) : null;
  }

  async findByGame(gameId: GameId): Promise<GameAccount[]> {
    const rows = this.db.prepare('SELECT * FROM game_accounts WHERE game_id = ? ORDER BY created_at').all(gameId.value) as unknown as AccountRow[];
    return rows.map(toDomain);
  }

  async findByGameWithAutoRedeem(gameId: GameId): Promise<GameAccount[]> {
    const rows = this.db
      .prepare('SELECT * FROM game_accounts WHERE game_id = ? AND auto_redeem = 1 ORDER BY created_at')
      .all(gameId.value) as unknown as AccountRow[];
    return rows.map(toDomain);
  }

  async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM game_accounts WHERE id = ?').run(id);
  }
}
