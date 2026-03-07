import type { GameContext } from '@src/types/Effect';
import type { CombatResult } from '@src/types/Combat';
import type { Entity } from '@src/entities/Entity';

export interface TargetingResult {
  valid: boolean;
  reason?: string;
}

export interface MutationResult {
  actualDamage: number;
}

/**
 * Validates targeting based on range.
 * For melee (range=1): uses grid.isAdjacent()
 * For ranged (range>1): uses grid.getDistance() <= range
 */
export function validateTargeting(
  context: GameContext,
  attackerId: string,
  targetId: string,
  range: number
): TargetingResult {
  if (range <= 1) {
    // Melee: must be adjacent
    const isAdjacent = context.grid.isAdjacent(attackerId, targetId);
    if (!isAdjacent) {
      return { valid: false, reason: 'target not adjacent' };
    }
    return { valid: true };
  } else {
    // Ranged: must be within range
    const distance = context.grid.getDistance(attackerId, targetId);
    if (distance > range) {
      return { valid: false, reason: 'target out of range' };
    }
    return { valid: true };
  }
}

/**
 * Handles defensive reaction for player targets.
 * For now, this is a no-op placeholder that the pipeline will call.
 * The actual prompting logic stays in AttackEffect for backward compat.
 */
export async function handleDefensiveReaction(
  _context: GameContext,
  _target: Entity,
  _power: number,
  _agility: number
): Promise<void> {
  // Pipeline hook - defensive reactions are handled here
  // Currently a no-op; actual reaction logic is in AttackEffect
}

/**
 * Applies combat result to target entity.
 * On hit: applies damage (capped at current health)
 * On dodge/guard: no mutation
 */
export function applyStateMutation(target: Entity, combatResult: CombatResult): MutationResult {
  if (combatResult.outcome === 'hit') {
    const actualDamage = Math.min(combatResult.damage, target.currentHealth);
    target.receiveDamage(actualDamage);
    return { actualDamage };
  }
  return { actualDamage: 0 };
}
