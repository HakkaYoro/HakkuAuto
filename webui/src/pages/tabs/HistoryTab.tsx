import { useTranslation } from 'react-i18next';
import type { AccountDto, RecordDto } from '../../api/client';
import { StatusBadge } from '../../components/common';

export default function HistoryTab({ records, accounts }: { records: RecordDto[]; accounts: AccountDto[] }) {
  const { t } = useTranslation();
  const labelOf = (id: string) => accounts.find((a) => a.id === id)?.label ?? '—';

  return (
    <div className="space-y-1.5">
      {records.length === 0 && <p className="py-6 text-slate-400">{t('history.empty')}</p>}
      {records.map((rec) => (
        <div key={rec.id} className="card flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm">
          <code className="font-mono font-bold text-[var(--accent)]">{rec.code}</code>
          <span className="text-slate-400">{labelOf(rec.accountId)}</span>
          <StatusBadge status={rec.status} label={t(`history.status.${rec.status}`)} />
          <span className="flex-1 truncate text-xs text-slate-500" title={rec.rawMessage ?? ''}>
            {rec.rawMessage}
          </span>
          <span className="text-xs text-slate-500">{new Date(rec.attemptedAt).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
