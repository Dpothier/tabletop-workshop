import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';

export class BlessEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetId as string;

    const casterPos = context.grid.getPosition(context.actorId!);
    if (!casterPos) {
      return { success: false, data: {}, events: [] };
    }

    const targetPos = context.grid.getPosition(targetId);
    if (!targetPos) {
      return { success: false, data: {}, events: [] };
    }

    // Range check: 1-6
    const distance = Math.max(
      Math.abs(targetPos.x - casterPos.x),
      Math.abs(targetPos.y - casterPos.y)
    );
    if (distance > 6) {
      return { success: false, data: {}, events: [] };
    }

    // Add gold bead to target's hand
    const beadHand = context.getBeadHand(targetId);
    if (!beadHand) {
      return { success: false, data: {}, events: [] };
    }

    beadHand.addGoldBead();

    return {
      success: true,
      data: { targetId, goldBeadAdded: true },
      events: [],
    };
  }
}
