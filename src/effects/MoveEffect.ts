import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import type { MoveEvent } from '@src/types/AnimationEvent';
import type { Position } from '@src/state/BattleGrid';

/**
 * MoveEffect moves an entity to a destination position.
 * Captures the original position before moving, then returns a MoveEvent.
 */
export class MoveEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const destination = params.destination as Position;

    // Capture original position BEFORE the move
    const from = context.grid.getPosition(context.actorId!);
    if (!from) {
      return {
        success: false,
        data: {},
        events: [],
      };
    }

    // Move entity (assume context.actorId is the actor)
    const moveResult = context.grid.moveEntity(context.actorId!, destination);

    if (!moveResult.success) {
      return {
        success: false,
        data: {},
        events: [],
      };
    }

    const moveEvent: MoveEvent = {
      type: 'move',
      entityId: context.actorId!,
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
