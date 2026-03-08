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

export class PreparationManager {
  private stacks: Map<string, Map<PreparationType, number>> = new Map();

  prepare(entityId: string, prepType: PreparationType, stacksToAdd: number): void {
    if (!this.stacks.has(entityId)) {
      this.stacks.set(entityId, new Map());
    }

    const entityPreps = this.stacks.get(entityId)!;
    const currentStacks = entityPreps.get(prepType) ?? 0;
    const definition = PREPARATION_DEFINITIONS[prepType];
    const newStacks = currentStacks + stacksToAdd;

    if (definition.maxStacks !== null) {
      entityPreps.set(prepType, Math.min(newStacks, definition.maxStacks));
    } else {
      entityPreps.set(prepType, newStacks);
    }
  }

  getStacks(entityId: string, prepType: PreparationType): number {
    const entityPreps = this.stacks.get(entityId);
    if (!entityPreps) {
      return 0;
    }
    return entityPreps.get(prepType) ?? 0;
  }

  interruptAll(entityId: string): void {
    if (this.stacks.has(entityId)) {
      this.stacks.get(entityId)!.clear();
    }
  }

  interruptByAction(entityId: string, actionId: string): void {
    const entityPreps = this.stacks.get(entityId);
    if (!entityPreps) {
      return;
    }

    const typesToClear: PreparationType[] = [];
    for (const [prepType] of entityPreps) {
      const definition = PREPARATION_DEFINITIONS[prepType];
      if (!definition.pairedActions.includes(actionId)) {
        typesToClear.push(prepType);
      }
    }

    for (const prepType of typesToClear) {
      entityPreps.delete(prepType);
    }
  }

  consumeStacks(entityId: string, prepType: PreparationType): void {
    const entityPreps = this.stacks.get(entityId);
    if (entityPreps) {
      entityPreps.set(prepType, 0);
    }
  }
}
