import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';

/**
 * ThrowEffect: Throws a weapon at a target, dealing damage based on weapon power and agility.
 * Weapon is dropped at target's position after throw.
 *
 * Params: { targetId, power, agility } - Target entity and weapon stats
 * Returns: EffectResult with success=true and weapon drop position
 */
export class ThrowEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetId as string;
    const weaponPower = (params.power as number) ?? 1;
    const weaponAgility = (params.agility as number) ?? 1;

    if (!targetId || !context.grid || !context.actorId) {
      return { success: false, data: {}, events: [] };
    }

    const target = context.getEntity(targetId);
    if (!target) {
      return { success: false, data: {}, events: [] };
    }

    const targetPos = context.grid.getPosition(targetId);

    return {
      success: true,
      data: {
        targetId,
        power: weaponPower,
        agility: weaponAgility,
        weaponDropPosition: targetPos ? { x: targetPos.x, y: targetPos.y } : null,
      },
      events: [],
    };
  }
}
