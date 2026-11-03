import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type AccountDto, type GameSummary } from '../../api/client';
import { gameCustomization } from '../../games/registry';

interface FormState {
  label: string;
  server: string;
  credentials: Record<string, string>;
  autoRedeem: boolean;
}

const emptyForm = (game: GameSummary): FormState => ({
  label: '',
  server: game.servers[0]?.value ?? '',
  credentials: Object.fromEntries(game.accountFields.map((f) => [f.key, ''])),
  autoRedeem: true,
});

export default function AccountsTab({
  game,
  accounts,
  onChanged,
}: {
  game: GameSummary;
  accounts: AccountDto[];
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<string | null>(null); // accountId or 'new'
  const [form, setForm] = useState<FormState>(() => emptyForm(game));
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const Guide = gameCustomization(game.id).AccountGuide;

  const openEdit = (acc?: AccountDto) => {
    setEditing(acc?.id ?? 'new');
    setFeedback(null);
    setForm(
      acc
        ? { label: acc.label, server: acc.server, credentials: { ...acc.credentials }, autoRedeem: acc.autoRedeem }
        : emptyForm(game),
    );
  };

  const submit = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      if (editing === 'new') {
        await api.createAccount(game.id, form);
      } else if (editing) {
        await api.updateAccount(game.id, editing, form);
      }
      setEditing(null);
      onChanged();
    } catch (err) {
      setFeedback((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await api.verify(game.id, { server: form.server, credentials: form.credentials });
      setFeedback(res.message ?? (res.ok ? 'OK' : '?'));
    } catch (err) {
      setFeedback((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (acc: AccountDto) => {
    if (!confirm(t('accounts.deleteConfirm', { label: acc.label }))) return;
    setActionError(null);
    try {
      await api.deleteAccount(game.id, acc.id);
      onChanged();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const toggleAuto = async (acc: AccountDto) => {
    setActionError(null);
    try {
      await api.updateAccount(game.id, acc.id, { autoRedeem: !acc.autoRedeem });
      onChanged();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  return (
    <div className="space-y-3">
      {actionError !== null && (
        <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
          {t('accounts.actionFailed')}
          {actionError && <span className="block text-xs text-rose-400/70">{actionError}</span>}
        </div>
      )}
      {accounts.map((acc) => (
        <div key={acc.id} className="card flex flex-wrap items-center gap-3 p-3">
          <div className="flex-1">
            <p className="font-semibold">
              {acc.label}
              <span className="ml-2 text-xs font-normal text-slate-400">{acc.server}</span>
            </p>
            <p className="text-xs text-slate-500">
              {game.accountFields.map((f) => `${f.key}: ${'•'.repeat(Math.min(acc.credentials[f.key]?.length ?? 0, 12)) || '—'}`).join(' · ')}
            </p>
          </div>
          <button
            onClick={() => void toggleAuto(acc)}
            aria-pressed={acc.autoRedeem}
            className={`chip ${acc.autoRedeem ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}
            title={t('accounts.autoRedeemHint')}
          >
            {acc.autoRedeem ? '⚡ ' : ''}{t('accounts.autoRedeem')}
          </button>
          <div className="flex gap-1.5">
            <button onClick={() => openEdit(acc)} className="chip bg-slate-800 text-slate-300 hover:text-[var(--accent)]">
              {t('accounts.edit')}
            </button>
            <button onClick={() => void remove(acc)} className="chip bg-rose-500/10 text-rose-400 hover:bg-rose-500/20">
              {t('accounts.delete')}
            </button>
          </div>
        </div>
      ))}
      {accounts.length === 0 && <p className="py-4 text-slate-400">{t('accounts.empty')}</p>}

      {editing !== null && (
        <div className="card space-y-3 p-4">
          <h4 className="font-bold text-[var(--accent)]">
            {editing === 'new' ? t('accounts.add') : t('accounts.edit')}
          </h4>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-400">{t('accounts.label')}</span>
            <input className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </label>

          {game.servers.length > 1 && (
            <label className="block text-sm">
              <span className="mb-1 block text-slate-400">{t('accounts.server')}</span>
              <select className="input" value={form.server} onChange={(e) => setForm({ ...form, server: e.target.value })}>
                {game.servers.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {game.accountFields.map((field) => (
            <label key={field.key} className="block text-sm">
              <span className="mb-1 block text-slate-400">
                {t(`accounts.field.${field.key}`, { defaultValue: field.key })}
                {!field.required && <span className="text-slate-500"> ({t('accounts.optional')})</span>}
              </span>
              <input
                className="input font-mono"
                type={field.type}
                value={form.credentials[field.key] ?? ''}
                onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, [field.key]: e.target.value } })}
              />
              {field.helpKey && <span className="mt-1 block text-xs text-slate-500">{t(field.helpKey)}</span>}
            </label>
          ))}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.autoRedeem}
              onChange={(e) => setForm({ ...form, autoRedeem: e.target.checked })}
              className="size-4 accent-[var(--accent)]"
            />
            <span>
              ⚡ {t('accounts.autoRedeem')} — <span className="text-xs text-slate-500">{t('accounts.autoRedeemHint')}</span>
            </span>
          </label>

          {Guide && <Guide />}

          {feedback && <p className="rounded-lg bg-slate-800/60 px-3 py-2 text-sm text-slate-300">{feedback}</p>}

          <div className="flex flex-wrap gap-2">
            <button disabled={busy || !form.label.trim()} onClick={() => void submit()} className="btn-accent">
              {busy ? t('accounts.saving') : t('accounts.save')}
            </button>
            <button onClick={() => void verify()} disabled={busy} className="chip bg-slate-800 px-3 py-1.5 text-slate-300 hover:text-[var(--accent)]">
              {busy ? t('accounts.verifying') : t('accounts.verify')}
            </button>
            <button onClick={() => setEditing(null)} className="chip bg-slate-800 px-3 py-1.5 text-slate-400">
              {t('accounts.cancel')}
            </button>
          </div>
        </div>
      )}

      {editing === null && (
        <button onClick={() => openEdit()} className="btn-accent w-full py-2.5">
          + {t('accounts.add')}
        </button>
      )}
    </div>
  );
}
