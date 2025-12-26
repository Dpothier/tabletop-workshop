import type { Entity } from '@src/entities/Entity';

/**
 * Interface for entity lookup.
 * Decouples consumers from the concrete Map implementation.
 */
export interface IEntityRegistry {
  get(id: string): Entity | undefined;
}
