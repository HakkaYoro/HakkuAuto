import { describe, it, beforeEach, expect } from 'vitest';
import { ScanGameCodesUseCase } from './scan-game-codes';
import { RedeemCodeToAccountUseCase } from './redeem-code-to-account';
import { RedeemPendingCodesUseCase } from './redeem-pending-codes';
import { FakeCatalog, FakeCodeSource, FakeGateway, SpyPublisher, InMemoryCodeRepository, InMemoryAccountRepository, InMemoryRecordRepository, TEST_DEFINITION } from './fakes';
import { GameId } from '../../domain/games/game-id';
import { RedemptionStatus } from '../../domain/redemptions/redemption-record';
import { GameAccount } from '../../domain/accounts/game-account';
import { CodeDiscovered } from '../../domain/codes/events';

const GAME = GameId.create('test-game');

function build() {
  const catalog = new FakeCatalog([TEST_DEFINITION]);
  const source = new FakeCodeSource();
  const codes = new InMemoryCodeRepository();
  const accounts = new InMemoryAccountRepository();
  const records = new InMemoryRecordRepository();
  const gateway = new FakeGateway();
  const publisher = new SpyPublisher();
  return {
    catalog,
    source,
    codes,
    accounts,
    records,
    gateway,
    publisher,
    scan: new ScanGameCodesUseCase(catalog, source, codes, publisher),
    redeemOne: new RedeemCodeToAccountUseCase(accounts, codes, records, gateway),
    redeemAll: new RedeemPendingCodesUseCase(accounts, codes, records, gateway, 0),
  };
}

describe('ScanGameCodesUseCase', () => {
  let ctx: ReturnType<typeof build>;
  beforeEach(() => (ctx = build()));

  it('discovers new codes and publishes CodeDiscovered once', async () => {
    ctx.source.entries = [{ code: 'code1', reward: '100 gems' }];
    const result = await ctx.scan.execute(GAME);
    expect({ discovered: result.discovered, updated: result.updated, invalid: result.invalid }).toEqual({
      discovered: 1,
      updated: 0,
      invalid: 0,
    });
    expect(ctx.publisher.events).toHaveLength(1);
    expect(ctx.publisher.events[0]).toBeInstanceOf(CodeDiscovered);

    const again = await ctx.scan.execute(GAME);
    expect(again.discovered).toBe(0);
    expect(ctx.publisher.events).toHaveLength(1); // no duplicate events on rescan
  });

  it('skips invalid scraped codes and refreshes changed metadata', async () => {
    ctx.source.entries = [{ code: 'BAD!!' }];
    expect((await ctx.scan.execute(GAME)).invalid).toBe(1);

    ctx.source.entries = [{ code: 'CODE1', reward: '100 gems' }];
    await ctx.scan.execute(GAME);
    ctx.source.entries = [{ code: 'CODE1', reward: '200 gems' }];
    const result = await ctx.scan.execute(GAME);
    expect({ discovered: result.discovered, updated: result.updated }).toEqual({ discovered: 0, updated: 1 });
    const stored = await ctx.codes.findByKey({ gameId: GAME, code: 'CODE1' });
    expect(stored?.reward).toBe('200 gems');
  });

  it('rejects unknown games', async () => {
    await expect(ctx.scan.execute(GameId.create('nope'))).rejects.toThrow(/not registered/);
  });
});

describe('RedeemCodeToAccountUseCase', () => {
  let ctx: ReturnType<typeof build>;
  beforeEach(async () => {
    ctx = build();
    await ctx.accounts.save(
      GameAccount.create({ id: 'acc-1', gameId: GAME, label: 'Main', server: 's1', credentials: { uid: '123' } }),
    );
    ctx.source.entries = [{ code: 'CODE1' }];
    await ctx.scan.execute(GAME);
  });

  it('redeems and records the attempt', async () => {
    const record = await ctx.redeemOne.execute({ accountId: 'acc-1', code: 'code1' });
    expect(record.status).toBe(RedemptionStatus.SUCCESS);
    expect(ctx.records.records).toHaveLength(1);
    expect(ctx.gateway.calls[0].account.id).toBe('acc-1');
  });

  it('records failed gateway results too', async () => {
    ctx.gateway.result = { status: RedemptionStatus.EXPIRED, rawMessage: 'code expired' };
    const record = await ctx.redeemOne.execute({ accountId: 'acc-1', code: 'CODE1' });
    expect(record.status).toBe(RedemptionStatus.EXPIRED);
    expect(record.rawMessage).toBe('code expired');
  });

  it('404s on unknown account or code', async () => {
    await expect(ctx.redeemOne.execute({ accountId: 'nope', code: 'CODE1' })).rejects.toThrow(/not found/);
    await expect(ctx.redeemOne.execute({ accountId: 'acc-1', code: 'MISSING1' })).rejects.toThrow(/not found/);
  });
});

describe('RedeemPendingCodesUseCase', () => {
  let ctx: ReturnType<typeof build>;
  beforeEach(async () => {
    ctx = build();
    ctx.source.entries = [
      { code: 'CODE1' },
      { code: 'CODE2' },
      { code: 'CODE3', expiresAt: new Date(Date.now() - 1000) },
    ];
    await ctx.scan.execute(GAME);
    await ctx.accounts.save(
      GameAccount.create({ id: 'acc-1', gameId: GAME, label: 'Auto', server: 's1', credentials: { uid: '1' }, autoRedeem: true }),
    );
    await ctx.accounts.save(
      GameAccount.create({ id: 'acc-2', gameId: GAME, label: 'Manual', server: 's1', credentials: { uid: '2' }, autoRedeem: false }),
    );
  });

  it('redeems every active code on autoRedeem accounts only, never twice', async () => {
    const first = await ctx.redeemAll.execute(GAME);
    expect({ attempts: first.attempts, successful: first.successful }).toEqual({ attempts: 2, successful: 2 });
    expect(ctx.gateway.calls.every((c) => c.account.id === 'acc-1')).toBe(true); // manual account untouched

    const second = await ctx.redeemAll.execute(GAME);
    expect(second.attempts).toBe(0); // successful codes skipped, expired code skipped
    expect(second.successful).toBe(0);
    expect(ctx.gateway.calls).toHaveLength(2);
  });

  it('treats EXPIRED as terminal: no attempts on the second pass', async () => {
    ctx.gateway.result = { status: RedemptionStatus.EXPIRED, rawMessage: 'code expired' };
    expect((await ctx.redeemAll.execute(GAME)).attempts).toBe(2);
    expect((await ctx.redeemAll.execute(GAME)).attempts).toBe(0);
    expect(ctx.gateway.calls).toHaveLength(2);
  });

  it('treats ALREADY_USED as terminal: no attempts on the second pass', async () => {
    ctx.gateway.result = { status: RedemptionStatus.ALREADY_USED };
    expect((await ctx.redeemAll.execute(GAME)).attempts).toBe(2);
    expect((await ctx.redeemAll.execute(GAME)).attempts).toBe(0);
    expect(ctx.gateway.calls).toHaveLength(2);
  });

  it('retries FAILED on the next scan', async () => {
    ctx.gateway.result = { status: RedemptionStatus.FAILED, rawMessage: 'network hiccup' };
    expect((await ctx.redeemAll.execute(GAME)).attempts).toBe(2);
    expect((await ctx.redeemAll.execute(GAME)).attempts).toBe(2);
    expect(ctx.gateway.calls).toHaveLength(4);
  });

  it('retries NEEDS_MANUAL on the next scan', async () => {
    ctx.gateway.result = { status: RedemptionStatus.NEEDS_MANUAL, rawMessage: 'captcha' };
    expect((await ctx.redeemAll.execute(GAME)).attempts).toBe(2);
    expect((await ctx.redeemAll.execute(GAME)).attempts).toBe(2);
    expect(ctx.gateway.calls).toHaveLength(4);
  });
});
