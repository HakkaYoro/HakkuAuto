import type { GamePlugin } from '../game-plugin';
import { STELLA_SORA } from './definition';
import { fetchVg247Codes } from './vg247-source';
import { redeemOnStellaSora, verifyStellaSoraAccount } from './gift-redeem';

export const stellaSoraPlugin: GamePlugin = {
  definition: STELLA_SORA,
  fetchCodes: fetchVg247Codes,
  redeem: redeemOnStellaSora,
  verify: verifyStellaSoraAccount,
};
