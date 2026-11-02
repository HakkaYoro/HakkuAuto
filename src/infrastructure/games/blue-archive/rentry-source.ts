import { fetchText } from '../../http/http';
import type { ScrapedCodeEntry } from '../../../application/ports/driven/code-source.port';

const RENTRY_URL = 'https://rentry.org/CouponBA';
// The /raw endpoint is gated behind a secret code, so we parse the rendered HTML.
// ponytail: one shared expiry for the whole page; per-section dates if the page ever splits them

const H3_CODE = /<h3[^>]*>\s*<span[^>]*>([A-Za-z0-9_-]+)<\/span>/g;
const VALID_UNTIL = /Valid until (\d{4})\/(\d{2})\/(\d{2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?\s*\(UTC\)/i;

function parseValidUntil(html: string): Date | undefined {
  const m = VALID_UNTIL.exec(html);
  if (!m) return undefined;
  const [, y, mo, d, hh, mm, ampm] = m;
  let hour = parseInt(hh, 10);
  if (ampm?.toUpperCase() === 'PM' && hour < 12) hour += 12;
  if (ampm?.toUpperCase() === 'AM' && hour === 12) hour = 0;
  return new Date(Date.UTC(+y, +mo - 1, +d, hour, +mm));
}

export async function fetchRentryCodes(): Promise<ScrapedCodeEntry[]> {
  const html = await fetchText(RENTRY_URL);
  const expiresAt = parseValidUntil(html);
  const entries: ScrapedCodeEntry[] = [];
  for (const match of html.matchAll(H3_CODE)) {
    entries.push({ code: match[1], expiresAt, sourceUrl: RENTRY_URL });
  }
  return entries;
}
