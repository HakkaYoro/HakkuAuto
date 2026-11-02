import type { GameCodeRepository } from '../../domain/codes/game-code.repository';
import { GameCode } from '../../domain/codes/game-code';
import { CodeKey } from '../../domain/codes/code-key';
import { GameNotFoundError } from '../errors';
import type { GameCatalogPort } from '../ports/driven/game-catalog.port';
import type { CodeSourcePort } from '../ports/driven/code-source.port';
import type { EventPublisherPort } from '../ports/driven/event-publisher.port';
import type { GameId } from '../../domain/games/game-id';
import type { ScrapedCodeEntry } from '../ports/driven/code-source.port';

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
    const valid: ScrapedCodeEntry[] = [];
    let invalid = 0;
    for (const entry of entries) {
      if (GameCode.isValid(entry.code)) valid.push(entry);
      else invalid++;
    }

    // One query for the whole batch instead of a lookup per code.
    const existing = new Map(
      (await this.codes.findByGameAndCodes(gameId, valid.map((e) => e.code))).map((c) => [c.id.toString(), c]),
    );

    const discovered: GameCode[] = [];
    const refreshed: GameCode[] = [];
    for (const entry of valid) {
      const key = CodeKey.create(gameId, entry.code);
      const known = existing.get(key.toString());
      if (!known) {
        discovered.push(
          GameCode.discover({
            gameId,
            code: entry.code,
            reward: entry.reward,
            expiresAt: entry.expiresAt,
            sourceUrl: entry.sourceUrl,
          }),
        );
      } else if (metadataChanged(known, entry)) {
        // Refresh metadata (e.g. reward text improved by the source), keep original discoveredAt.
        refreshed.push(
          GameCode.fromPersistence({
            key,
            status: known.status,
            reward: entry.reward ?? known.reward,
            expiresAt: entry.expiresAt ?? known.expiresAt,
            sourceUrl: entry.sourceUrl ?? known.sourceUrl,
            discoveredAt: known.discoveredAt,
          }),
        );
      }
    }

    // ponytail: batched writes — sqlite runs synchronously, Promise.all just keeps the code flat
    await Promise.all([...discovered, ...refreshed].map((code) => this.codes.save(code)));
    await Promise.all(discovered.flatMap((code) => code.pullEvents().map((event) => this.events.publish(event))));

    return { gameId: gameId.value, gameName: definition.name, discovered: discovered.length, updated: refreshed.length, invalid };
  }
}

function metadataChanged(existing: GameCode, entry: { reward?: string; expiresAt?: Date }): boolean {
  return (
    (entry.reward !== undefined && entry.reward !== existing.reward) ||
    (entry.expiresAt !== undefined && existing.expiresAt?.getTime() !== entry.expiresAt.getTime())
  );
}
