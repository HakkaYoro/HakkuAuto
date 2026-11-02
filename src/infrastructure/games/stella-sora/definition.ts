import { GameId } from '../../../domain/games/game-id';
import type { GameDefinition } from '../../../domain/games/game-definition';

export const STELLA_SORA: GameDefinition = {
  id: GameId.from('stella-sora'),
  name: 'Stella Sora',
  redemptionUrl: 'https://stellasora.global/gift',
  // The UID is globally unique — single pseudo-server so the shared schema stays uniform.
  servers: [{ value: 'global', label: 'Global' }],
  accountFields: [
    { key: 'uid', type: 'text', required: true, helpKey: 'ss.help.uid' },
  ],
  // Hotlinked official art (never committed): the site's current key visual bundle
  // plus its favicon as square icon. Refresh the KV URL when Yostar ships new art.
  theme: {
    accent: '#8b5cf6',
    bannerUrl: 'https://novaweb-usstatic.yo-star.com/h5/assets/kv-f5dd1892.jpg',
    logoUrl: 'https://novaweb-usstatic.yo-star.com/h5/favicon-b5900513.png',
  },
  enabled: true,
};
