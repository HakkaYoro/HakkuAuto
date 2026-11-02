import { GameId } from './game-id';

export interface ServerOption {
  /** Value stored on the account, e.g. "global". */
  value: string;
  label: string;
}

export interface AccountField {
  key: string;
  type: 'text' | 'password';
  required: boolean;
  /** Where the user finds this value in-game; shown as help text. */
  helpKey?: string;
}

/** Per-game visual identity used by the WebUI (official art, colors). */
export interface GameTheme {
  accent: string;
  accentSoft: string;
  bannerUrl?: string;
  logoUrl?: string;
}

export interface GameDefinition {
  id: GameId;
  name: string;
  /** Official redemption site, linked from the UI for manual assists. */
  redemptionUrl: string;
  servers: ServerOption[];
  accountFields: AccountField[];
  theme: GameTheme;
  enabled: boolean;
}
