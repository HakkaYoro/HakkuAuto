import { GameId } from '../../../domain/games/game-id';
import type { GameDefinition } from '../../../domain/games/game-definition';

export const NIKKE: GameDefinition = {
  id: GameId.from('nikke'),
  name: 'Goddess of Victory: NIKKE',
  redemptionUrl: 'https://www.blablalink.com/cdk',
  // Redemption is scoped to the BlaBlaLink session cookie — single pseudo-server keeps the shared schema uniform.
  servers: [{ value: 'global', label: 'Global' }],
  accountFields: [
    { key: 'sessionCookie', type: 'password', required: true, helpKey: 'nikke.help.sessionCookie' },
  ],
  // Hotlinked official art (never committed): site og:image + Play Store listing icon.
  theme: {
    accent: '#e23b3b',
    bannerUrl: 'https://nikke-en.com/pc/ossweb-img/og_image.jpg',
    logoUrl:
      'https://play-lh.googleusercontent.com/vL-xYJhmXTiaQewThy9DMHkk_zdtSHqKcRDp8iYip6C-OB764enYRA1CrmHSRoW1rsAEkyJT5a8By3ADMbd5=s512',
  },
  enabled: true,
};
