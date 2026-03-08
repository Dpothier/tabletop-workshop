import type { Entity } from '@src/entities/Entity';

/**
 * Type of status effect.
 */
export type StatusEffectType = 'burn';

/**
 * Represents stacks of status effects on an entity.
 */
export interface StatusStacks {
  burn: number;
}

/**
 * Result of end-of-round damage from status effects.
 */
export interface EndOfRoundDamage {
  entityId: string;
  type: StatusEffectType;
  damage: number;
  consumed: boolean;
}

/**
 * StatusEffectManager manages all status effects (burn, etc.) on game entities.
 * - Tracks burn stacks per entity
 * - Resolves end-of-round damage: 1 damage per burn stack
 * - Consumes burn stacks after damage resolution (full consumption per MFG-14)
 */
export class StatusEffectManager {
  private burnStacks: Map<string, number> = new Map();

  /**
   * Apply burn stacks to an entity.
   * Stacks accumulate.
   */
  applyBurn(entityId: string, stacks: number): void {
    const current = this.burnStacks.get(entityId) || 0;
    this.burnStacks.set(entityId, current + stacks);
  }

  /**
   * Get the number of burn stacks on an entity.
   * Returns 0 if entity has no burn.
   */
  getBurnStacks(entityId: string): number {
    return this.burnStacks.get(entityId) || 0;
  }

  /**
   * Check if an entity has any burn stacks.
   */
  hasBurn(entityId: string): boolean {
    return this.getBurnStacks(entityId) > 0;
  }

  /**
   * Resolve all end-of-round effects.
   * Each burn stack deals 1 damage to the entity.
   * Burns are fully consumed after damage is resolved.
   *
   * @param getEntity Callback to retrieve an entity by ID for damage application
   * @returns Array of damage events that occurred
   */
  resolveEndOfRound(getEntity: (id: string) => Entity | undefined): EndOfRoundDamage[] {
    const results: EndOfRoundDamage[] = [];

    for (const [entityId, stacks] of this.burnStacks.entries()) {
      if (stacks > 0) {
        const entity = getEntity(entityId);
        if (entity) {
          // Cap damage at entity's current health
          const actualDamage = Math.min(stacks, entity.currentHealth);

          // Apply damage
          entity.receiveDamage(stacks);

          // Record the actual damage dealt
          results.push({
            entityId,
            type: 'burn',
            damage: actualDamage,
            consumed: true,
          });
        }
      }
    }

    // Consume all burn stacks (full consumption per MFG-14)
    this.burnStacks.clear();

    return results;
  }

  /**
   * Get all entity IDs that have active status effects.
   */
  getAffectedEntities(): string[] {
    return Array.from(this.burnStacks.keys()).filter((id) => this.burnStacks.get(id)! > 0);
  }
}
