import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';

export class CommandEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetId as string;
    const beadColor = params.beadColor as string;

    if (!targetId || !beadColor) {
      return { success: false, data: {}, events: [] };
    }

    // Check bearer has >= 1 Ponder stack
    if (!context.actorId) {
      return { success: false, data: {}, events: [] };
    }

    const bearer = context.getEntity(context.actorId);
    if (!bearer || bearer.getStacks('ponder') < 1) {
      return { success: false, data: {}, events: [] };
    }

    // Check target exists and is within range 6
    const casterPos = context.grid.getPosition(context.actorId);
    const targetPos = context.grid.getPosition(targetId);

    if (!casterPos || !targetPos) {
      return { success: false, data: {}, events: [] };
    }

    const distance = Math.max(
      Math.abs(targetPos.x - casterPos.x),
      Math.abs(targetPos.y - casterPos.y)
    );
    if (distance < 1 || distance > 6) {
      return { success: false, data: {}, events: [] };
    }

    // Get bearer's and ally's bead hands
    const bearerHand = context.getBeadHand(context.actorId);
    const allyHand = context.getBeadHand(targetId);
    if (!bearerHand || !allyHand) {
      return { success: false, data: {}, events: [] };
    }

    // Spend 1 bead of the requested color from bearer's hand (via ally's hand)
    if (!allyHand.spendFromOther(bearerHand, beadColor as 'red' | 'green' | 'blue' | 'white')) {
      return { success: false, data: {}, events: [] };
    }

    // Consume 1 Ponder stack from bearer
    bearer.addStacks('ponder', -1);

    return {
      success: true,
      data: { targetId, beadColor, ponderConsumed: 1 },
      events: [],
    };
  }
}
