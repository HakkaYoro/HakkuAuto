import type { DomainEvent } from '../shared/entity';
import type { GameId } from '../games/game-id';

export class CodeDiscovered implements DomainEvent {
  constructor(
    public readonly gameId: GameId,
    public readonly code: string,
    public readonly reward?: string,
    public readonly expiresAt?: Date,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
