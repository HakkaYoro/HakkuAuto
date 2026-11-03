import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';

export interface GameCustomization {
  /** Rendered inside the account form, below the credential fields. */
  AccountGuide?: ComponentType;
  /** Click burst particles themed for this game (see components/click-fx.tsx). */
  clickFx?: ClickFx;
}

/** Particle burst styling spawned on every click while a game page is open. */
export interface ClickFx {
  Glyph: ComponentType<{ className?: string }>;
  colors: string[];
}

/** Blue Archive's iconic floating halo. */
function Halo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <ellipse cx="12" cy="12" rx="8" ry="4" stroke="currentColor" strokeWidth="3.5" />
    </svg>
  );
}

/** Four-point sparkle — Stella Sora's namesake star. */
function Star4({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
    </svg>
  );
}

/** Neutral burst for pages outside a game (dashboard has no single accent). */
export const defaultClickFx: ClickFx = { Glyph: Star4, colors: ['#94a3b8', '#e2e8f0'] };

const HALO_FX: ClickFx = { Glyph: Halo, colors: ['#3f8cff', '#ffd94a', '#ffffff'] };
const STAR_FX: ClickFx = { Glyph: Star4, colors: ['#8b5cf6', '#c4b5fd', '#7dd3fc', '#ffffff'] };

/** Official member-code guide image served by Nexon's own redemption page. */
const BA_OFFICIAL_GUIDE_IMG = 'https://mcoupon.dn.nexoncdn.co.kr/webcoupon/bluearchive/bluearchive_user_code_info_en.png';

function BlueArchiveGuide() {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <p className="mb-2 text-xs text-slate-400">{t('ba.help.memberCode')}</p>
      <img
        src={BA_OFFICIAL_GUIDE_IMG}
        alt={t('ba.help.memberCode')}
        className="w-full max-w-sm rounded-lg border border-slate-800"
        loading="lazy"
      />
    </div>
  );
}

function StellaSoraGuide() {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">
      <p>{t('ss.help.uid')}</p>
      <ol className="mt-2 list-decimal space-y-1 pl-4">
        <li>{t('ss.help.uid.step1')}</li>
        <li>{t('ss.help.uid.step2')}</li>
        <li>{t('ss.help.uid.step3')}</li>
      </ol>
    </div>
  );
}

function BrownDust2Guide() {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">
      <p>{t('bd2.help.nickname')}</p>
      <ol className="mt-2 list-decimal space-y-1 pl-4">
        <li>{t('bd2.help.nickname.step1')}</li>
        <li>{t('bd2.help.nickname.step2')}</li>
        <li>{t('bd2.help.nickname.step3')}</li>
      </ol>
      <p className="mt-2">{t('bd2.help.mail')}</p>
    </div>
  );
}

function NikkeGuide() {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">
      <p>{t('nikke.help.sessionCookie')}</p>
      <ol className="mt-2 list-decimal space-y-1 pl-4">
        <li>{t('nikke.help.sessionCookie.step1')}</li>
        <li>{t('nikke.help.sessionCookie.step2')}</li>
        <li>{t('nikke.help.sessionCookie.step3')}</li>
        <li>{t('nikke.help.sessionCookie.step4')}</li>
      </ol>
      <p className="mt-2">{t('nikke.help.manual')}</p>
    </div>
  );
}

/** Per-game UI customizations. Adding a game = one entry here (or nothing: generic fallback). */
const REGISTRY: Record<string, GameCustomization> = {
  'blue-archive': { AccountGuide: BlueArchiveGuide, clickFx: HALO_FX },
  'stella-sora': { AccountGuide: StellaSoraGuide, clickFx: STAR_FX },
  'brown-dust-2': { AccountGuide: BrownDust2Guide },
  'nikke': { AccountGuide: NikkeGuide },
};

export function gameCustomization(gameId: string): GameCustomization {
  return REGISTRY[gameId] ?? {};
}
