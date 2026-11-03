import type { GamePlugin } from '../game-plugin';
import { NIKKE } from './definition';
import { fetchNikkeCodes } from './cdklist-source';
import { redeemOnNikke, verifyNikkeAccount } from './blablalink-redeem';

export const nikkePlugin: GamePlugin = {
  definition: NIKKE,
  fetchCodes: fetchNikkeCodes,
  redeem: redeemOnNikke,
  verify: verifyNikkeAccount,
};
