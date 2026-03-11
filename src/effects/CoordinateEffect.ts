import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import { PREPARATION_DEFINITIONS } from '@src/data/PreparationDefinitions';
import type { PreparationType } from '@src/data/PreparationDefinitions';

export class CoordinateEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetId as string;
    const prepType = params.prepType as PreparationType;

    // Check if actor exists
    if (!context.actorId) {
      return {
        success: false,
        reason: 'Actor not found',
        data: {},
        events: [],
      };
    }

    const actor = context.getEntity(context.actorId);
    if (!actor) {
      return {
        success: false,
        reason: 'Actor not found',
        data: {},
        events: [],
      };
    }

    // Check if target exists
    const target = context.getEntity(targetId);
    if (!target) {
      return {
        success: false,
        reason: 'Target not found',
        data: {},
        events: [],
      };
    }

    // Check range: must be > 0 and <= 6
    const distance = context.grid.getDistance(context.actorId, targetId);
    if (distance < 1 || distance > 6) {
      return {
        success: false,
        reason: 'Target is out of range',
        data: {},
        events: [],
      };
    }

    const definition = PREPARATION_DEFINITIONS[prepType];

    // Get current stacks on target
    const currentStacks = target.getStacks(prepType);

    // Calculate new total
    const newTotal = currentStacks + 1;

    // Cap to maxStacks if defined
    const cappedTotal =
      definition.maxStacks !== null ? Math.min(newTotal, definition.maxStacks) : newTotal;

    // Clear existing stacks
    target.clearStacks(prepType);

    // Add capped total (only if > 0)
    if (cappedTotal > 0) {
      target.addStacks(prepType, cappedTotal);
    }

    context.recorder?.record({
      type: 'state-change',
      seq: 0,
      entityId: targetId,
      entityName: 'Entity',
      changeType: 'buff-add',
      details: { stackName: prepType, stacksAdded: cappedTotal },
    } as any);

    return {
      success: true,
      data: {
        prepType,
        stacksApplied: cappedTotal,
        totalStacks: cappedTotal,
      },
      events: [],
    };
  }
}
