import { describe, it, expect } from 'vitest';
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
    expect(acc.label).toBe('Main');
    expect(acc.autoRedeem).toBe(true);
  });

  it('rejects empty labels', () => {
    expect(() => GameAccount.create({ id: 'a1', gameId: BA.id, label: '  ', server: 'global', credentials: {} })).toThrow(
      InvalidAccountError,
    );
  });

  it('validateAccountInput enforces schema from the game definition', () => {
    expect(() => validateAccountInput(BA, { server: 'global', credentials: { memberCode: 'X' } })).not.toThrow();
    expect(() => validateAccountInput(BA, { server: 'korea', credentials: { memberCode: 'X' } })).toThrow(InvalidAccountError);
    expect(() => validateAccountInput(BA, { server: 'global', credentials: {} })).toThrow(InvalidAccountError);
  });

  it('credential updates are copied (no shared references)', () => {
    const creds = { memberCode: 'A' };
    const acc = GameAccount.create({ id: 'a1', gameId: BA.id, label: 'Main', server: 'global', credentials: creds });
    creds.memberCode = 'B';
    expect(acc.credentials.memberCode).toBe('A');
    acc.updateCredentials('japan', { memberCode: 'C' });
    expect(acc.server).toBe('japan');
    expect(acc.credentials.memberCode).toBe('C');
  });
});
