import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LANGS, setLanguage } from './i18n';

export default function App() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <header className="flex items-center justify-between py-6">
        <Link to="/" className="group">
          <h1 className="text-2xl font-black tracking-tight">
            Hakku<span className="text-[var(--accent)]">Auto</span>
          </h1>
          <p className="text-xs text-slate-400">{t('app.subtitle')}</p>
        </Link>
        <div className="flex items-center gap-2">
          {LANGS.map((lang, i) => (
            <span key={lang.code} className="flex items-center gap-2">
              {i > 0 && <span className="text-slate-600">·</span>}
              <button
                onClick={() => setLanguage(lang.code)}
                className="text-sm font-medium text-slate-400 transition hover:text-[var(--accent)]"
              >
                {lang.label}
              </button>
            </span>
          ))}
        </div>
      </header>
      <Outlet />
    </div>
  );
}
