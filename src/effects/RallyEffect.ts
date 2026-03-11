import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';

export class RallyEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetId as string;
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

    const casterPos = context.grid.getPosition(context.actorId);
    const targetPos = context.grid.getPosition(targetId);
    if (!casterPos || !targetPos) {
      return { success: false, data: {}, events: [] };
    }

    const distance = Math.max(
      Math.abs(targetPos.x - casterPos.x),
      Math.abs(targetPos.y - casterPos.y)
    );
    if (distance > 6) {
      return { success: false, data: {}, events: [] };
    }

    return {
      success: true,
      data: {
        targetId,
        stacksPreserved: true,
      },
      events: [],
    };
  }
}
