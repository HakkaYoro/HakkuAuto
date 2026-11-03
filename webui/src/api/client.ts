/** Typed API client for the NestJS backend (same origin; vite proxies /api in dev). */

export interface ServerOption {
  value: string;
  label: string;
}

export interface AccountField {
  key: string;
  type: 'text' | 'password';
  required: boolean;
  helpKey?: string;
}

export interface GameTheme {
  accent: string;
  bannerUrl?: string;
  logoUrl?: string;
}

export interface GameSummary {
  id: string;
  name: string;
  redemptionUrl: string;
  servers: ServerOption[];
  accountFields: AccountField[];
  theme: GameTheme;
  enabled: boolean;
  activeCodes: number;
  accounts: number;
}

export interface CodeDto {
  gameId: string;
  code: string;
  status: 'ACTIVE' | 'EXPIRED';
  expired: boolean;
  reward: string | null;
  expiresAt: string | null;
  sourceUrl: string | null;
  discoveredAt: string;
}

export interface AccountDto {
  id: string;
  gameId: string;
  label: string;
  server: string;
  credentials: Record<string, string>;
  autoRedeem: boolean;
  createdAt: string;
}

export type RedemptionStatus =
  | 'SUCCESS'
  | 'ALREADY_USED'
  | 'EXPIRED'
  | 'INVALID_CODE'
  | 'NEEDS_MANUAL'
  | 'FAILED';

export interface RecordDto {
  id: string;
  accountId: string;
  gameId: string;
  code: string;
  status: RedemptionStatus;
  rawMessage: string | null;
  attemptedAt: string;
}

export interface ScanResult {
  scan: { gameId: string; gameName: string; discovered: number; updated: number; invalid: number };
  autoRedeem: { attempts: number; successful: number } | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('hakku.token');
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-API-Token': token } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new CustomEvent('hakku:unauthorized'));
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  games: () => request<GameSummary[]>('/games'),
  codes: (gameId: string, status?: string) =>
    request<CodeDto[]>(`/games/${gameId}/codes${status ? `?status=${status}` : ''}`),
  scan: (gameId: string) => request<ScanResult>(`/games/${gameId}/scan`, { method: 'POST' }),
  redeemAll: (gameId: string) =>
    request<{ attempts: number; successful: number }>(`/games/${gameId}/redeem-pending`, { method: 'POST' }),
  verify: (gameId: string, input: { server: string; credentials: Record<string, string> }) =>
    request<{ ok: boolean; message?: string }>(`/games/${gameId}/verify`, { method: 'POST', body: JSON.stringify(input) }),
  accounts: (gameId: string) => request<AccountDto[]>(`/games/${gameId}/accounts`),
  createAccount: (gameId: string, input: { label: string; server: string; credentials: Record<string, string>; autoRedeem?: boolean }) =>
    request<AccountDto>(`/games/${gameId}/accounts`, { method: 'POST', body: JSON.stringify(input) }),
  updateAccount: (gameId: string, accountId: string, patch: Partial<{ label: string; server: string; credentials: Record<string, string>; autoRedeem: boolean }>) =>
    request<AccountDto>(`/games/${gameId}/accounts/${accountId}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteAccount: (gameId: string, accountId: string) =>
    request<{ deleted: boolean }>(`/games/${gameId}/accounts/${accountId}`, { method: 'DELETE' }),
  redeemOnAccount: (gameId: string, accountId: string, code: string) =>
    request<RecordDto>(`/games/${gameId}/accounts/${accountId}/redeem`, { method: 'POST', body: JSON.stringify({ code }) }),
  history: (gameId?: string, limit = 100) =>
    request<RecordDto[]>(`/redemptions?limit=${limit}${gameId ? `&gameId=${gameId}` : ''}`),
};
