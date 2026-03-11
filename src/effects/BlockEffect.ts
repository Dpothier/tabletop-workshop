import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';

/**
 * BlockEffect: Grants +1 Guard to the target (typically the defender).
 * Used as a defensive reaction when a defender has a shield equipped.
 *
 * Params: { targetId } - The entity ID to grant Guard to (the defender)
 * Returns: EffectResult with success=true and guard=1 granted
 */
export class BlockEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = (params.targetId as string) || context.actorId;
    if (!targetId) {
      return { success: false, data: {}, events: [] };
    }

    const target = context.getEntity(targetId);
    if (!target) {
      return { success: false, data: {}, events: [] };
    }

    // Block grants +1 Guard
    target.guard += 1;

    return {
      success: true,
      data: {
        targetId,
        guardGranted: 1,
      },
      events: [],
    };
  }
}
