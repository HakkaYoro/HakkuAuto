/** Value objects: equality by value, immutable by convention. */
export abstract class ValueObject {
  equals(other?: ValueObject): boolean {
    if (!other) return false;
    return JSON.stringify(this) === JSON.stringify(other);
  }

  toString(): string {
    return JSON.stringify(this);
  }
}
