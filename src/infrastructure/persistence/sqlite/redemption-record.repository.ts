import type { DatabaseSync } from 'node:sqlite';
import { RedemptionRecord, RedemptionStatus, SUCCESSFUL_STATUSES } from '../../../domain/redemptions/redemption-record';
import { GameId } from '../../../domain/games/game-id';
import type { RedemptionRecordRepository } from '../../../domain/redemptions/redemption-record.repository';

interface RecordRow {
  id: string;
  account_id: string;
  game_id: string;
  code: string;
  status: string;
  raw_message: string | null;
  attempted_at: number;
}

function toDomain(row: RecordRow): RedemptionRecord {
  return RedemptionRecord.fromPersistence({
    id: row.id,
    accountId: row.account_id,
    gameId: GameId.from(row.game_id),
    code: row.code,
    status: row.status as RedemptionStatus,
    rawMessage: row.raw_message ?? undefined,
    attemptedAt: new Date(row.attempted_at),
  });
}

export class SqliteRedemptionRecordRepository implements RedemptionRecordRepository {
  constructor(private readonly db: DatabaseSync) {}

  async save(record: RedemptionRecord): Promise<void> {
    this.db.prepare(
      `INSERT INTO redemption_records (id, account_id, game_id, code, status, raw_message, attempted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      record.id,
      record.accountId,
      record.gameId.value,
      record.code,
      record.status,
      record.rawMessage ?? null,
      record.attemptedAt.getTime(),
    );
  }

  async findSuccessful(accountId: string, gameId: GameId, code: string): Promise<RedemptionRecord | null> {
    const placeholders = SUCCESSFUL_STATUSES.map(() => '?').join(', ');
    const row = this.db
      .prepare(
        `SELECT * FROM redemption_records
         WHERE account_id = ? AND game_id = ? AND code = ? AND status IN (${placeholders})
         ORDER BY attempted_at DESC LIMIT 1`,
      )
      .get(accountId, gameId.value, code, ...SUCCESSFUL_STATUSES) as RecordRow | undefined;
    return row ? toDomain(row) : null;
  }

  async findHistory(filter: {
    gameId?: GameId;
    accountId?: string;
    status?: RedemptionStatus;
    limit?: number;
  }): Promise<RedemptionRecord[]> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    if (filter.gameId) {
      conditions.push('game_id = ?');
      params.push(filter.gameId.value);
    }
    if (filter.accountId) {
      conditions.push('account_id = ?');
      params.push(filter.accountId);
    }
    if (filter.status) {
      conditions.push('status = ?');
      params.push(filter.status);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filter.limit ?? 100;
    const rows = this.db
      .prepare(`SELECT * FROM redemption_records ${where} ORDER BY attempted_at DESC LIMIT ?`)
      .all(...params, limit) as unknown as RecordRow[];
    return rows.map(toDomain);
  }
}
