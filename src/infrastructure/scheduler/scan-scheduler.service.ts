import { Injectable, Inject, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Interval, SchedulerRegistry } from '@nestjs/schedule';
import { TOKENS } from '../di-tokens';
import type { ScanGameCodesUseCase } from '../../application/use-cases/scan-game-codes';
import type { ScanResult } from '../../application/use-cases/scan-game-codes';
import type { RedeemPendingCodesUseCase } from '../../application/use-cases/redeem-pending-codes';
import type { AutoRedeemSummary } from '../../application/use-cases/redeem-pending-codes';
import type { GameCatalogPort } from '../../application/ports/driven/game-catalog.port';
import type { GameId } from '../../domain/games/game-id';

export interface ScanAndRedeemResult {
  scan: ScanResult;
  autoRedeem: AutoRedeemSummary | null;
}

/** Cron entry point of the full-auto flow: scan sources, then redeem what's new. */
@Injectable()
export class ScanSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScanSchedulerService.name);
  private running = false;

  constructor(
    @Inject(TOKENS.GameCatalog) private readonly catalog: GameCatalogPort,
    @Inject(TOKENS.ScanGameCodes) private readonly scan: ScanGameCodesUseCase,
    @Inject(TOKENS.RedeemPendingCodes) private readonly redeemPending: RedeemPendingCodesUseCase,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  /** First scan shortly after boot so the dashboard is never empty. */
  onApplicationBootstrap(): void {
    if (process.env.STARTUP_SCAN === 'false') return;
    const timeout = setTimeout(() => void this.scanAll(), 3000);
    this.schedulerRegistry.addTimeout('startup-scan', timeout);
  }

  /** Default every 30 minutes, configurable with SCAN_MINUTES. */
  @Interval(parseInt(process.env.SCAN_MINUTES ?? '30', 10) * 60 * 1000)
  async scanAll(): Promise<void> {
    if (this.running) return; // previous pass still in flight
    this.running = true;
    try {
      // ponytail: games scanned sequentially on purpose — stagger requests to external sources
      for (const definition of this.catalog.list()) {
        if (!definition.enabled) continue;
        try {
          const result = await this.scanAndRedeem(definition.id);
          if (result.scan.discovered > 0 || result.scan.invalid > 0) {
            this.logger.log(
              `${definition.name}: +${result.scan.discovered} new, ${result.scan.updated} updated` +
                (result.autoRedeem ? `, auto-redeemed ${result.autoRedeem.successful}/${result.autoRedeem.attempts}` : ''),
            );
          }
        } catch (err) {
          this.logger.warn(`scan failed for ${definition.name}: ${(err as Error).message}`);
        }
      }
    } finally {
      this.running = false;
    }
  }

  /** Manual trigger path (API): scan one game and auto-redeem if anything is new. */
  async scanAndRedeem(gameId: GameId): Promise<ScanAndRedeemResult> {
    const scan = await this.scan.execute(gameId);
    const autoRedeem = scan.discovered > 0 ? await this.redeemPending.execute(gameId) : null;
    return { scan, autoRedeem };
  }
}
