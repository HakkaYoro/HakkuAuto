const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 HakkuAuto/0.1';

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: string,
  ) {
    super(message);
  }
}

async function request(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      headers: { 'User-Agent': USER_AGENT, Accept: '*/*', ...(init.headers as Record<string, string>) },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchText(url: string, timeoutMs = 20000): Promise<string> {
  const res = await request(url, {}, timeoutMs);
  if (!res.ok) throw new HttpError(`GET ${url} failed`, res.status, await res.text().catch(() => ''));
  return res.text();
}

export async function postJson<T>(url: string, body: unknown, headers: Record<string, string> = {}, timeoutMs = 20000): Promise<T> {
  const res = await request(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );
  const text = await res.text();
  if (!res.ok) throw new HttpError(`POST ${url} failed`, res.status, text);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(`POST ${url} returned non-JSON`, res.status, text);
  }
}

export async function getJson<T>(url: string, headers: Record<string, string> = {}, timeoutMs = 20000): Promise<T> {
  const res = await request(url, { headers }, timeoutMs);
  const text = await res.text();
  if (!res.ok) throw new HttpError(`GET ${url} failed`, res.status, text);
  return JSON.parse(text) as T;
}
