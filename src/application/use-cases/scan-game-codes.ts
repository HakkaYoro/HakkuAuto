import type { GameCodeRepository } from '../../domain/codes/game-code.repository';
import { GameCode } from '../../domain/codes/game-code';
import { CodeKey } from '../../domain/codes/code-key';
import { GameNotFoundError } from '../errors';
import type { GameCatalogPort } from '../ports/driven/game-catalog.port';
import type { CodeSourcePort } from '../ports/driven/code-source.port';
import type { EventPublisherPort } from '../ports/driven/event-publisher.port';
import type { GameId } from '../../domain/games/game-id';

export interface ScanResult {
  gameId: string;
  gameName: string;
  discovered: number;
  updated: number;
  invalid: number;
}

/** Scrapes the game's sources and persists new/refreshed codes, emitting CodeDiscovered for new ones. */
export class ScanGameCodesUseCase {
  constructor(
    private readonly catalog: GameCatalogPort,
    private readonly sources: CodeSourcePort,
    private readonly codes: GameCodeRepository,
    private readonly events: EventPublisherPort,
  ) {}

  async execute(gameId: GameId): Promise<ScanResult> {
    const definition = this.catalog.get(gameId);
    if (!definition) throw new GameNotFoundError(gameId.value);

    const entries = await this.sources.fetchLatest(gameId);
    let discovered = 0;
    let updated = 0;
    let invalid = 0;

    for (const entry of entries) {
      if (!GameCode.isValid(entry.code)) {
        invalid++;
        continue;
      }
      const key = CodeKey.create(gameId, entry.code);
      const existing = await this.codes.findByKey(key);
      if (!existing) {
        const code = GameCode.discover({
          gameId,
          code: entry.code,
          reward: entry.reward,
          expiresAt: entry.expiresAt,
          sourceUrl: entry.sourceUrl,
        });
        await this.codes.save(code);
        for (const event of code.pullEvents()) await this.events.publish(event);
        discovered++;
      } else if (metadataChanged(existing, entry)) {
        // Refresh metadata (e.g. reward text improved by the source), keep original discoveredAt.
        const refreshed = GameCode.fromPersistence({
          key: existing.id,
          status: existing.status,
          reward: entry.reward ?? existing.reward,
          expiresAt: entry.expiresAt ?? existing.expiresAt,
          sourceUrl: entry.sourceUrl ?? existing.sourceUrl,
          discoveredAt: existing.discoveredAt,
        });
        await this.codes.save(refreshed);
        updated++;
      }
    }

    return { gameId: gameId.value, gameName: definition.name, discovered, updated, invalid };
  }
}

function metadataChanged(existing: GameCode, entry: { reward?: string; expiresAt?: Date }): boolean {
  return (
    (entry.reward !== undefined && entry.reward !== existing.reward) ||
    (entry.expiresAt !== undefined && existing.expiresAt?.getTime() !== entry.expiresAt.getTime())
  );
}
