import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GameAccount, InvalidAccountError } from './game-account';
import { validateAccountInput } from './credentials';
import { GameId } from '../games/game-id';
import type { GameDefinition } from '../games/game-definition';

const BA: GameDefinition = {
  id: GameId.create('blue-archive'),
  name: 'Blue Archive',
  redemptionUrl: 'https://mcoupon.nexon.com/bluearchive',
  servers: [
    { value: 'global', label: 'Global' },
    { value: 'japan', label: 'Japan' },
  ],
  accountFields: [
    { key: 'memberCode', type: 'text', required: true, helpKey: 'help.memberCode' },
  ],
  theme: { accent: '#4f8ef7' },
  enabled: true,
};

describe('GameAccount', () => {
  it('trims label and defaults autoRedeem to true', () => {
    const acc = GameAccount.create({
      id: 'a1',
      gameId: BA.id,
      label: '  Main  ',
      server: 'global',
      credentials: { memberCode: 'ABCD1234' },
    });
    assert.equal(acc.label, 'Main');
    assert.equal(acc.autoRedeem, true);
  });

  it('rejects empty labels', () => {
    assert.throws(() => GameAccount.create({ id: 'a1', gameId: BA.id, label: '  ', server: 'global', credentials: {} }), InvalidAccountError);
  });

  it('validateAccountInput enforces schema from the game definition', () => {
    assert.doesNotThrow(() => validateAccountInput(BA, { server: 'global', credentials: { memberCode: 'X' } }));
    assert.throws(() => validateAccountInput(BA, { server: 'korea', credentials: { memberCode: 'X' } }), InvalidAccountError);
    assert.throws(() => validateAccountInput(BA, { server: 'global', credentials: {} }), InvalidAccountError);
  });

  it('credential updates are copied (no shared references)', () => {
    const creds = { memberCode: 'A' };
    const acc = GameAccount.create({ id: 'a1', gameId: BA.id, label: 'Main', server: 'global', credentials: creds });
    creds.memberCode = 'B';
    assert.equal(acc.credentials.memberCode, 'A');
    acc.updateCredentials('japan', { memberCode: 'C' });
    assert.equal(acc.server, 'japan');
    assert.equal(acc.credentials.memberCode, 'C');
  });
});
