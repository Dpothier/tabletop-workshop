import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import type { AttackModifier } from '@src/types/Combat';
import { resolveAttack } from '@src/combat/CombatResolver';
import { buildAttackEvents } from '@src/combat/AttackResolvers';
import { handleDefensiveReaction } from '@src/combat/ActionPipeline';

/**
 * AttackEffect attacks a target entity using the combat resolution system.
 * Validates adjacency, resolves combat (dodge/guard/hit), and returns appropriate events.
 * Prompts player characters to spend beads for defensive bonuses before combat resolution.
 */
export class AttackEffect implements Effect {
  async execute(
    context: GameContext,
    params: ResolvedParams,
    modifiers: Record<string, unknown>,
    _chainResults: Map<string, EffectResult>
  ): Promise<EffectResult> {
    const targetId = params.targetEntity as string;

    // Get power and agility from params with backward-compatible defaults
    // If power not specified, use damage value (default 1)
    // If agility not specified, default to 1
    let power = (params.power as number) ?? (params.damage as number) ?? 1;
    const agility = (params.agility as number) ?? 1;

    // Apply damage modifier to power (backward compatibility)
    if (modifiers.damage) {
      power += modifiers.damage as number;
    }

    // Get attack modifiers from params
    const attackModifiers: AttackModifier[] = (params.modifiers as AttackModifier[]) ?? [];

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

    // Prompt for defensive reaction if target is a Character (melee attack)
    await handleDefensiveReaction(context, target, power, agility, 'melee');

    // Get target's defense stats
    const defenseStats = target.getDefenseStats();

    // Resolve combat
    const combatResult = resolveAttack({ power, agility }, defenseStats, attackModifiers);

    // Build animation events from combat result
    const events = buildAttackEvents(
      attackerId,
      targetId,
      combatResult,
      target.currentHealth,
      target.maxHealth,
      power
    );

    // Apply damage on hit
    let actualDamage = 0;
    if (combatResult.outcome === 'hit') {
      actualDamage = Math.min(combatResult.damage, target.currentHealth);
      target.receiveDamage(actualDamage);
    }

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
        damage: actualDamage,
        outcome: combatResult.outcome,
      },
      events,
    };
  }
}
