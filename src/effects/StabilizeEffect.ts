import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';

export class StabilizeEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetId as string;
    const rangeModifier = modifiers.range as boolean | undefined;

    const casterPos = context.grid.getPosition(context.actorId!);
    if (!casterPos) {
      return { success: false, data: {}, events: [] };
    }

    const targetEntity = context.getEntity(targetId);
    if (!targetEntity) {
      return { success: false, data: {}, events: [] };
    }

    const targetPos = context.grid.getPosition(targetId);
    if (!targetPos) {
      return { success: false, data: {}, events: [] };
    }

    // Range check: adjacent (1) by default, 6 with range modifier
    const maxRange = rangeModifier ? 6 : 1;
    const distance = Math.max(
      Math.abs(targetPos.x - casterPos.x),
      Math.abs(targetPos.y - casterPos.y)
    );

    if (distance > maxRange) {
      return { success: false, data: {}, events: [] };
    }

    // Stabilize 1 wound
    targetEntity.stabilize(targetEntity.stabilizedWounds + 1);

    return {
      success: true,
      data: {
        targetId,
        targetPosition: { x: targetPos.x, y: targetPos.y },
      },
      events: [],
    };
  }
}
