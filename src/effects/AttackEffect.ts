import type { Effect, EffectResult, GameContext, ResolvedParams } from '@src/types/Effect';
import type {
  AnimationEvent,
  AttackEvent,
  DamageEvent,
  DodgeEvent,
  GuardedEvent,
  HitEvent,
} from '@src/types/AnimationEvent';
import type { AttackModifier } from '@src/types/Combat';
import type { OptionPrompt, OptionChoice } from '@src/types/ParameterPrompt';
import { resolveAttack } from '@src/combat/CombatResolver';
import { Character } from '@src/entities/Character';

/**
 * AttackEffect attacks a target entity using the combat resolution system.
 * Validates adjacency, resolves combat (dodge/guard/hit), and returns appropriate events.
 * Prompts player characters to spend beads for defensive bonuses before combat resolution.
 */
export class AttackEffect implements Effect {
  private async promptDefensiveReaction(context: GameContext, target: Character): Promise<void> {
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
    const options: OptionChoice[] = [];

    // Add options for red beads (guard)
    for (let i = 1; i <= handCounts.red; i++) {
      options.push({
        id: `guard-${i}`,
        label: `Spend ${i} red bead${i > 1 ? 's' : ''} for +${i} Guard`,
      });
    }

    // Add options for green beads (evasion)
    for (let i = 1; i <= handCounts.green; i++) {
      options.push({
        id: `evade-${i}`,
        label: `Spend ${i} green bead${i > 1 ? 's' : ''} for +${i} Evasion`,
      });
    }

    // Always include pass option
    options.push({
      id: 'pass',
      label: 'Pass',
    });

    const prompt: OptionPrompt = {
      type: 'option',
      key: 'defensiveReaction',
      prompt: 'Boost your defenses against this attack?',
      optional: true,
      multiSelect: false,
      options,
    };

    const selected = await context.adapter.promptOptions(prompt);
    if (!selected || selected.length === 0) {
      return;
    }

    const reactionId = selected[0];

    // Handle guard reaction
    if (reactionId.startsWith('guard-')) {
      const count = parseInt(reactionId.substring(6), 10);
      for (let i = 0; i < count; i++) {
        beadHand.spend('red');
      }
      target.setGuard(target.guard + count);
    }

    // Handle evasion reaction
    if (reactionId.startsWith('evade-')) {
      const count = parseInt(reactionId.substring(6), 10);
      for (let i = 0; i < count; i++) {
        beadHand.spend('green');
      }
      target.setEvasion(target.evasion + count);
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
      await this.promptDefensiveReaction(context, target);
    }

    // Get target's defense stats
    const defenseStats = target.getDefenseStats();

    // Resolve combat
    const combatResult = resolveAttack({ power, agility }, defenseStats, attackModifiers);

    // Calculate actual damage (capped at target's current health for hit outcomes)
    let actualDamage = combatResult.damage;

    const events: AnimationEvent[] = [];

    // Add legacy attack event for backward compatibility
    events.push({
      type: 'attack',
      attackerId,
      targetId,
      damage: actualDamage,
    } as AttackEvent);

    // Add outcome-specific event
    if (combatResult.outcome === 'dodged') {
      events.push({
        type: 'dodge',
        entityId: targetId,
        attackerId,
        canReact: combatResult.canReact,
      } as DodgeEvent);
    } else if (combatResult.outcome === 'guarded') {
      events.push({
        type: 'guarded',
        entityId: targetId,
        attackerId,
        blockedDamage: power - combatResult.damage,
      } as GuardedEvent);
    } else {
      // Hit - cap damage at target's current health
      actualDamage = Math.min(combatResult.damage, target.currentHealth);

      events.push({
        type: 'hit',
        entityId: targetId,
        attackerId,
        damage: actualDamage,
      } as HitEvent);

      // Only apply damage on hit
      target.receiveDamage(actualDamage);

      // Add damage event for UI health bar update
      events.push({
        type: 'damage',
        entityId: targetId,
        newHealth: target.currentHealth,
        maxHealth: target.maxHealth,
      } as DamageEvent);
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
