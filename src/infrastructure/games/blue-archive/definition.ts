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
  // Hotlinked official art (never committed): Steam library hero carries the current
  // season key art; app icon is the Play Store listing icon. Refresh the URLs here
  // when a new update/anniversary art drops.
  theme: {
    accent: '#3f8cff',
    accentSoft: '#e6f1ff',
    bannerUrl: 'https://cdn.cloudflare.steamstatic.com/steam/apps/3557620/library_hero.jpg',
    logoUrl: 'https://play-lh.googleusercontent.com/vlVAv0UGD-knTIap84gJDkKZlnZjzhgYdAU3W6mRVkzIjc-rxtRcy5EHud3Om2haqzqW9-73AjYnYiuSluy39S4=s0-br30',
  },
  enabled: true,
};
