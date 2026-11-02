import type { GameAccountRepository } from '../../domain/accounts/game-account.repository';
import { AccountNotFoundError } from '../../domain/accounts/game-account';
import type { GameCodeRepository } from '../../domain/codes/game-code.repository';
import type { RedemptionRecordRepository } from '../../domain/redemptions/redemption-record.repository';
import { RedemptionRecord } from '../../domain/redemptions/redemption-record';
import { CodeNotFoundError } from '../errors';
import type { RedemptionGatewayPort } from '../ports/driven/redemption-gateway.port';
import { CodeKey } from '../../domain/codes/code-key';

export interface RedeemCommand {
  accountId: string;
  code: string;
}

/** Redeems one code on one account and records the attempt (append-only). */
export class RedeemCodeToAccountUseCase {
  constructor(
    private readonly accounts: GameAccountRepository,
    private readonly codes: GameCodeRepository,
    private readonly records: RedemptionRecordRepository,
    private readonly gateway: RedemptionGatewayPort,
  ) {}

  async execute(command: RedeemCommand): Promise<RedemptionRecord> {
    const account = await this.accounts.findById(command.accountId);
    if (!account) throw new AccountNotFoundError(command.accountId);

    const code = await this.codes.findByKey(CodeKey.create(account.gameId, command.code));
    if (!code) throw new CodeNotFoundError(account.gameId.value, command.code);

    const result = await this.gateway.redeem(account, code);

    const record = RedemptionRecord.create({
      id: crypto.randomUUID(),
      accountId: account.id,
      gameId: account.gameId,
      code: code.code,
      status: result.status,
      rawMessage: result.rawMessage,
    });
    await this.records.save(record);
    return record;
  }
}
