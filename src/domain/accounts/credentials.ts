import { InvalidAccountError } from './game-account';
import type { GameDefinition } from '../games/game-definition';

/**
 * Validates server + credentials of an account against the per-game schema
 * defined by its GameDefinition (pure domain — plugins only supply data).
 */
export function validateAccountInput(
  definition: GameDefinition,
  input: { server: string; credentials: Record<string, string> },
): void {
  const server = definition.servers.find((s) => s.value === input.server);
  if (!server) {
    throw new InvalidAccountError(
      `server "${input.server}" is not valid for ${definition.name} (expected one of: ${definition.servers.map((s) => s.value).join(', ')})`,
    );
  }

  for (const field of definition.accountFields) {
    const raw = input.credentials[field.key];
    // Values arrive from untrusted JSON bodies: a non-string (object/array/number)
    // must be rejected here, or it poisons the row and later `.trim()` calls throw.
    if (raw !== undefined && raw !== null && typeof raw !== 'string') {
      throw new InvalidAccountError(`credential "${field.key}" must be a string`);
    }
    const value = raw?.trim() ?? '';
    if (field.required && !value) {
      throw new InvalidAccountError(`missing required credential "${field.key}"`);
    }
  }
}
