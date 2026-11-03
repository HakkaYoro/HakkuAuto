import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { TOKENS } from '../../infrastructure/di-tokens';
import type { GameCatalogPort } from '../../application/ports/driven/game-catalog.port';
import type { GameRegistry } from '../../infrastructure/games/game-plugin';
import { GameNotFoundError } from '../../application/errors';
import type { ListGamesQuery, GameSummary } from '../../application/use-cases/queries';
import type { ListGameCodesQuery } from '../../application/use-cases/queries';
import type { CodeStatus } from '../../domain/codes/game-code';
import { GameId } from '../../domain/games/game-id';
import type { ScanSchedulerService, ScanAndRedeemResult } from '../../infrastructure/scheduler/scan-scheduler.service';
import type { RedeemPendingCodesUseCase, AutoRedeemSummary } from '../../application/use-cases/redeem-pending-codes';
import { VerifyAccountDto } from '../dto/account.dto';
import { serializeCode } from '../serializers';

@Controller('games')
export class GamesController {
  constructor(
    @Inject(TOKENS.ListGames) private readonly listGames: ListGamesQuery,
    @Inject(TOKENS.ListGameCodes) private readonly listCodes: ListGameCodesQuery,
    @Inject(TOKENS.GameRegistry) private readonly registry: GameRegistry,
    @Inject(TOKENS.ScanScheduler) private readonly scheduler: ScanSchedulerService,
    @Inject(TOKENS.RedeemPendingCodes) private readonly redeemPending: RedeemPendingCodesUseCase,
  ) {}

  @Get()
  async games(): Promise<GameSummary[]> {
    return this.listGames.execute();
  }

  @Get(':gameId/codes')
  async codes(@Param('gameId') gameId: string, @Query('status') status?: string) {
    const parsed = GameId.create(gameId);
    const validStatus = status === 'ACTIVE' || status === 'EXPIRED' ? (status as CodeStatus) : undefined;
    const codes = await this.listCodes.execute(parsed, validStatus);
    return codes.map(serializeCode);
  }

  @Post(':gameId/scan')
  async scan(@Param('gameId') gameId: string): Promise<ScanAndRedeemResult> {
    return this.scheduler.scanAndRedeem(GameId.create(gameId));
  }

  @Post(':gameId/redeem-pending')
  async redeemAll(@Param('gameId') gameId: string): Promise<AutoRedeemSummary> {
    return this.redeemPending.execute(GameId.create(gameId));
  }

  /** Live credential check used by the per-game account setup page. */
  @Post(':gameId/verify')
  async verify(@Param('gameId') gameId: string, @Body() input: VerifyAccountDto) {
    const plugin = this.registry.pluginFor(GameId.create(gameId));
    if (!plugin) throw new GameNotFoundError(gameId);
    return plugin.verify(input);
  }
}
