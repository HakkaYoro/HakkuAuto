import { Injectable, Logger } from '@nestjs/common';
import type { EventPublisherPort } from '../../application/ports/driven/event-publisher.port';
import type { DomainEvent } from '../../domain/shared/entity';

/**
 * In-process events currently have no consumers — the redemption history table
 * is the durable record — so publishing = structured log line. Swap for
 * EventEmitter2/bus here when a real subscriber appears.
 */
@Injectable()
export class LoggingEventPublisher implements EventPublisherPort {
  private readonly logger = new Logger('DomainEvents');

  async publish(event: DomainEvent): Promise<void> {
    this.logger.log(`${event.constructor.name} ${JSON.stringify({ ...event, occurredAt: event.occurredAt.toISOString() })}`);
  }
}
