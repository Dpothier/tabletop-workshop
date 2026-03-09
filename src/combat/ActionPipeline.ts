import type { GameContext } from '@src/types/Effect';
import type { CombatResult } from '@src/types/Combat';
import type { Entity } from '@src/entities/Entity';
import type { OptionPrompt } from '@src/types/ParameterPrompt';
import { Character } from '@src/entities/Character';
import type { AttackType } from '@src/combat/AttackResolvers';
import { buildDefensiveOptions, applyDefensiveReaction } from '@src/combat/AttackResolvers';

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
 * Checks if target is a Character, gets beads, prompts for defensive options,
 * and applies guard/evasion bonuses.
 */
export async function handleDefensiveReaction(
  context: GameContext,
  target: Entity,
  power: number,
  agility: number,
  attackType?: AttackType
): Promise<void> {
  if (!(target instanceof Character)) {
    return;
  }

  const beadHand = context.getBeadHand(target.id);
  if (!beadHand) {
    return;
  }

  const handCounts = beadHand.getHandCounts();
  const hasDefensiveBeads = handCounts.red > 0 || handCounts.green > 0 || handCounts.white > 0;

  if (!hasDefensiveBeads || !context.adapter) {
    return;
  }

  // Build options for defensive reaction
  const options = buildDefensiveOptions(handCounts, attackType);

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

  // Handle dodge reaction
  if (reaction.type === 'dodge') {
    for (let i = 0; i < reaction.count; i++) {
      beadHand.spend('green');
    }
    target.setEvasion(target.evasion + reaction.count);
    beadsSpent = true;
  }

  // Handle resist reaction
  if (reaction.type === 'resist') {
    for (let i = 0; i < reaction.count; i++) {
      beadHand.spend('white');
    }
    target.setWard(target.getWard() + reaction.count);
    beadsSpent = true;
  }

  // Notify UI that beads have changed
  if (beadsSpent) {
    context.adapter.notifyBeadsChanged(target.id, beadHand.getHandCounts());
  }
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
