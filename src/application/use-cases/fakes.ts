import type { GameCodeRepository } from '../../domain/codes/game-code.repository';
import { GameCode, CodeStatus } from '../../domain/codes/game-code';
import type { GameAccountRepository } from '../../domain/accounts/game-account.repository';
import { GameAccount } from '../../domain/accounts/game-account';
import type { RedemptionRecordRepository } from '../../domain/redemptions/redemption-record.repository';
import { RedemptionRecord, RedemptionStatus } from '../../domain/redemptions/redemption-record';
import type { GameCatalogPort } from '../ports/driven/game-catalog.port';
import type { GameDefinition } from '../../domain/games/game-definition';
import type { CodeSourcePort, ScrapedCodeEntry } from '../ports/driven/code-source.port';
import type { RedemptionGatewayPort, RedemptionResult } from '../ports/driven/redemption-gateway.port';
import type { EventPublisherPort } from '../ports/driven/event-publisher.port';
import type { DomainEvent } from '../../domain/shared/entity';
import { GameId } from '../../domain/games/game-id';

/** Test doubles for the driven ports (see fakes usage in *.test.ts). */

export class FakeCatalog implements GameCatalogPort {
  constructor(public definitions: GameDefinition[]) {}
  list(): GameDefinition[] {
    return this.definitions;
  }
  get(gameId: GameId): GameDefinition | undefined {
    return this.definitions.find((d) => d.id.equals(gameId));
  }
}

export class FakeCodeSource implements CodeSourcePort {
  entries: ScrapedCodeEntry[] = [];
  fetchCalls = 0;
  async fetchLatest(): Promise<ScrapedCodeEntry[]> {
    this.fetchCalls++;
    return this.entries;
  }
}

export class FakeGateway implements RedemptionGatewayPort {
  result: RedemptionResult = { status: RedemptionStatus.SUCCESS };
  calls: Array<{ account: GameAccount; code: GameCode }> = [];
  async redeem(account: GameAccount, code: GameCode): Promise<RedemptionResult> {
    this.calls.push({ account, code });
    return this.result;
  }
}

export class SpyPublisher implements EventPublisherPort {
  events: DomainEvent[] = [];
  async publish(event: DomainEvent): Promise<void> {
    this.events.push(event);
  }
}

export class InMemoryCodeRepository implements GameCodeRepository {
  private byKey = new Map<string, GameCode>();
  async save(code: GameCode): Promise<void> {
    this.byKey.set(code.id.toString(), code);
  }
  async findByKey(key: { gameId: GameId; code: string }): Promise<GameCode | null> {
    return this.byKey.get(`${key.gameId.value}:${key.code}`) ?? null;
  }
  async findByGame(gameId: GameId, status?: CodeStatus): Promise<GameCode[]> {
    return [...this.byKey.values()].filter((c) => c.gameId.equals(gameId) && (!status || c.status === status));
  }
  async findByGameAndCodes(gameId: GameId, codes: string[]): Promise<GameCode[]> {
    const set = new Set(codes.map((c) => c.toUpperCase()));
    return [...this.byKey.values()].filter((c) => c.gameId.equals(gameId) && set.has(c.code));
  }
}

export class InMemoryAccountRepository implements GameAccountRepository {
  private byId = new Map<string, GameAccount>();
  async save(account: GameAccount): Promise<void> {
    this.byId.set(account.id, account);
  }
  async findById(id: string): Promise<GameAccount | null> {
    return this.byId.get(id) ?? null;
  }
  async findByGame(gameId: GameId): Promise<GameAccount[]> {
    return [...this.byId.values()].filter((a) => a.gameId.equals(gameId));
  }
  async findByGameWithAutoRedeem(gameId: GameId): Promise<GameAccount[]> {
    return [...this.byId.values()].filter((a) => a.gameId.equals(gameId) && a.autoRedeem);
  }
  async delete(id: string): Promise<void> {
    this.byId.delete(id);
  }
}

export class InMemoryRecordRepository implements RedemptionRecordRepository {
  records: RedemptionRecord[] = [];
  async save(record: RedemptionRecord): Promise<void> {
    this.records.push(record);
  }
  async findSuccessful(accountId: string, gameId: GameId, code: string): Promise<RedemptionRecord | null> {
    return (
      this.records.find(
        (r) =>
          r.accountId === accountId &&
          r.gameId.equals(gameId) &&
          r.code === code &&
          r.wasSuccessful(),
      ) ?? null
    );
  }
  async findHistory(filter: { gameId?: GameId; accountId?: string; status?: RedemptionStatus; limit?: number }): Promise<
    RedemptionRecord[]
  > {
    const found = this.records.filter(
      (r) =>
        (!filter.gameId || r.gameId.equals(filter.gameId)) &&
        (!filter.accountId || r.accountId === filter.accountId) &&
        (!filter.status || r.status === filter.status),
    );
    return filter.limit ? found.slice(-filter.limit) : found;
  }
}

export const TEST_DEFINITION: GameDefinition = {
  id: GameId.create('test-game'),
  name: 'Test Game',
  redemptionUrl: 'https://example.com/redeem',
  servers: [
    { value: 's1', label: 'Server 1' },
    { value: 's2', label: 'Server 2' },
  ],
  accountFields: [{ key: 'uid', type: 'text', required: true, helpKey: 'help.uid' }],
  theme: { accent: '#fff', accentSoft: '#eee' },
  enabled: true,
};
