import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS game_codes (
  key           TEXT PRIMARY KEY,
  game_id       TEXT NOT NULL,
  code          TEXT NOT NULL,
  status        TEXT NOT NULL,
  reward        TEXT,
  expires_at    INTEGER,
  source_url    TEXT,
  discovered_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_codes_game ON game_codes(game_id, status);

CREATE TABLE IF NOT EXISTS game_accounts (
  id          TEXT PRIMARY KEY,
  game_id     TEXT NOT NULL,
  label       TEXT NOT NULL,
  server      TEXT NOT NULL,
  credentials TEXT NOT NULL,
  auto_redeem INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_accounts_game ON game_accounts(game_id);

CREATE TABLE IF NOT EXISTS redemption_records (
  id           TEXT PRIMARY KEY,
  account_id   TEXT NOT NULL,
  game_id      TEXT NOT NULL,
  code         TEXT NOT NULL,
  status       TEXT NOT NULL,
  raw_message  TEXT,
  attempted_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_records_lookup ON redemption_records(account_id, game_id, code, status);
CREATE INDEX IF NOT EXISTS idx_records_history ON redemption_records(attempted_at DESC);
`;

let instance: DatabaseSync | null = null;

/** Singleton SQLite connection (node:sqlite, zero native deps). */
export function getDatabase(dataDir?: string): DatabaseSync {
  if (instance) return instance;
  const dir = dataDir ?? process.env.DATA_DIR ?? join(process.cwd(), 'data');
  mkdirSync(dir, { recursive: true });
  instance = new DatabaseSync(join(dir, 'hakku.db'));
  instance.exec('PRAGMA journal_mode = WAL;');
  instance.exec(SCHEMA);
  return instance;
}
