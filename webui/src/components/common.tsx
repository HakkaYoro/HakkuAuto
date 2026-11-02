import { useEffect, useState } from 'react';

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

export function GameHero({ bannerUrl, logoUrl, name }: { bannerUrl?: string; logoUrl?: string; name: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-800"
      style={{ background: bannerUrl ? undefined : `linear-gradient(120deg, var(--accent) 0%, transparent 60%), #0b1220` }}
    >
      {bannerUrl && <img src={bannerUrl} alt="" className="h-36 w-full object-cover opacity-80 sm:h-44" />}
      <div className="absolute inset-0 flex items-center gap-3 bg-gradient-to-r from-slate-950/80 to-transparent p-4">
        {logoUrl && <img src={logoUrl} alt="" className="size-10 rounded-lg" />}
        <h2 className="text-2xl font-bold drop-shadow">{name}</h2>
      </div>
    </div>
  );
}
