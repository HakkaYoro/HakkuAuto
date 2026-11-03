import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import type { DatabaseSync } from 'node:sqlite';
import { TOKENS } from './infrastructure/di-tokens';
import { GameRegistry } from './infrastructure/games/game-plugin';
import { blueArchivePlugin } from './infrastructure/games/blue-archive/plugin';
import { stellaSoraPlugin } from './infrastructure/games/stella-sora/plugin';
import { brownDust2Plugin } from './infrastructure/games/brown-dust-2/plugin';
import { getDatabase } from './infrastructure/persistence/sqlite/sqlite-database';
import { SqliteGameCodeRepository } from './infrastructure/persistence/sqlite/game-code.repository';
import { SqliteGameAccountRepository } from './infrastructure/persistence/sqlite/game-account.repository';
import { SqliteRedemptionRecordRepository } from './infrastructure/persistence/sqlite/redemption-record.repository';
import { LoggingEventPublisher } from './infrastructure/events/event-publisher.adapter';
import { ScanSchedulerService } from './infrastructure/scheduler/scan-scheduler.service';
import { ScanGameCodesUseCase } from './application/use-cases/scan-game-codes';
import { RedeemCodeToAccountUseCase } from './application/use-cases/redeem-code-to-account';
import { RedeemPendingCodesUseCase } from './application/use-cases/redeem-pending-codes';
import {
  RegisterGameAccountUseCase,
  UpdateGameAccountUseCase,
  DeleteGameAccountUseCase,
} from './application/use-cases/manage-game-accounts';
import {
  ListGamesQuery,
  ListGameCodesQuery,
  ListGameAccountsQuery,
  ListRedemptionsQuery,
} from './application/use-cases/queries';
import { GamesController } from './presentation/controllers/games.controller';
import { AccountsController } from './presentation/controllers/accounts.controller';
import { RedemptionsController } from './presentation/controllers/redemptions.controller';
import { DomainErrorFilter } from './presentation/filters/domain-error.filter';
import { ApiTokenGuard } from './presentation/guards/api-token.guard';

const DB = Symbol('SqliteDatabase');

/** Composition root: the only place where ports meet adapters. */
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [GamesController, AccountsController, RedemptionsController],
  providers: [
    // Boundary enforcement: without APP_PIPE the class-validator DTOs never run, so
    // request bodies reach the domain unvalidated. whitelist strips undeclared props.
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, transform: true }) },
    // Without APP_FILTER a filter class in providers is just an unused instance.
    { provide: APP_FILTER, useClass: DomainErrorFilter },
    // Opt-in API auth: guards only Nest routes; the static WebUI in main.ts stays public.
    { provide: APP_GUARD, useClass: ApiTokenGuard },
    { provide: TOKENS.ApiToken, useFactory: () => process.env.API_TOKEN ?? '' },
    { provide: DB, useFactory: () => getDatabase() },
    {
      provide: TOKENS.GameRegistry,
      useFactory: () => new GameRegistry([blueArchivePlugin, stellaSoraPlugin, brownDust2Plugin]),
    },
    { provide: TOKENS.GameCatalog, useExisting: TOKENS.GameRegistry },
    { provide: TOKENS.CodeSource, useExisting: TOKENS.GameRegistry },
    { provide: TOKENS.RedemptionGateway, useExisting: TOKENS.GameRegistry },
    { provide: TOKENS.EventPublisher, useClass: LoggingEventPublisher },
    {
      provide: TOKENS.GameCodeRepository,
      useFactory: (db: DatabaseSync) => new SqliteGameCodeRepository(db),
      inject: [DB],
    },
    {
      provide: TOKENS.GameAccountRepository,
      useFactory: (db: DatabaseSync) => new SqliteGameAccountRepository(db),
      inject: [DB],
    },
    {
      provide: TOKENS.RedemptionRecordRepository,
      useFactory: (db: DatabaseSync) => new SqliteRedemptionRecordRepository(db),
      inject: [DB],
    },
    {
      provide: TOKENS.ScanGameCodes,
      useFactory: (catalog, sources, codes, events) => new ScanGameCodesUseCase(catalog, sources, codes, events),
      inject: [TOKENS.GameCatalog, TOKENS.CodeSource, TOKENS.GameCodeRepository, TOKENS.EventPublisher],
    },
    {
      provide: TOKENS.RedeemCodeToAccount,
      useFactory: (accounts, codes, records, gateway) =>
        new RedeemCodeToAccountUseCase(accounts, codes, records, gateway),
      inject: [TOKENS.GameAccountRepository, TOKENS.GameCodeRepository, TOKENS.RedemptionRecordRepository, TOKENS.RedemptionGateway],
    },
    {
      provide: TOKENS.RedeemPendingCodes,
      useFactory: (accounts, codes, records, gateway) =>
        new RedeemPendingCodesUseCase(accounts, codes, records, gateway, parseInt(process.env.REDEEM_DELAY_MS ?? '1500', 10)),
      inject: [TOKENS.GameAccountRepository, TOKENS.GameCodeRepository, TOKENS.RedemptionRecordRepository, TOKENS.RedemptionGateway],
    },
    {
      provide: TOKENS.RegisterGameAccount,
      useFactory: (catalog, accounts) => new RegisterGameAccountUseCase(catalog, accounts),
      inject: [TOKENS.GameCatalog, TOKENS.GameAccountRepository],
    },
    {
      provide: TOKENS.UpdateGameAccount,
      useFactory: (catalog, accounts) => new UpdateGameAccountUseCase(catalog, accounts),
      inject: [TOKENS.GameCatalog, TOKENS.GameAccountRepository],
    },
    {
      provide: TOKENS.DeleteGameAccount,
      useFactory: (accounts) => new DeleteGameAccountUseCase(accounts),
      inject: [TOKENS.GameAccountRepository],
    },
    {
      provide: TOKENS.ListGames,
      useFactory: (catalog, codes, accounts) => new ListGamesQuery(catalog, codes, accounts),
      inject: [TOKENS.GameCatalog, TOKENS.GameCodeRepository, TOKENS.GameAccountRepository],
    },
    {
      provide: TOKENS.ListGameCodes,
      useFactory: (codes) => new ListGameCodesQuery(codes),
      inject: [TOKENS.GameCodeRepository],
    },
    {
      provide: TOKENS.ListGameAccounts,
      useFactory: (accounts) => new ListGameAccountsQuery(accounts),
      inject: [TOKENS.GameAccountRepository],
    },
    {
      provide: TOKENS.ListRedemptions,
      useFactory: (records) => new ListRedemptionsQuery(records),
      inject: [TOKENS.RedemptionRecordRepository],
    },
    {
      provide: TOKENS.ScanScheduler,
      useClass: ScanSchedulerService,
    },
  ],
})
export class AppModule {}
