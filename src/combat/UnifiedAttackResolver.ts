import type { AttackModifier, CombatResult, DefenseStats } from '@src/types/Combat';
import { resolveAttack } from '@src/combat/CombatResolver';

/**
 * Weapon-specific modifier applied to an attack
 */
export interface WeaponModifier {
  id: string;
  name: string;
  powerBonus: number;
  agilityBonus: number;
  attackModifiers: AttackModifier[];
}

/**
 * Input to the unified attack system
 */
export interface UnifiedAttackInput {
  weaponPower: number;
  weaponAgility: number;
  windupStacks: number;
  modifiers: AttackModifier[];
  weaponModifier?: WeaponModifier;
}

/**
 * Resolves a unified attack using weapon stats, preparations, and modifiers.
 *
 * Formula:
 * - effectivePower = basePower(1) + weaponPower + windupStacks
 * - effectiveAgility = baseAgility(1) + weaponAgility
 * - If weaponModifier provided, add its bonuses and attackModifiers
 * - Delegate to resolveAttack()
 */
export function resolveUnifiedAttack(
  input: UnifiedAttackInput,
  defense: DefenseStats
): CombatResult {
  // Compute effective attack stats: base (1, 1) + weapon stats + windup stacks
  let power: number = 1 + input.weaponPower + input.windupStacks;
  let agility: number = 1 + input.weaponAgility;

  // Apply weapon modifier stat bonuses
  if (input.weaponModifier) {
    power += input.weaponModifier.powerBonus;
    agility += input.weaponModifier.agilityBonus;
  }

  // Combine all attack modifiers: input modifiers + weapon modifier's built-in modifiers
  const allModifiers: AttackModifier[] = [...input.modifiers];
  if (input.weaponModifier) {
    allModifiers.push(...input.weaponModifier.attackModifiers);
  }

  // Delegate to existing combat resolver
  return resolveAttack({ power, agility }, defense, allModifiers);
}
