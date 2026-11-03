/**
 * Injection tokens. Application use cases stay framework-free (plain classes);
 * the AppModule wires them to ports with useFactory. Controllers depend on
 * these tokens, never on infrastructure implementations.
 */
export const TOKENS = {
  // driven ports
  GameCatalog: Symbol('GameCatalog'),
  CodeSource: Symbol('CodeSource'),
  RedemptionGateway: Symbol('RedemptionGateway'),
  EventPublisher: Symbol('EventPublisher'),
  GameCodeRepository: Symbol('GameCodeRepository'),
  GameAccountRepository: Symbol('GameAccountRepository'),
  RedemptionRecordRepository: Symbol('RedemptionRecordRepository'),
  // infrastructure services exposed to presentation
  GameRegistry: Symbol('GameRegistry'),
  ScanScheduler: Symbol('ScanScheduler'),
  ApiToken: Symbol('ApiToken'),
  // use cases
  ScanGameCodes: Symbol('ScanGameCodes'),
  RedeemPendingCodes: Symbol('RedeemPendingCodes'),
  RedeemCodeToAccount: Symbol('RedeemCodeToAccount'),
  RegisterGameAccount: Symbol('RegisterGameAccount'),
  UpdateGameAccount: Symbol('UpdateGameAccount'),
  DeleteGameAccount: Symbol('DeleteGameAccount'),
  ListGames: Symbol('ListGames'),
  ListGameCodes: Symbol('ListGameCodes'),
  ListGameAccounts: Symbol('ListGameAccounts'),
  ListRedemptions: Symbol('ListRedemptions'),
} as const;
