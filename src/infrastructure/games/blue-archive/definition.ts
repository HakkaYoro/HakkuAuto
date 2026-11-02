import { GameId } from '../../../domain/games/game-id';
import type { GameDefinition } from '../../../domain/games/game-definition';

export const BLUE_ARCHIVE: GameDefinition = {
  id: GameId.from('blue-archive'),
  name: 'Blue Archive',
  redemptionUrl: 'https://mcoupon.nexon.com/bluearchive',
  servers: [
    { value: 'kr', label: 'Korea' },
    { value: 'na', label: 'North America' },
    { value: 'tw', label: 'Taiwan / Hong Kong / Macao' },
    { value: 'asia', label: 'Asia' },
    { value: 'global', label: 'Global' },
  ],
  accountFields: [
    { key: 'memberCode', type: 'text', required: true, helpKey: 'ba.help.memberCode' },
    { key: 'characterName', type: 'text', required: false, helpKey: 'ba.help.characterName' },
  ],
  // Official Nexon CDN assets used by the redemption page itself.
  theme: {
    accent: '#3f8cff',
    accentSoft: '#e6f1ff',
    bannerUrl: 'https://mcoupon.dn.nexoncdn.co.kr/webcoupon/bluearchive/bluearchive_header_en.jpg',
  },
  enabled: true,
};
