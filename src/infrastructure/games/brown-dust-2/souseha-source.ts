import { getJson } from '../../http/http';
import type { ScrapedCodeEntry } from '../../../application/ports/driven/code-source.port';

// BD2DB (browndust2-db.souseha.com) is a client-side SPA: the homepage "Coupon Codes"
// section XHRs GET {API}/coupon → {success, data: [{code, content_en, endDate, ...}]}.
// Discovered 2026-11-02 in the SPA bundle (HomeView-C16xbwGz.js). endDate is epoch ms
// or null (never expires); expired codes are filtered server-side.
// ponytail: single unauthenticated JSON endpoint today; if it grows auth, scrape the official news page here instead
const API_COUPON_URL = 'https://api-browndust2-wiki.souseha.com/coupon';
const SOURCE_URL = 'https://browndust2-db.souseha.com/en/';

// Beyond ECMAScript's date ceiling new Date(ms) is Invalid Date; its getTime() (NaN)
// binds as NULL in node:sqlite, silently erasing expiry — reject instead.
const MAX_EPOCH_MS = 8.64e15;

interface SousehaCoupon {
  code?: unknown;
  content_en?: unknown;
  content?: unknown;
  endDate?: unknown;
}

export function parseSousehaCoupons(json: unknown): ScrapedCodeEntry[] {
  const rows = (json as { data?: unknown } | null | undefined)?.data;
  if (!Array.isArray(rows)) return [];

  const entries: ScrapedCodeEntry[] = [];
  for (const row of rows) {
    const coupon = row as SousehaCoupon;
    const code = typeof coupon?.code === 'string' ? coupon.code.trim() : '';
    if (!code) continue;

    const reward = [coupon.content_en, coupon.content]
      .find((c): c is string => typeof c === 'string' && c.trim() !== '')
      ?.trim();
    const endDate = Number(coupon.endDate); // NaN/Infinity fail both comparisons
    const expiresAt = endDate > 0 && endDate <= MAX_EPOCH_MS ? new Date(endDate) : undefined;

    entries.push({ code, reward: reward || undefined, expiresAt, sourceUrl: SOURCE_URL });
  }
  return entries;
}

export async function fetchSousehaCodes(): Promise<ScrapedCodeEntry[]> {
  return parseSousehaCoupons(await getJson<unknown>(API_COUPON_URL));
}
