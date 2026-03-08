import type { Entity } from '@src/entities/Entity';

export type PreparationType = 'windup' | 'aim' | 'ponder' | 'channel' | 'rest';

export interface PreparationDefinition {
  type: PreparationType;
  wheelCost: number;
  maxStacks: number | null; // null = unlimited
  pairedActions: string[];
}

export const PREPARATION_DEFINITIONS: Record<PreparationType, PreparationDefinition> = {
  windup: { type: 'windup', wheelCost: 1, maxStacks: 1, pairedActions: ['attack'] },
  aim: { type: 'aim', wheelCost: 1, maxStacks: null, pairedActions: ['shoot'] },
  ponder: { type: 'ponder', wheelCost: 1, maxStacks: null, pairedActions: [] },
  channel: { type: 'channel', wheelCost: 1, maxStacks: null, pairedActions: ['cast'] },
  rest: { type: 'rest', wheelCost: 2, maxStacks: null, pairedActions: [] },
};

/**
 * PreparationManager — stateless rule enforcer over Entity.buffs.
 * All stack storage is delegated to the entity's buffs map.
 */
export class PreparationManager {
  prepare(entity: Entity, prepType: PreparationType, stacksToAdd: number): void {
    const currentStacks = entity.getStacks(prepType);
    const definition = PREPARATION_DEFINITIONS[prepType];
    const newStacks = currentStacks + stacksToAdd;

    entity.clearStacks(prepType);
    const capped = definition.maxStacks !== null ? Math.min(newStacks, definition.maxStacks) : newStacks;
    if (capped > 0) {
      entity.addStacks(prepType, capped);
    }
  }

  getStacks(entity: Entity, prepType: PreparationType): number {
    return entity.getStacks(prepType);
  }

  interruptAll(entity: Entity): void {
    for (const prepType of Object.keys(PREPARATION_DEFINITIONS) as PreparationType[]) {
      entity.clearStacks(prepType);
    }
  }

  interruptByAction(entity: Entity, actionId: string): void {
    for (const prepType of Object.keys(PREPARATION_DEFINITIONS) as PreparationType[]) {
      const definition = PREPARATION_DEFINITIONS[prepType];
      if (!definition.pairedActions.includes(actionId) && entity.getStacks(prepType) > 0) {
        entity.clearStacks(prepType);
      }
    }
  }

  consumeStacks(entity: Entity, prepType: PreparationType): void {
    entity.clearStacks(prepType);
  }
}
