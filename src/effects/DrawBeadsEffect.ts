import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import type { RestEvent } from '@src/types/AnimationEvent';

/**
 * DrawBeadsEffect draws beads from the pool to a player's hand.
 * Returns a RestEvent with the beads drawn.
 */
export class DrawBeadsEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    modifiers: Record<string, unknown>,
    chainResults: Map<string, EffectResult>
  ): EffectResult {
    const count = (params.count as number) || 0;
    const entityId = params.entityId as string;

    const beadHand = context.getBeadHand(entityId);
    if (!beadHand) {
      return {
        success: false,
        data: {},
        events: [],
      };
    }

    const drawn = beadHand.drawToHand(count);

    const restEvent: RestEvent = {
      type: 'rest',
      entityId,
      beadsDrawn: drawn,
    };

    return {
      success: true,
      data: {
        count: drawn.length,
        beads: drawn,
      },
      events: [restEvent],
    };
  }
}
