import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import type { AttackModifier } from '@src/types/Combat';
import { resolveAttack } from '@src/combat/CombatResolver';
import { buildAttackEvents } from '@src/combat/AttackResolvers';
import {
  validateTargeting,
  applyStateMutation,
  handleDefensiveReaction,
} from '@src/combat/ActionPipeline';

/**
 * ShootEffect — thin wrapper around resolveAttack for ranged attacks.
 * Uses ActionPipeline for targeting validation and state mutation.
 */
export class ShootEffect implements Effect {
  async execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): Promise<EffectResult> {
    const targetId = params.targetEntity as string;
    const power = (params.power as number) ?? 1;
    const agility = (params.agility as number) ?? 1;
    const range = (params.range as number) ?? 5;
    const attackModifiers: AttackModifier[] = (params.modifiers as AttackModifier[]) ?? [];
    const attackerId = context.actorId!;

    // Pipeline: validate targeting (ranged)
    const targeting = validateTargeting(context, attackerId, targetId, range);
    if (!targeting.valid) {
      return {
        success: false,
        reason: targeting.reason ?? 'target out of range',
        data: {},
        events: [],
      };
    }

    const target = context.getEntity(targetId);
    if (!target) {
      return { success: false, reason: 'Target not found', data: {}, events: [] };
    }

    // Prompt for defensive reaction (ranged attack — no dodge available)
    await handleDefensiveReaction(context, target, power, agility, 'ranged');

    // Thin resolver call
    const defenseStats = target.getDefenseStats();
    const combatResult = resolveAttack({ power, agility }, defenseStats, attackModifiers);

    // Build events
    const events = buildAttackEvents(
      attackerId,
      targetId,
      combatResult,
      target.currentHealth,
      target.maxHealth,
      power
    );

    // Pipeline: apply state mutation
    const mutation = applyStateMutation(target, combatResult);

    // Record attack-attempt
    context.recorder?.record({
      type: 'attack-attempt',
      seq: 0,
      attackerId,
      attackerName: (context.getEntity(attackerId) as any)?.name || attackerId,
      targetId,
      targetName: (target as any)?.name || targetId,
      power,
      agility,
      modifiers: attackModifiers.map((m) => String(m)),
    } as any);

    // Record combat-outcome
    context.recorder?.record({
      type: 'combat-outcome',
      seq: 0,
      attackerId,
      targetId,
      outcome: combatResult.outcome,
      damage: combatResult.damage,
      blockedDamage: combatResult.outcome === 'guarded' ? power - combatResult.damage : 0,
      targetHealthAfter: target?.currentHealth || 0,
      targetMaxHealth: target?.maxHealth || 0,
    } as any);

    return {
      success: true,
      data: {
        hit: combatResult.outcome === 'hit',
        damage: mutation.actualDamage,
        outcome: combatResult.outcome,
      },
      events,
    };
  }
}
