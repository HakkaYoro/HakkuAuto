export interface DomainEvent {
  readonly occurredAt: Date;
}

export abstract class Entity<ID> {
  constructor(public readonly id: ID) {}

  equals(other?: Entity<ID>): boolean {
    if (!other) return false;
    return other.constructor === this.constructor && other.id === this.id;
  }
}

export abstract class AggregateRoot<ID> extends Entity<ID> {
  private readonly _events: DomainEvent[] = [];

  protected record(event: DomainEvent): void {
    this._events.push(event);
  }

  /** Events are pulled once and published by the application layer. */
  pullEvents(): DomainEvent[] {
    const events = this._events.slice();
    this._events.length = 0;
    return events;
  }
}
