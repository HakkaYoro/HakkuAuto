import { GameId } from '../../../domain/games/game-id';
import type { GameDefinition } from '../../../domain/games/game-definition';

export const BROWN_DUST: GameDefinition = {
  id: GameId.from('brown-dust-2'),
  name: 'Brown Dust 2',
  redemptionUrl: 'https://redeem.bd2.pmang.cloud/bd2/index.html',
  // Redemption is by globally-unique nickname — single pseudo-server keeps the shared schema uniform.
  servers: [{ value: 'global', label: 'Global' }],
  accountFields: [
    { key: 'nickname', type: 'text', required: true, helpKey: 'bd2.help.nickname' },
  ],
  // Hotlinked official art (never committed): site og:image + Play Store listing icon.
  theme: {
    accent: '#c9a961',
    bannerUrl: 'https://www.browndust2.com/img/seo/OGimg_EN_740x340_v5.jpg',
    logoUrl:
      'https://play-lh.googleusercontent.com/t_Pc0TNuYTnMGe9nm950wu9hPQOwVwSxAYmnCezhhQWxR7oW1Vp9LR828QqtDWnDopIv0OkSIZQucfReW-WCcCE=s512',
  },
  enabled: true,
};
