import { Body, Controller, Delete, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { TOKENS } from '../../infrastructure/di-tokens';
import type { ListGameAccountsQuery } from '../../application/use-cases/queries';
import { GameId } from '../../domain/games/game-id';
import type {
  RegisterGameAccountUseCase,
  AccountInput,
  UpdateGameAccountUseCase,
  AccountPatch,
  DeleteGameAccountUseCase,
} from '../../application/use-cases/manage-game-accounts';
import type { RedeemCodeToAccountUseCase } from '../../application/use-cases/redeem-code-to-account';
import type { RedemptionRecord } from '../../domain/redemptions/redemption-record';
import { CreateAccountDto, UpdateAccountDto, RedeemDto } from '../dto/account.dto';
import { serializeAccount, serializeRecord } from '../serializers';

@Controller('games/:gameId/accounts')
export class AccountsController {
  constructor(
    @Inject(TOKENS.ListGameAccounts) private readonly listAccounts: ListGameAccountsQuery,
    @Inject(TOKENS.RegisterGameAccount) private readonly register: RegisterGameAccountUseCase,
    @Inject(TOKENS.UpdateGameAccount) private readonly update: UpdateGameAccountUseCase,
    @Inject(TOKENS.DeleteGameAccount) private readonly remove: DeleteGameAccountUseCase,
    @Inject(TOKENS.RedeemCodeToAccount) private readonly redeemOne: RedeemCodeToAccountUseCase,
  ) {}

  @Get()
  async list(@Param('gameId') gameId: string): Promise<ReturnType<typeof serializeAccount>[]> {
    const accounts = await this.listAccounts.execute(GameId.create(gameId));
    return accounts.map(serializeAccount);
  }

  @Post()
  async create(@Param('gameId') gameId: string, @Body() dto: CreateAccountDto) {
    const account = await this.register.execute(GameId.create(gameId), dto as AccountInput);
    return serializeAccount(account);
  }

  @Patch(':accountId')
  async patch(@Param('accountId') accountId: string, @Body() dto: UpdateAccountDto) {
    const account = await this.update.execute(accountId, dto as AccountPatch);
    return serializeAccount(account);
  }

  @Delete(':accountId')
  async delete(@Param('accountId') accountId: string): Promise<{ deleted: true }> {
    await this.remove.execute(accountId);
    return { deleted: true };
  }

  /** Manual redemption of one code on this account. */
  @Post(':accountId/redeem')
  async redeem(@Param('accountId') accountId: string, @Body() dto: RedeemDto) {
    const record: RedemptionRecord = await this.redeemOne.execute({ accountId, code: dto.code });
    return serializeRecord(record);
  }
}
