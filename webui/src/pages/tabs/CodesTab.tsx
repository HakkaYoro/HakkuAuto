import { useTranslation } from 'react-i18next';
import type { AccountDto, CodeDto } from '../../api/client';
import { api } from '../../api/client';
import { CopyButton, StatusBadge } from '../../components/common';
import { useState } from 'react';

export default function CodesTab({
  gameId,
  codes,
  accounts,
  onChanged,
}: {
  gameId: string;
  codes: CodeDto[];
  accounts: AccountDto[];
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const redeem = async (accountId: string, code: string) => {
    setRedeeming(`${accountId}:${code}`);
    try {
      const record = await api.redeemOnAccount(gameId, accountId, code);
      setResults((r) => ({ ...r, [`${accountId}:${code}`]: t(`history.status.${record.status}`) }));
      onChanged();
    } catch (err) {
      setResults((r) => ({ ...r, [`${accountId}:${code}`]: (err as Error).message }));
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="space-y-2">
      {codes.length === 0 && <p className="py-6 text-slate-400">{t('game.noCodes')}</p>}
      {codes.map((code) => (
        <div key={code.code} className="card flex flex-wrap items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <code className="truncate font-mono text-lg font-bold tracking-wider text-[var(--accent)]">{code.code}</code>
              <CopyButton value={code.code} copied={t('game.copied')} copy={t('game.copy')} />
              <StatusBadge status={code.expired ? 'EXPIRED' : code.status} label={t(`game.status.${code.expired ? 'EXPIRED' : code.status}`)} />
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {code.reward && <span>{code.reward} · </span>}
              {code.expiresAt && (
                <span>
                  {t('game.expires')} {new Date(code.expiresAt).toLocaleString()}
                  {code.sourceUrl && ' · '}
                </span>
              )}
              {code.sourceUrl && (
                <a href={code.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">
                  {new URL(code.sourceUrl).hostname}
                </a>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {accounts.map((acc) => {
              const key = `${acc.id}:${code.code}`;
              return (
                <button
                  key={acc.id}
                  disabled={code.expired || redeeming === key}
                  onClick={() => void redeem(acc.id, code.code)}
                  className="chip bg-slate-800 text-slate-200 transition hover:text-[var(--accent)] disabled:opacity-40"
                  title={`${t('game.redeem')} → ${acc.label}`}
                >
                  {redeeming === key ? '…' : results[key] ?? acc.label}
                </button>
              );
            })}
            {accounts.length === 0 && <span className="text-xs text-slate-500">{t('game.noAccountsHint')}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
