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
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    let count = (params.count as number) || 0;
    const entityId = params.entityId as string;

    const beadHand = context.getBeadHand(entityId);
    if (!beadHand) {
      return {
        success: false,
        data: {},
        events: [],
      };
    }

    // If strategize modifier is active, draw 4 beads instead
    if (modifiers.strategize === true) {
      count = 4;
    }

    const drawn = beadHand.drawToHand(count);

    const restEvent: RestEvent = {
      type: 'rest',
      entityId,
      beadsDrawn: drawn,
    };

    const data: Record<string, unknown> = {
      count: drawn.length,
      beads: drawn,
    };

    // Add mustReturn flag when strategize is active
    if (modifiers.strategize === true) {
      data.mustReturn = 1;
    }

    context.recorder?.record({
      type: 'bead-draw',
      seq: 0,
      entityId: entityId || context.actorId || '',
      entityName:
        context.getEntity(entityId || context.actorId || '')?.getName?.() ||
        entityId ||
        context.actorId ||
        'Entity',
      colors: drawn.map((b: any) => (typeof b === 'string' ? b : b.color || '')),
      source: 'rest',
      handAfter: beadHand?.getHandCounts() || { red: 0, blue: 0, green: 0, white: 0 },
    } as any);

    return {
      success: true,
      data,
      events: [restEvent],
    };
  }
}
