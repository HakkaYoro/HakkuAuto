import type { GamePlugin } from '../game-plugin';
import { BROWN_DUST } from './definition';
import { fetchSousehaCodes } from './souseha-source';
import { redeemOnBrownDust2, verifyBrownDust2Account } from './coupon-redeem';

export const brownDust2Plugin: GamePlugin = {
  definition: BROWN_DUST,
  fetchCodes: fetchSousehaCodes,
  redeem: redeemOnBrownDust2,
  verify: verifyBrownDust2Account,
};
