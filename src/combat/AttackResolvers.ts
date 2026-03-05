import type { BeadCounts } from '@src/types/Beads';
import type { OptionChoice } from '@src/types/ParameterPrompt';
import type {
  AnimationEvent,
  AttackEvent,
  DamageEvent,
  DodgeEvent,
  GuardedEvent,
  HitEvent,
} from '@src/types/AnimationEvent';
import type { CombatResult } from '@src/types/Combat';

/**
 * Builds defensive reaction options for a player to spend beads.
 * Returns options for guard (red beads) and evasion (green beads), plus pass.
 */
export function buildDefensiveOptions(handCounts: BeadCounts): OptionChoice[] {
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

  return options;
}

/**
 * Parses a defensive reaction ID string into its type and count.
 */
export function applyDefensiveReaction(
  reactionId: string
): { type: 'guard' | 'evade' | 'pass'; count: number } {
  if (reactionId.startsWith('guard-')) {
    const count = parseInt(reactionId.substring(6), 10);
    return { type: 'guard', count };
  }

  if (reactionId.startsWith('evade-')) {
    const count = parseInt(reactionId.substring(6), 10);
    return { type: 'evade', count };
  }

  return { type: 'pass', count: 0 };
}

/**
 * Builds animation events from combat resolution results.
 * Returns events for attack outcome (hit/dodged/guarded) with appropriate damage/blocking info.
 */
export function buildAttackEvents(
  attackerId: string,
  targetId: string,
  combatResult: CombatResult,
  targetHealth: number,
  targetMaxHealth: number,
  attackPower?: number
): AnimationEvent[] {
  const events: AnimationEvent[] = [];

  // Add legacy attack event for backward compatibility
  events.push({
    type: 'attack',
    attackerId,
    targetId,
    damage: combatResult.damage,
  } as AttackEvent);

  // Add outcome-specific events
  if (combatResult.outcome === 'dodged') {
    events.push({
      type: 'dodge',
      entityId: targetId,
      attackerId,
      canReact: combatResult.canReact,
    } as DodgeEvent);
  } else if (combatResult.outcome === 'guarded') {
    const blockedDamage = (attackPower ?? 0) - combatResult.damage;
    events.push({
      type: 'guarded',
      entityId: targetId,
      attackerId,
      blockedDamage,
    } as GuardedEvent);
  } else {
    // Hit - cap damage at target's current health
    const actualDamage = Math.min(combatResult.damage, targetHealth);

    events.push({
      type: 'hit',
      entityId: targetId,
      attackerId,
      damage: actualDamage,
    } as HitEvent);

    // Add damage event for UI health bar update
    events.push({
      type: 'damage',
      entityId: targetId,
      newHealth: targetHealth - actualDamage,
      maxHealth: targetMaxHealth,
    } as DamageEvent);
  }

  return events;
}
