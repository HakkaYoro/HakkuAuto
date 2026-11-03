import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, type GameSummary } from '../api/client';
import { Spinner, usePolling } from '../components/common';

export default function Dashboard() {
  const { t } = useTranslation();
  const [games, setGames] = useState<GameSummary[] | null>(null);

  const load = useCallback(() => void api.games().then(setGames).catch(() => setGames([])), []);
  usePolling(load);
  if (games === null) return <Spinner label={t('dashboard.loading')} />;

  return (
    <main className="page-enter">
      <h2 className="mb-4 text-lg font-bold text-slate-300">{t('dashboard.heading')}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {games.map((game) => (
          <Link
            key={game.id}
            to={`/game/${game.id}`}
            className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
            style={{ ['--accent' as string]: game.theme.accent }}
          >
            <div className="relative h-28">
              {game.theme.bannerUrl ? (
                <img src={game.theme.bannerUrl} alt="" className="h-full w-full object-cover opacity-70 transition group-hover:opacity-90" />
              ) : (
                <div
                  className="h-full w-full"
                  style={{ background: `linear-gradient(115deg, ${game.theme.accent}55 0%, #0b1220 70%)` }}
                />
              )}
              <div className="absolute inset-0 flex items-end gap-2 bg-linear-to-t from-slate-950/90 to-transparent p-3">
                {game.theme.logoUrl && <img src={game.theme.logoUrl} alt="" className="size-8 rounded-md" />}
                <h3 className="text-xl font-bold">{game.name}</h3>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex gap-4 text-sm">
                <span>
                  <b className="text-[var(--accent)]">{game.activeCodes}</b>{' '}
                  <span className="text-slate-400">{t('dashboard.activeCodes')}</span>
                </span>
                <span>
                  <b className="text-[var(--accent)]">{game.accounts}</b>{' '}
                  <span className="text-slate-400">{t('dashboard.accounts')}</span>
                </span>
              </div>
              <span className="btn-accent">{t('dashboard.enter')} →</span>
            </div>
          </Link>
        ))}
      </div>
      {games.length === 0 && <p className="text-slate-400">{t('dashboard.empty')}</p>}
    </main>
  );
}
