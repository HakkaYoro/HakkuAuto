import type { GamePlugin } from '../game-plugin';
import { BLUE_ARCHIVE } from './definition';
import { fetchRentryCodes } from './rentry-source';
import { redeemOnMcoupon, verifyMcouponAccount } from './mcoupon-redeem';

export const blueArchivePlugin: GamePlugin = {
  definition: BLUE_ARCHIVE,
  fetchCodes: fetchRentryCodes,
  redeem: redeemOnMcoupon,
  verify: verifyMcouponAccount,
};
