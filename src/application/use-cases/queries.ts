import type { GameCatalogPort } from '../ports/driven/game-catalog.port';
import type { GameCodeRepository } from '../../domain/codes/game-code.repository';
import type { GameAccountRepository } from '../../domain/accounts/game-account.repository';
import type { RedemptionRecordRepository } from '../../domain/redemptions/redemption-record.repository';
import type { GameId } from '../../domain/games/game-id';
import type { GameCode, CodeStatus } from '../../domain/codes/game-code';
import type { GameAccount } from '../../domain/accounts/game-account';
import type { RedemptionRecord } from '../../domain/redemptions/redemption-record';
import { RedemptionStatus } from '../../domain/redemptions/redemption-record';
import type { GameTheme, ServerOption, AccountField } from '../../domain/games/game-definition';

/** Dashboard read model: every game with its catalog and account counts (JSON-ready). */
export interface GameSummary {
  id: string;
  name: string;
  redemptionUrl: string;
  servers: ServerOption[];
  accountFields: AccountField[];
  theme: GameTheme;
  enabled: boolean;
  activeCodes: number;
  accounts: number;
}

export class ListGamesQuery {
  constructor(
    private readonly catalog: GameCatalogPort,
    private readonly codes: GameCodeRepository,
    private readonly accounts: GameAccountRepository,
  ) {}

  async execute(): Promise<GameSummary[]> {
    return Promise.all(
      this.catalog.list().map(async (definition) => ({
        id: definition.id.value,
        name: definition.name,
        redemptionUrl: definition.redemptionUrl,
        servers: definition.servers,
        accountFields: definition.accountFields,
        theme: definition.theme,
        enabled: definition.enabled,
        activeCodes: (await this.codes.findByGame(definition.id, CodeStatus.ACTIVE)).length,
        accounts: (await this.accounts.findByGame(definition.id)).length,
      })),
    );
  }
}

export class ListGameCodesQuery {
  constructor(private readonly codes: GameCodeRepository) {}

  async execute(gameId: GameId, status?: CodeStatus): Promise<GameCode[]> {
    const codes = await this.codes.findByGame(gameId, status);
    return codes.sort((a, b) => b.discoveredAt.getTime() - a.discoveredAt.getTime());
    // ponytail: expiry is computed on read (code.expiresAt); no cron flips DB rows
  }
}

export class ListGameAccountsQuery {
  constructor(private readonly accounts: GameAccountRepository) {}

  async execute(gameId: GameId): Promise<GameAccount[]> {
    return this.accounts.findByGame(gameId);
  }
}

export class ListRedemptionsQuery {
  constructor(private readonly records: RedemptionRecordRepository) {}

  async execute(filter: { gameId?: GameId; accountId?: string; status?: RedemptionStatus; limit?: number }): Promise<
    RedemptionRecord[]
  > {
    return this.records.findHistory(filter);
  }
}
