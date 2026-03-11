import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';

export class GreatGuardEffect implements Effect {
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

    if (!context.actorId) {
      return { success: false, data: {}, events: [] };
    }

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
