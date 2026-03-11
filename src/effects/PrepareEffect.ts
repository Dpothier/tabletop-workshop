import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import { PREPARATION_DEFINITIONS } from '@src/data/PreparationDefinitions';
import type { PreparationType } from '@src/data/PreparationDefinitions';

export class PrepareEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const prepType = params.prepType as PreparationType;
    const stacksToAdd = params.stacksToAdd as number;

    // Check if actor exists
    if (!context.actorId) {
      return {
        success: false,
        reason: 'Actor not found',
        data: {},
        events: [],
      };
    }

    const entity = context.getEntity(context.actorId);
    if (!entity) {
      return {
        success: false,
        reason: 'Actor not found',
        data: {},
        events: [],
      };
    }

    const definition = PREPARATION_DEFINITIONS[prepType];

    // Get current stacks
    const currentStacks = entity.getStacks(prepType);

    // Calculate new total
    const newTotal = currentStacks + stacksToAdd;

    // Cap to maxStacks if defined
    const cappedTotal =
      definition.maxStacks !== null ? Math.min(newTotal, definition.maxStacks) : newTotal;

    // Clear existing stacks
    entity.clearStacks(prepType);

    // Add capped total (only if > 0)
    if (cappedTotal > 0) {
      entity.addStacks(prepType, cappedTotal);
    }

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
