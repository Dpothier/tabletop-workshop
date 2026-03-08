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
 * StatusEffectManager — stateless rule enforcer over Entity.buffs.
 * All stack storage is delegated to the entity's buffs map.
 * - Resolves end-of-round damage: 1 damage per burn stack
 * - Full consumption of burn stacks after damage (MFG-14)
 */
export class StatusEffectManager {
  applyBurn(entity: Entity, stacks: number): void {
    entity.addStacks('burn', stacks);
  }

  getBurnStacks(entity: Entity): number {
    return entity.getStacks('burn');
  }

  hasBurn(entity: Entity): boolean {
    return entity.getStacks('burn') > 0;
  }

  clearBurn(entity: Entity): void {
    entity.clearStacks('burn');
  }

  /**
   * Resolve all end-of-round effects for a set of entities.
   * Each burn stack deals 1 damage. Burns are fully consumed after.
   */
  resolveEndOfRound(entities: Entity[]): EndOfRoundDamage[] {
    const results: EndOfRoundDamage[] = [];

    for (const entity of entities) {
      const stacks = entity.getStacks('burn');
      if (stacks > 0) {
        const actualDamage = Math.min(stacks, entity.currentHealth);
        entity.receiveDamage(stacks);
        entity.clearStacks('burn');

        results.push({
          entityId: entity.id,
          type: 'burn',
          damage: actualDamage,
          consumed: true,
        });
      }
    }

    return results;
  }

  /**
   * Get all entities with active burn from a set.
   */
  getAffectedEntities(entities: Entity[]): string[] {
    return entities.filter((e) => e.getStacks('burn') > 0).map((e) => e.id);
  }
}
