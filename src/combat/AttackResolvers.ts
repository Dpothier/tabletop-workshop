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

export type AttackType = 'melee' | 'ranged' | 'magical';

/**
 * Builds defensive reaction options for a player to spend beads.
 * Returns options for guard (red beads) and evasion (green beads), plus pass.
 */
export function buildDefensiveOptions(handCounts: BeadCounts, attackType?: AttackType): OptionChoice[] {
  const options: OptionChoice[] = [];

  // Add options for red beads (guard)
  for (let i = 1; i <= handCounts.red; i++) {
    options.push({
      id: `guard-${i}`,
      label: `Spend ${i} red bead${i > 1 ? 's' : ''} for +${i} Guard`,
    });
  }

  // Add options for green beads (evasion/dodge)
  if (attackType === 'melee') {
    // For melee attacks, offer only dodge option (single, costs 1 green bead)
    if (handCounts.green > 0) {
      options.push({
        id: 'dodge-1',
        label: 'Spend 1 green bead for +1 Evasion (Dodge)',
      });
    }
  } else if (attackType === 'ranged' || attackType === 'magical') {
    // For ranged and magical attacks, do not include dodge/evade options
  } else {
    // Backward compatibility: undefined attackType uses original evade behavior
    for (let i = 1; i <= handCounts.green; i++) {
      options.push({
        id: `evade-${i}`,
        label: `Spend ${i} green bead${i > 1 ? 's' : ''} for +${i} Evasion`,
      });
    }
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
export function applyDefensiveReaction(reactionId: string): {
  type: 'guard' | 'evade' | 'dodge' | 'pass';
  count: number;
} {
  if (reactionId.startsWith('guard-')) {
    const count = parseInt(reactionId.substring(6), 10);
    return { type: 'guard', count };
  }

  if (reactionId.startsWith('evade-')) {
    const count = parseInt(reactionId.substring(6), 10);
    return { type: 'evade', count };
  }

  if (reactionId.startsWith('dodge-')) {
    const count = parseInt(reactionId.substring(6), 10);
    return { type: 'dodge', count };
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
