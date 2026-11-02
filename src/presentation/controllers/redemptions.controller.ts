import { Controller, Get, Inject, Query } from '@nestjs/common';
import { TOKENS } from '../../infrastructure/di-tokens';
import type { ListRedemptionsQuery } from '../../application/use-cases/queries';
import { GameId } from '../../domain/games/game-id';
import { RedemptionStatus } from '../../domain/redemptions/redemption-record';
import { serializeRecord } from '../serializers';

@Controller('redemptions')
export class RedemptionsController {
  constructor(@Inject(TOKENS.ListRedemptions) private readonly history: ListRedemptionsQuery) {}

  @Get()
  async list(
    @Query('gameId') gameId?: string,
    @Query('accountId') accountId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const records = await this.history.execute({
      gameId: gameId ? (GameId.from(gameId) as GameId) : undefined,
      accountId,
      status: status && status in RedemptionStatus ? (status as RedemptionStatus) : undefined,
      limit: limit ? Math.min(parseInt(limit, 10) || 100, 500) : undefined,
    });
    return records.map(serializeRecord);
  }
}
