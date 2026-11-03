import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

/** Poll immediately on mount, then every N ms (no websockets needed at this scale). */
export function usePolling(fn: () => void, ms = 20000): void {
  useEffect(() => {
    fn();
    const timer = setInterval(fn, ms);
    return () => clearInterval(timer);
  }, [fn, ms]);
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
      <span className="size-5 animate-spin rounded-full border-2 border-slate-600 border-t-[var(--accent)]" />
      {label}
    </div>
  );
}

const BADGE_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-400',
  SUCCESS: 'bg-emerald-500/15 text-emerald-400',
  EXPIRED: 'bg-slate-500/15 text-slate-400',
  ALREADY_USED: 'bg-sky-500/15 text-sky-400',
  INVALID_CODE: 'bg-amber-500/15 text-amber-400',
  NEEDS_MANUAL: 'bg-violet-500/15 text-violet-400',
  FAILED: 'bg-rose-500/15 text-rose-400',
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={`chip ${BADGE_STYLES[status] ?? 'bg-slate-500/15 text-slate-400'}`}>{label}</span>;
}

export function CopyButton({ value, copied, copy }: { value: string; copied: string; copy: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="chip bg-slate-800 text-slate-300 transition hover:text-[var(--accent)]"
    >
      {done ? copied : copy}
    </button>
  );
}

/** Game header: banner left of the title on desktop, icon + title only on phones. */
export function GameHero({
  bannerUrl,
  logoUrl,
  name,
  children,
}: {
  bannerUrl?: string;
  logoUrl?: string;
  name: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 sm:gap-6">
      {bannerUrl && (
        <div className="relative hidden shrink-0 overflow-hidden rounded-2xl border border-slate-800 shadow-lg shadow-black/40 sm:block sm:w-64 md:w-80">
          <img src={bannerUrl} alt="" className="aspect-video w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent to-slate-950/30" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
              className="size-11 rounded-xl border border-slate-700 object-cover shadow-lg sm:size-12"
              style={{ boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent)' }}
            />
          )}
          <h2 className="text-2xl font-bold drop-shadow sm:text-3xl">{name}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
