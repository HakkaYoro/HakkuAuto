import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, type AccountDto, type CodeDto, type GameSummary, type RecordDto, type ScanResult } from '../api/client';
import { GameHero, Spinner, usePolling } from '../components/common';
import CodesTab from './tabs/CodesTab';
import AccountsTab from './tabs/AccountsTab';
import HistoryTab from './tabs/HistoryTab';

type Tab = 'codes' | 'accounts' | 'history';

export default function GamePage() {
  const { t } = useTranslation();
  const { gameId = '' } = useParams();
  const [game, setGame] = useState<GameSummary | null>(null);
  const [codes, setCodes] = useState<CodeDto[]>([]);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [history, setHistory] = useState<RecordDto[]>([]);
  const [tab, setTab] = useState<Tab>('codes');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const games = await api.games();
    setGame(games.find((g) => g.id === gameId) ?? null);
    const [c, a, h] = await Promise.all([api.codes(gameId), api.accounts(gameId), api.history(gameId)]);
    setCodes(c);
    setAccounts(a);
    setHistory(h);
  }, [gameId]);

  usePolling(() => void load().catch(() => undefined));

  if (!game) return <Spinner label={t('common.loading')} />;

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const scan = async () => {
    setBusy(true);
    try {
      const result: ScanResult = await api.scan(gameId);
      flash(t('game.scanDone', { discovered: result.scan.discovered, updated: result.scan.updated }));
      await load();
    } catch (err) {
      flash((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const redeemAll = async () => {
    setBusy(true);
    try {
      const res = await api.redeemAll(gameId);
      flash(t('game.redeemAllDone', { successful: res.successful, attempts: res.attempts }));
      await load();
    } catch (err) {
      flash((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-enter" style={{ ['--accent' as string]: game.theme.accent }}>
      <GameHero bannerUrl={game.theme.bannerUrl} logoUrl={game.theme.logoUrl} name={game.name} />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => void scan()} disabled={busy} className="btn-accent">
          ⟳ {t('game.scanNow')}
        </button>
        <button onClick={() => void redeemAll()} disabled={busy} className="chip bg-slate-800 px-3 py-1.5 text-slate-200 hover:text-[var(--accent)]">
          ⚡ {t('game.redeemAll')}
        </button>
        <a href={game.redemptionUrl} target="_blank" rel="noreferrer" className="chip bg-slate-800 px-3 py-1.5 text-slate-400 hover:text-[var(--accent)]">
          ↗ {t('game.openOfficial')}
        </a>
        <Link to="/" className="chip bg-slate-800 px-3 py-1.5 text-slate-400 hover:text-[var(--accent)]">
          ← {t('nav.dashboard')}
        </Link>
      </div>

      {toast && <p className="mt-3 rounded-lg bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] px-3 py-2 text-sm">{toast}</p>}

      <nav className="mt-4 flex gap-1 border-b border-slate-800">
        {(['codes', 'accounts', 'history'] as Tab[]).map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            aria-pressed={tab === name}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              tab === name ? 'bg-slate-900 text-[var(--accent)]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t(`game.${name}`)}
            {name === 'codes' && ` (${codes.filter((c) => !c.expired).length})`}
            {name === 'accounts' && ` (${accounts.length})`}
          </button>
        ))}
      </nav>

      <section key={tab} className="page-enter mt-4">
        {tab === 'codes' && <CodesTab gameId={gameId} codes={codes} accounts={accounts} onChanged={() => void load()} />}
        {tab === 'accounts' && <AccountsTab game={game} accounts={accounts} onChanged={() => void load()} />}
        {tab === 'history' && <HistoryTab records={history} accounts={accounts} />}
      </section>
    </main>
  );
}
