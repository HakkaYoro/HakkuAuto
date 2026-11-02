import type { DatabaseSync } from 'node:sqlite';
import { GameCode, CodeStatus } from '../../../domain/codes/game-code';
import { CodeKey } from '../../../domain/codes/code-key';
import { GameId } from '../../../domain/games/game-id';
import type { GameCodeRepository } from '../../../domain/codes/game-code.repository';

interface CodeRow {
  key: string;
  game_id: string;
  code: string;
  status: string;
  reward: string | null;
  expires_at: number | null;
  source_url: string | null;
  discovered_at: number;
}

function toDomain(row: CodeRow): GameCode {
  return GameCode.fromPersistence({
    key: CodeKey.create(GameId.from(row.game_id), row.code),
    status: row.status as CodeStatus,
    reward: row.reward ?? undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    sourceUrl: row.source_url ?? undefined,
    discoveredAt: new Date(row.discovered_at),
  });
}

export class SqliteGameCodeRepository implements GameCodeRepository {
  constructor(private readonly db: DatabaseSync) {}

  async save(code: GameCode): Promise<void> {
    this.db.prepare(
      `INSERT INTO game_codes (key, game_id, code, status, reward, expires_at, source_url, discovered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         status = excluded.status,
         reward = excluded.reward,
         expires_at = excluded.expires_at,
         source_url = excluded.source_url`,
    ).run(
      code.id.toString(),
      code.gameId.value,
      code.code,
      code.status,
      code.reward ?? null,
      code.expiresAt?.getTime() ?? null,
      code.sourceUrl ?? null,
      code.discoveredAt.getTime(),
    );
  }

  async findByKey(key: CodeKey): Promise<GameCode | null> {
    const row = this.db.prepare('SELECT * FROM game_codes WHERE key = ?').get(key.toString()) as CodeRow | undefined;
    return row ? toDomain(row) : null;
  }

  async findByGame(gameId: GameId, status?: CodeStatus): Promise<GameCode[]> {
    const rows = status
      ? (this.db.prepare('SELECT * FROM game_codes WHERE game_id = ? AND status = ? ORDER BY discovered_at DESC').all(gameId.value, status) as unknown as CodeRow[])
      : (this.db.prepare('SELECT * FROM game_codes WHERE game_id = ? ORDER BY discovered_at DESC').all(gameId.value) as unknown as CodeRow[]);
    return rows.map(toDomain);
  }

  async findByGameAndCodes(gameId: GameId, codes: string[]): Promise<GameCode[]> {
    const found: GameCode[] = [];
    for (const raw of codes) {
      const code = await this.findByKey(CodeKey.create(gameId, raw));
      if (code) found.push(code);
    }
    return found;
  }
}
