import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';

/**
 * LoadEffect: Sets a weapon to loaded state by adding 'loaded' stacks to the bearer.
 * Used for firearms like the Arquebus that require loading before firing.
 *
 * Params: { weaponId } - The weapon being loaded
 * Returns: EffectResult with success=true and loaded=1 stacks added
 */
export class LoadEffect implements Effect {
  execute(
    context: GameContext,
    _params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const bearerId = context.actorId;
    if (!bearerId) {
      return { success: false, data: {}, events: [] };
    }

    const bearer = context.getEntity(bearerId);
    if (!bearer) {
      return { success: false, data: {}, events: [] };
    }

    // Add loaded stack to bearer
    bearer.addStacks('loaded', 1);

    return {
      success: true,
      data: {
        bearerId,
        loadedStacks: 1,
      },
      events: [],
    };
  }
}
