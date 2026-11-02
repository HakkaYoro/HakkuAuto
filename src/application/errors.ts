import { DomainError } from '../domain/shared/errors';

export class GameNotFoundError extends DomainError {
  constructor(gameId: string) {
    super(`Game "${gameId}" is not registered`);
  }
}

export class CodeNotFoundError extends DomainError {
  constructor(gameId: string, code: string) {
    super(`Code "${code}" not found for game "${gameId}"`);
  }
}
