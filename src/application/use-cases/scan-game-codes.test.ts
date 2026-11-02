import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
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
    assert.deepEqual(
      { discovered: result.discovered, updated: result.updated, invalid: result.invalid },
      { discovered: 1, updated: 0, invalid: 0 },
    );
    assert.equal(ctx.publisher.events.length, 1);
    assert.ok(ctx.publisher.events[0] instanceof CodeDiscovered);

    const again = await ctx.scan.execute(GAME);
    assert.equal(again.discovered, 0);
    assert.equal(ctx.publisher.events.length, 1, 'no duplicate events on rescan');
  });

  it('skips invalid scraped codes and refreshes changed metadata', async () => {
    ctx.source.entries = [{ code: 'BAD!!' }];
    assert.equal((await ctx.scan.execute(GAME)).invalid, 1);

    ctx.source.entries = [{ code: 'CODE1', reward: '100 gems' }];
    await ctx.scan.execute(GAME);
    ctx.source.entries = [{ code: 'CODE1', reward: '200 gems' }];
    const result = await ctx.scan.execute(GAME);
    assert.deepEqual(
      { discovered: result.discovered, updated: result.updated },
      { discovered: 0, updated: 1 },
    );
    const stored = await ctx.codes.findByKey({ gameId: GAME, code: 'CODE1' });
    assert.equal(stored?.reward, '200 gems');
  });

  it('rejects unknown games', async () => {
    await assert.rejects(() => ctx.scan.execute(GameId.create('nope')), /not registered/);
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
    assert.equal(record.status, RedemptionStatus.SUCCESS);
    assert.equal(ctx.records.records.length, 1);
    assert.equal(ctx.gateway.calls[0].account.id, 'acc-1');
  });

  it('records failed gateway results too', async () => {
    ctx.gateway.result = { status: RedemptionStatus.EXPIRED, rawMessage: 'code expired' };
    const record = await ctx.redeemOne.execute({ accountId: 'acc-1', code: 'CODE1' });
    assert.equal(record.status, RedemptionStatus.EXPIRED);
    assert.equal(record.rawMessage, 'code expired');
  });

  it('404s on unknown account or code', async () => {
    await assert.rejects(() => ctx.redeemOne.execute({ accountId: 'nope', code: 'CODE1' }), /not found/);
    await assert.rejects(() => ctx.redeemOne.execute({ accountId: 'acc-1', code: 'MISSING1' }), /not found/);
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
    assert.deepEqual({ attempts: first.attempts, successful: first.successful }, { attempts: 2, successful: 2 });
    assert.ok(ctx.gateway.calls.every((c) => c.account.id === 'acc-1'), 'manual account untouched');

    const second = await ctx.redeemAll.execute(GAME);
    assert.equal(second.attempts, 0, 'successful codes skipped, expired code skipped');
    assert.equal(second.successful, 0);
    assert.equal(ctx.gateway.calls.length, 2);
  });
});
