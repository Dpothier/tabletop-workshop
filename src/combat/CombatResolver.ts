import type { AttackStats, DefenseStats, AttackModifier, CombatResult } from '@src/types/Combat';

/**
 * Resolves an attack against a defense, applying modifiers.
 *
 * Combat Resolution Flow:
 * 1. Apply modifiers (precise: +2 agility, feint: ignore guard, heavy: ignore armor)
 * 2. Check dodge: evasion >= agility -> dodged
 * 3. Check guard: defense >= power -> guarded
 * 4. Calculate damage: power - defense
 */
export function resolveAttack(
  attack: AttackStats,
  defense: DefenseStats,
  modifiers: AttackModifier[]
): CombatResult {
  // Apply modifiers to effective stats
  let effectiveAgility: number = attack.agility;
  const hasFeint: boolean = modifiers.includes('feint');
  const hasHeavy: boolean = modifiers.includes('heavy');
  const hasPrecise: boolean = modifiers.includes('precise');
  const hasSwift: boolean = modifiers.includes('swift');
  const hasPercer: boolean = modifiers.includes('percer');

  // Precise adds +2 to agility for dodge check
  if (hasPrecise) {
    effectiveAgility += 2;
  }

  // Check dodge: evasion >= effective agility -> dodged
  if (defense.evasion >= effectiveAgility) {
    return {
      outcome: 'dodged',
      damage: 0,
      canReact: !hasSwift,
    };
  }

  // Calculate effective defense based on modifiers
  let effectiveDefense: number;
  if (hasPercer && defense.guard === 0 && defense.evasion === 0) {
    // Percer: ignore armor when target has no guard and no evasion
    effectiveDefense = 0;
  } else if (hasFeint) {
    // Feint takes precedence: ignore guard, use armor only
    effectiveDefense = defense.armor;
  } else if (hasHeavy) {
    // Heavy: ignore armor, use guard only
    effectiveDefense = defense.guard;
  } else {
    // Normal: use armor + guard
    effectiveDefense = defense.armor + defense.guard;
  }

  // Check guard: defense >= power -> guarded
  if (effectiveDefense >= attack.power) {
    return {
      outcome: 'guarded',
      damage: 0,
      canReact: true,
    };
  }

  // Calculate damage: power - defense
  const damage: number = attack.power - effectiveDefense;

  return {
    outcome: 'hit',
    damage,
    canReact: true,
  };
}
