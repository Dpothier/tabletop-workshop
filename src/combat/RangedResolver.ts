/**
 * Ranged combat resolution system.
 * Handles weapon accuracy, range bands, difficulty, and hit determination.
 */

import type { RangedWeaponDefinition } from '@src/types/RangedWeaponDefinition';

export interface ShootInput {
  weapon: RangedWeaponDefinition;
  aimStacks: number;
  range: number; // Distance in tiles
}

export interface RangedDefenseStats {
  cover: number;
  guard: number;
  armor: number;
}

export type RangedOutcome = 'hit' | 'miss';

export interface RangedCombatResult {
  outcome: RangedOutcome;
  damage: number; // 1 if hit, 0 if miss
  precision: number;
  difficulty: number;
  rangeBand: 'short' | 'medium' | 'long';
}

/**
 * Resolves a ranged attack based on weapon, aim stacks, range, and defense stats.
 *
 * Ranged Combat Resolution Flow:
 * 1. Determine range band by checking weapon.rangeBands against input.range
 * 2. Calculate precision: 1 (base) + rangeBand.modifier + input.aimStacks
 * 3. Calculate difficulty: defense.cover + defense.guard + Math.max(defense.armor - weapon.penetration, 0)
 * 4. Compare precision > difficulty to determine hit or miss
 * 5. Damage is 1 on hit, 0 on miss
 *
 * @param input - The shoot action input (weapon, aim stacks, range)
 * @param defense - The target's defense statistics
 * @returns The result of the ranged combat resolution
 */
export function resolveRangedAttack(
  input: ShootInput,
  defense: RangedDefenseStats
): RangedCombatResult {
  // Determine which range band the target falls into
  let currentRangeBand: 'short' | 'medium' | 'long' = 'short';
  const { rangeBands } = input.weapon;

  if (input.range >= rangeBands.medium.min && input.range <= rangeBands.medium.max) {
    currentRangeBand = 'medium';
  } else if (input.range >= rangeBands.long.min && input.range <= rangeBands.long.max) {
    currentRangeBand = 'long';
  }

  const rangeBand = rangeBands[currentRangeBand];

  // Calculate precision: 1 (base) + rangeBand.modifier + aim stacks
  const precision: number = 1 + rangeBand.modifier + input.aimStacks;

  // Calculate difficulty: cover + guard + max(armor - penetration, 0)
  const armorAfterPenetration: number = Math.max(defense.armor - input.weapon.penetration, 0);
  const difficulty: number = defense.cover + defense.guard + armorAfterPenetration;

  // Determine hit or miss
  const outcome: RangedOutcome = precision > difficulty ? 'hit' : 'miss';
  const damage: number = outcome === 'hit' ? 1 : 0;

  return {
    outcome,
    damage,
    precision,
    difficulty,
    rangeBand: currentRangeBand,
  };
}
