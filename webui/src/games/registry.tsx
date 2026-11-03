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
      <img
        src={BA_OFFICIAL_GUIDE_IMG}
        alt={t('ba.help.memberCode')}
        className="w-full max-w-sm rounded-lg border border-slate-800"
        loading="lazy"
      />
    </div>
  );
}

/**
 * Numbered how-to for a credential field. The field's one-line help (helpKey in
 * the game definition) is already rendered by AccountsTab under the input, so
 * the guide only adds the steps (plus an optional closing note).
 */
function Guide({ steps, trailing }: { steps: string[]; trailing?: string }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">
      <ol className="list-decimal space-y-1 pl-4">
        {steps.map((k) => (
          <li key={k}>{t(k)}</li>
        ))}
      </ol>
      {trailing && <p className="mt-2">{t(trailing)}</p>}
    </div>
  );
}

/** Per-game UI customizations. Adding a game = one entry here (or nothing: generic fallback). */
const REGISTRY: Record<string, GameCustomization> = {
  'blue-archive': { AccountGuide: BlueArchiveGuide, clickFx: HALO_FX },
  'stella-sora': {
    AccountGuide: () => <Guide steps={['ss.help.uid.step1', 'ss.help.uid.step2', 'ss.help.uid.step3']} />,
    clickFx: STAR_FX,
  },
  'brown-dust-2': {
    AccountGuide: () => (
      <Guide
        steps={['bd2.help.nickname.step1', 'bd2.help.nickname.step2', 'bd2.help.nickname.step3']}
        trailing="bd2.help.mail"
      />
    ),
  },
  nikke: {
    AccountGuide: () => (
      <Guide
        steps={[
          'nikke.help.sessionCookie.step1',
          'nikke.help.sessionCookie.step2',
          'nikke.help.sessionCookie.step3',
          'nikke.help.sessionCookie.step4',
        ]}
        trailing="nikke.help.manual"
      />
    ),
  },
};

export function gameCustomization(gameId: string): GameCustomization {
  return REGISTRY[gameId] ?? {};
}
