import type { DomainEvent } from '../../domain/shared/entity';

/** Driven port: publishes domain events in-process. */
export interface EventPublisherPort {
  publish(event: DomainEvent): Promise<void>;
}
