import { getJson } from '../../http/http';
import type { ScrapedCodeEntry } from '../../../application/ports/driven/code-source.port';

// Small-tailqwq/Nikke-CDK-Tool (MIT) keeps the community CDK list as a versioned JSON:
// {version, lastUpdate, cdks} where cdks holds code nodes {code, name, reward, servers,
// status, ...} and {type:"group", cdks} nodes that nest recursively. status "可用" = active,
// "已过期" = expired; there is no structured expiry date.
// ponytail: single community JSON source; if it lags behind, scrape nikke.gg/cd-keys-guide here instead
const CDK_LIST_URL = 'https://raw.githubusercontent.com/Small-tailqwq/Nikke-CDK-Tool/HEAD/public/cdk-list.source.json';
const SOURCE_URL = 'https://github.com/Small-tailqwq/Nikke-CDK-Tool/blob/HEAD/public/cdk-list.source.json';

interface CdkNode {
  type?: unknown;
  code?: unknown;
  reward?: unknown;
  servers?: unknown;
  status?: unknown;
  cdks?: unknown;
}

export function parseCdkList(json: unknown): ScrapedCodeEntry[] {
  const entries: ScrapedCodeEntry[] = [];
  walk((json as { cdks?: unknown } | null | undefined)?.cdks, entries);
  return entries;
}

function walk(nodes: unknown, entries: ScrapedCodeEntry[]): void {
  if (!Array.isArray(nodes)) return;
  for (const raw of nodes) {
    if (!raw || typeof raw !== 'object') continue;
    const node = raw as CdkNode;
    if (node.type === 'group') {
      walk(node.cdks, entries);
      continue;
    }
    const code = typeof node.code === 'string' ? node.code.trim() : '';
    if (!code) continue;
    if (!Array.isArray(node.servers) || !node.servers.includes('global')) continue;
    if (node.status !== '可用') continue;
    entries.push({
      code,
      reward: typeof node.reward === 'string' && node.reward.trim() !== '' ? node.reward : undefined,
      sourceUrl: SOURCE_URL,
    });
  }
}

export async function fetchNikkeCodes(): Promise<ScrapedCodeEntry[]> {
  return parseCdkList(await getJson<unknown>(CDK_LIST_URL));
}
