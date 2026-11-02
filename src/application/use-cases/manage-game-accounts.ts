import { GameAccount, AccountNotFoundError } from '../../domain/accounts/game-account';
import { validateAccountInput } from '../../domain/accounts/credentials';
import type { GameAccountRepository } from '../../domain/accounts/game-account.repository';
import type { GameCatalogPort } from '../ports/driven/game-catalog.port';
import { GameNotFoundError } from '../errors';
import type { GameId } from '../../domain/games/game-id';

export interface AccountInput {
  label: string;
  server: string;
  credentials: Record<string, string>;
  autoRedeem?: boolean;
}

export class RegisterGameAccountUseCase {
  constructor(
    private readonly catalog: GameCatalogPort,
    private readonly accounts: GameAccountRepository,
  ) {}

  async execute(gameId: GameId, input: AccountInput): Promise<GameAccount> {
    const definition = this.requireDefinition(gameId);
    validateAccountInput(definition, { server: input.server, credentials: input.credentials });

    const account = GameAccount.create({
      id: crypto.randomUUID(),
      gameId,
      label: input.label,
      server: input.server,
      credentials: input.credentials,
      autoRedeem: input.autoRedeem,
    });
    await this.accounts.save(account);
    return account;
  }

  private requireDefinition(gameId: GameId) {
    const definition = this.catalog.get(gameId);
    if (!definition) throw new GameNotFoundError(gameId.value);
    return definition;
  }
}

export interface AccountPatch {
  label?: string;
  server?: string;
  credentials?: Record<string, string>;
  autoRedeem?: boolean;
}

export class UpdateGameAccountUseCase {
  constructor(
    private readonly catalog: GameCatalogPort,
    private readonly accounts: GameAccountRepository,
  ) {}

  async execute(accountId: string, patch: AccountPatch): Promise<GameAccount> {
    const account = await this.accounts.findById(accountId);
    if (!account) throw new AccountNotFoundError(accountId);

    if (patch.label !== undefined) account.rename(patch.label);
    if (patch.autoRedeem !== undefined) {
      if (patch.autoRedeem) account.enableAutoRedeem();
      else account.disableAutoRedeem();
    }
    if (patch.server !== undefined || patch.credentials !== undefined) {
      const definition = this.catalog.get(account.gameId);
      if (!definition) throw new GameNotFoundError(account.gameId.value);
      const server = patch.server ?? account.server;
      const credentials = { ...account.credentials, ...patch.credentials };
      validateAccountInput(definition, { server, credentials });
      account.updateCredentials(server, credentials);
    }

    await this.accounts.save(account);
    return account;
  }
}

export class DeleteGameAccountUseCase {
  constructor(private readonly accounts: GameAccountRepository) {}

  async execute(accountId: string): Promise<void> {
    const account = await this.accounts.findById(accountId);
    if (!account) throw new AccountNotFoundError(accountId);
    await this.accounts.delete(accountId);
  }
}
