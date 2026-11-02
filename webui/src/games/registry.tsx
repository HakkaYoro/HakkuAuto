import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';

export interface GameCustomization {
  /** Rendered inside the account form, below the credential fields. */
  AccountGuide?: ComponentType;
}

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

/** Per-game UI customizations. Adding a game = one entry here (or nothing: generic fallback). */
const REGISTRY: Record<string, GameCustomization> = {
  'blue-archive': { AccountGuide: BlueArchiveGuide },
  'stella-sora': { AccountGuide: StellaSoraGuide },
};

export function gameCustomization(gameId: string): GameCustomization {
  return REGISTRY[gameId] ?? {};
}
