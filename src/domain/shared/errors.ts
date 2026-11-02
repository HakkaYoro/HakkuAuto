/**
 * Base class for all domain errors. Presentation maps subclasses to HTTP
 * semantics (400/404/409) — the domain never knows about HTTP.
 */
export abstract class DomainError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
