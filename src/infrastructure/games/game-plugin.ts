import type { GameDefinition } from '../../domain/games/game-definition';
import type { GameId } from '../../domain/games/game-id';
import type { GameAccount } from '../../domain/accounts/game-account';
import type { GameCode } from '../../domain/codes/game-code';
import type { ScrapedCodeEntry } from '../../application/ports/driven/code-source.port';
import type { RedemptionResult } from '../../application/ports/driven/redemption-gateway.port';
import { RedemptionStatus } from '../../domain/redemptions/redemption-record';
import type { GameCatalogPort } from '../../application/ports/driven/game-catalog.port';
import type { CodeSourcePort } from '../../application/ports/driven/code-source.port';
import type { RedemptionGatewayPort } from '../../application/ports/driven/redemption-gateway.port';

export interface AccountVerifyInput {
  server: string;
  credentials: Record<string, string>;
}

/**
 * A game plugin = metadata + scraping + redemption. Adding a game means
 * adding one folder under infrastructure/games and registering it here.
 */
export interface GamePlugin {
  definition: GameDefinition;
  fetchCodes(): Promise<ScrapedCodeEntry[]>;
  redeem(account: GameAccount, code: GameCode): Promise<RedemptionResult>;
  /** Live-check of account credentials, used by the account setup page. */
  verify(input: AccountVerifyInput): Promise<{ ok: boolean; message?: string }>;
}

/** Composition of all plugins: implements the driven ports the application knows. */
export class GameRegistry implements GameCatalogPort, CodeSourcePort, RedemptionGatewayPort {
  constructor(private readonly plugins: GamePlugin[]) {}

  list(): GameDefinition[] {
    return this.plugins.map((p) => p.definition);
  }

  get(gameId: GameId): GameDefinition | undefined {
    return this.plugins.find((p) => p.definition.id.equals(gameId))?.definition;
  }

  async fetchLatest(gameId: GameId): Promise<ScrapedCodeEntry[]> {
    const plugin = this.plugins.find((p) => p.definition.id.equals(gameId));
    return plugin ? plugin.fetchCodes() : [];
  }

  async redeem(account: GameAccount, code: GameCode): Promise<RedemptionResult> {
    const plugin = this.plugins.find((p) => p.definition.id.equals(account.gameId));
    if (!plugin) return { status: RedemptionStatus.FAILED, rawMessage: `no plugin registered for ${account.gameId.value}` };
    return plugin.redeem(account, code);
  }

  /** Find a plugin by id — presentation uses this for the verify endpoint. */
  pluginFor(gameId: GameId): GamePlugin | undefined {
    return this.plugins.find((p) => p.definition.id.equals(gameId));
  }
}
