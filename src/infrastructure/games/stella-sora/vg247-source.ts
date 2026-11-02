import { fetchText } from '../../http/http';
import type { ScrapedCodeEntry } from '../../../application/ports/driven/code-source.port';

const VG247_URL = 'https://www.vg247.com/stella-sora-codes';
const SECTION_START = /<h2[^>]*>\s*Latest Stella Sora codes\s*<\/h2>/i;
const NEXT_H2 = /<h2[^>]/;
// Items render as: <li><strong>BOSSGIFT</strong>: 100 Stellanite Dust</li>
const LI_CODE = /<strong>([A-Za-z0-9_-]{3,20})<\/strong>\s*:?\s*([^<]*)/g;
// ponytail: VG247 is the only server-rendered source today; add the official news API here when found

export async function fetchVg247Codes(): Promise<ScrapedCodeEntry[]> {
  const html = await fetchText(VG247_URL);
  const start = html.search(SECTION_START);
  if (start === -1) return [];

  const rest = html.slice(start);
  const nextH2 = rest.slice(60).search(NEXT_H2);
  const section = nextH2 === -1 ? rest : rest.slice(0, nextH2 + 60);

  const entries: ScrapedCodeEntry[] = [];
  for (const match of section.matchAll(LI_CODE)) {
    const reward = match[2]?.replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    entries.push({ code: match[1], reward: reward || undefined, sourceUrl: VG247_URL });
  }
  return entries;
}
