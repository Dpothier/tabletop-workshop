import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import { resolveAttack } from '@src/combat/CombatResolver';
import { buildAttackEvents } from '@src/combat/AttackResolvers';
import { validateTargeting, applyStateMutation } from '@src/combat/ActionPipeline';

/**
 * CastEffect — thin wrapper around spell resolution.
 * Uses spell power as both power and agility for simplicity.
 * Uses ActionPipeline for targeting validation and state mutation.
 */
export class CastEffect implements Effect {
  execute(
    context: GameContext,
    params: ResolvedParams,
    _modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): EffectResult {
    const targetId = params.targetEntity as string;
    const spellPower = (params.spellPower as number) ?? 1;
    const range = (params.range as number) ?? 99; // Spells have unlimited range by default
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

    // Thin resolver: use spellPower for both power and agility
    const defenseStats = target.getDefenseStats();
    const combatResult = resolveAttack({ power: spellPower, agility: spellPower }, defenseStats, []);

    // Build events
    const events = buildAttackEvents(
      attackerId, targetId, combatResult,
      target.currentHealth, target.maxHealth, spellPower
    );

    // Pipeline: apply state mutation
    const mutation = applyStateMutation(target, combatResult);

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
