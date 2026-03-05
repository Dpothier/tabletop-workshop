import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import type { AttackModifier } from '@src/types/Combat';
import type { OptionPrompt } from '@src/types/ParameterPrompt';
import { resolveAttack } from '@src/combat/CombatResolver';
import {
  buildDefensiveOptions,
  applyDefensiveReaction,
  buildAttackEvents,
} from '@src/combat/AttackResolvers';
import { Character } from '@src/entities/Character';

/**
 * AttackEffect attacks a target entity using the combat resolution system.
 * Validates adjacency, resolves combat (dodge/guard/hit), and returns appropriate events.
 * Prompts player characters to spend beads for defensive bonuses before combat resolution.
 */
export class AttackEffect implements Effect {
  private async promptDefensiveReaction(
    context: GameContext,
    target: Character,
    power: number,
    agility: number
  ): Promise<void> {
    const beadHand = context.getBeadHand(target.id);
    if (!beadHand) {
      return;
    }

    const handCounts = beadHand.getHandCounts();
    const hasDefensiveBeads = handCounts.red > 0 || handCounts.green > 0;

    if (!hasDefensiveBeads || !context.adapter) {
      return;
    }

    // Build options for defensive reaction
    const options = buildDefensiveOptions(handCounts);

    const prompt: OptionPrompt = {
      type: 'option',
      key: 'defensiveReaction',
      prompt: 'Incoming Attack! Boost your defenses?',
      subtitle: `⚔ Power ${power}    💨 Agility ${agility}`,
      optional: true,
      multiSelect: false,
      options,
    };

    const selected = await context.adapter.promptOptions(prompt);
    if (!selected || selected.length === 0) {
      return;
    }

    const reactionId = selected[0];
    const reaction = applyDefensiveReaction(reactionId);
    let beadsSpent = false;

    // Handle guard reaction
    if (reaction.type === 'guard') {
      for (let i = 0; i < reaction.count; i++) {
        beadHand.spend('red');
      }
      target.setGuard(target.guard + reaction.count);
      beadsSpent = true;
    }

    // Handle evasion reaction
    if (reaction.type === 'evade') {
      for (let i = 0; i < reaction.count; i++) {
        beadHand.spend('green');
      }
      target.setEvasion(target.evasion + reaction.count);
      beadsSpent = true;
    }

    // Notify UI that beads have changed
    if (beadsSpent) {
      context.adapter.notifyBeadsChanged(target.id, beadHand.getHandCounts());
    }
  }
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

    // Prompt for defensive reaction if target is a Character
    if (target instanceof Character) {
      await this.promptDefensiveReaction(context, target, power, agility);
    }

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
