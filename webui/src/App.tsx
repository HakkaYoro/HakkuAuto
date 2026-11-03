import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LANGS, setLanguage } from './i18n';
import ClickFx from './components/click-fx';

export default function App() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [locked, setLocked] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const show = () => setLocked(true);
    window.addEventListener('hakku:unauthorized', show);
    return () => window.removeEventListener('hakku:unauthorized', show);
  }, []);

  const saveToken = () => {
    localStorage.setItem('hakku.token', token);
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <header className="flex items-center justify-between py-6">
        <Link to="/" className="group">
          <img src="/logo.png" alt="HakkuAuto" className="h-16 w-auto" />
          <p className="text-xs text-slate-400">{t('app.subtitle')}</p>
        </Link>
        <div className="flex items-center gap-2">
          {LANGS.map((lang, i) => (
            <span key={lang.code} className="flex items-center gap-2">
              {i > 0 && <span className="text-slate-600">·</span>}
              <button
                onClick={() => setLanguage(lang.code)}
                aria-pressed={i18n.language.startsWith(lang.code)}
                className={`text-sm font-medium transition ${
                  i18n.language.startsWith(lang.code) ? 'text-slate-200' : 'text-slate-400 hover:text-[var(--accent)]'
                }`}
              >
                {lang.label}
              </button>
            </span>
          ))}
        </div>
      </header>
      {locked && (
        <div className="card space-y-2 p-4">
          <p className="text-sm font-semibold text-rose-400">🔒 {t('lock.title')}</p>
          <p className="text-xs text-rose-400/70">{t('lock.wrong')}</p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              type="password"
              placeholder={t('lock.placeholder')}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveToken()}
            />
            <button className="btn-accent px-4" onClick={saveToken}>
              {t('lock.save')}
            </button>
          </div>
        </div>
      )}
      {/* Re-keying by pathname replays the entry animation on every navigation. */}
      <div key={location.pathname} className="page-enter">
        <Outlet />
      </div>
      <ClickFx />
    </div>
  );
}
