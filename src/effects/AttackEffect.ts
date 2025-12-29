import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import type { AttackEvent, DamageEvent } from '@src/types/AnimationEvent';

/**
 * AttackEffect attacks a target entity dealing damage.
 * Validates adjacency, applies damage modifiers, and returns attack + damage events.
 */
export class AttackEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetEntity as string;
    let damage = (params.damage as number) || 1;

    // Apply damage modifier
    if (modifiers.damage) {
      damage += modifiers.damage as number;
    }

    // Check adjacency - use context.actorId as the attacker
    const attackerId = context.actorId!;
    const isAdjacent = context.grid.isAdjacent(attackerId, targetId);

    if (!isAdjacent) {
      return {
        success: false,
        reason: 'Target not adjacent',
        data: {},
        events: [],
      };
    }

    const target = context.getEntity(targetId);
    if (!target) {
      return {
        success: false,
        reason: 'Target not found',
        data: {},
        events: [],
      };
    }

    const attackResult = target.receiveAttack(damage);
    const actualDamage = attackResult.damage;

    const events = [
      {
        type: 'attack',
        attackerId,
        targetId,
        damage: actualDamage,
      } as AttackEvent,
      {
        type: 'damage',
        entityId: targetId,
        newHealth: target.currentHealth,
        maxHealth: target.maxHealth,
      } as DamageEvent,
    ];

    return {
      success: true,
      data: {
        hit: true,
        damage: actualDamage,
      },
      events,
    };
  }
}
