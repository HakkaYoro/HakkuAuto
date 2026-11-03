import { describe, it, expect } from 'vitest';
import { parseSousehaCoupons } from './souseha-source';

// Verbatim GET https://api-browndust2-wiki.souseha.com/coupon response (2026-11-02).
const REAL_RESPONSE = {
  success: true,
  data: [
    {
      id: 'ecb8153d-0ca5-4cc5-95ca-babe9285f97f',
      code: '2026BD2NOV',
      content: '抽抽樂券 x3',
      content_CN: '抽抽乐券 x3',
      content_en: 'Draw Ticket(s) x3',
      content_ja: 'ガチャ券 x3',
      content_ko: '뽑기권 x3',
      startDate: null,
      endDate: 1796054340000,
      createdAt: 1793520940524,
      updatedAt: 1793520940524,
    },
    {
      id: '718f2191-79d1-48f1-88a4-8a35d6649f2d',
      code: 'BD2RADIOMINE',
      content: '抽抽樂券 x3',
      content_CN: '抽抽乐券 x3',
      content_en: 'Draw Ticket(s) x3',
      content_ja: 'ガチャ券 x3',
      content_ko: '뽑기권 x3',
      startDate: null,
      endDate: 1796054340000,
      createdAt: 1790825428221,
      updatedAt: 1793611333668,
    },
    {
      id: '3500bed9-9eac-4ee7-9566-ed6001015d7b',
      code: 'COFFEEWITHMASTER',
      content: '鑽石 x600 & 咖啡與吉拿棒',
      content_CN: '钻石 x600 & 咖啡与吉拿棒',
      content_en: 'Dia x600 & (Coffee & Churros)',
      content_ja: 'ダイヤ x600 & コーヒーとチュロス',
      content_ko: '다이아 x600 & 커피와 추로스',
      startDate: null,
      endDate: null,
      createdAt: 1790173520561,
      updatedAt: 1790173520561,
    },
  ],
};

describe('parseSousehaCoupons', () => {
  it('maps the real BD2DB coupon response', () => {
    const entries = parseSousehaCoupons(REAL_RESPONSE);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toEqual({
      code: '2026BD2NOV',
      reward: 'Draw Ticket(s) x3',
      expiresAt: new Date(1796054340000),
      sourceUrl: 'https://browndust2-db.souseha.com/en/',
    });
    expect(entries[2].code).toBe('COFFEEWITHMASTER');
    expect(entries[2].expiresAt).toBeUndefined();
  });

  it('returns [] on unexpected shapes without throwing', () => {
    expect(parseSousehaCoupons({})).toEqual([]);
    expect(parseSousehaCoupons([])).toEqual([]);
    expect(parseSousehaCoupons({ data: [] })).toEqual([]);
    expect(parseSousehaCoupons({ data: [{ code: '   ' }, { code: 42 }, 'junk'] })).toEqual([]);
  });

  it('treats hostile endDate as never-expires instead of Invalid Date', () => {
    // Beyond 8.64e15 ms new Date() is Invalid Date; its getTime() (NaN) binds as NULL
    // in node:sqlite and would silently turn the code into "never expires".
    const entries = parseSousehaCoupons({
      data: [
        { code: 'TOOHUGE1', endDate: 1e308 },
        { code: 'TOOHUGE2', endDate: 8.64e15 + 1 },
        { code: 'ATLIMIT', endDate: 8.64e15 }, // exact ECMAScript ceiling: still a valid date
        { code: 'NEGATIVE', endDate: -5 },
        { code: 'GARBAGE', endDate: 'soon' },
      ],
    });
    expect(entries.map((e) => e.code)).toEqual(['TOOHUGE1', 'TOOHUGE2', 'ATLIMIT', 'NEGATIVE', 'GARBAGE']);
    expect(entries[0].expiresAt).toBeUndefined();
    expect(entries[1].expiresAt).toBeUndefined();
    expect(entries[2].expiresAt).toEqual(new Date(8.64e15));
    expect(entries[3].expiresAt).toBeUndefined();
    expect(entries[4].expiresAt).toBeUndefined();
  });
});
