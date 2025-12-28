import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import type { MoveEvent, Position } from '@src/types/AnimationEvent';

/**
 * MoveEffect moves an entity to a destination position.
 * Captures the original position before moving, then returns a MoveEvent.
 */
export class MoveEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    modifiers: Record<string, unknown>,
    chainResults: Map<string, EffectResult>
  ): EffectResult {
    const destination = params.destination as Position;
    const range = (modifiers.range as number) || 0;

    // Capture original position BEFORE the move
    const from = context.grid.getPosition('hero-0');
    if (!from) {
      return {
        success: false,
        data: {},
        events: [],
      };
    }

    // Move entity (assume 'hero-0' is the actor)
    const moveResult = context.grid.moveEntity('hero-0', destination);

    if (!moveResult.success) {
      return {
        success: false,
        data: {},
        events: [],
      };
    }

    const moveEvent: MoveEvent = {
      type: 'move',
      entityId: 'hero-0',
      from,
      to: destination,
    };

    return {
      success: true,
      data: { destination },
      events: [moveEvent],
    };
  }
}
