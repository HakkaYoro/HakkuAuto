import { describe, it, expect } from 'vitest';
import { parseCdkList } from './cdklist-source';

// Shape mirrors GET https://raw.githubusercontent.com/Small-tailqwq/Nikke-CDK-Tool/HEAD/public/cdk-list.source.json (2026-11-03).
const LIST = {
  version: 2.5,
  lastUpdate: '2026-11-03T02:45:25.000Z',
  cdks: [
    {
      type: 'group',
      groupId: 'COLLAB',
      groupName: 'Nikke X 剑星',
      note: 'collab CDKs',
      cdks: [
        { code: 'EXPIREDCODE1', name: 'n', reward: '珠宝×100', servers: ['global'], status: '已过期' },
        { code: 'GLOBALACTIVE1', name: 'n', reward: '招募券×5', servers: ['global'], status: '可用' },
        {
          type: 'group',
          groupId: 'SUB',
          groupName: 'sub',
          cdks: [
            { code: 'CNONLYCODE1', name: 'n', reward: '钻石×10', servers: ['cn', 'tw'], status: '可用' },
            { code: 'millioncommanders', name: 'n', servers: ['global'], status: '可用' },
          ],
        },
      ],
    },
    { code: 'TWONLYCODE1', name: 'n', reward: 'x', servers: ['tw'], status: '可用' },
  ],
};

describe('parseCdkList', () => {
  it('flattens nested groups keeping only global + active codes', () => {
    const entries = parseCdkList(LIST);
    expect(entries.map((e) => e.code)).toEqual(['GLOBALACTIVE1', 'millioncommanders']);
    expect(entries[0].reward).toBe('招募券×5');
    expect(entries[0].sourceUrl).toBe('https://github.com/Small-tailqwq/Nikke-CDK-Tool/blob/HEAD/public/cdk-list.source.json');
    // No structured expiry in the source: expiresAt is never set.
    expect(entries.every((e) => e.expiresAt === undefined)).toBe(true);
  });

  it('passes reward through verbatim and leaves a missing reward undefined', () => {
    const entries = parseCdkList(LIST);
    expect(entries[1].reward).toBeUndefined();
  });

  it('returns [] on hostile shapes without throwing', () => {
    expect(parseCdkList(null)).toEqual([]);
    expect(parseCdkList(undefined)).toEqual([]);
    expect(parseCdkList({})).toEqual([]);
    expect(parseCdkList({ cdks: 'nope' })).toEqual([]);
    expect(parseCdkList({ cdks: [null, {}, 'junk', { code: 42 }, { code: '   ', servers: ['global'], status: '可用' }] })).toEqual([]);
  });
});
