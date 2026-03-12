/**
 * Combat statistics for attack resolution.
 */

export interface AttackStats {
  power: number; // Raw damage potential
  agility: number; // Hit precision vs Evasion
}

export interface DefenseStats {
  armor: number; // Equipment protection (0-3)
  guard: number; // Active blocking (0-3)
  evasion: number; // Dodge ability
}

export type AttackModifier = 'feint' | 'heavy' | 'precise' | 'swift' | 'percer';

export type CombatOutcome = 'hit' | 'dodged' | 'guarded';

export interface CombatResult {
  outcome: CombatOutcome;
  damage: number; // 0 if dodged or guarded
  canReact: boolean; // true unless swift modifier was used on dodge
}
