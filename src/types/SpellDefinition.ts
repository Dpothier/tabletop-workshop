import type { BeadColor } from '@src/types/Beads';

/**
 * Enhancement that can be applied to a spell at cast time.
 */
export interface SpellEnhancement {
  extraDamage?: number;
  extraRange?: number;
  extraIntensity?: number;
}

/**
 * Definition of a spell available from a magical weapon.
 */
export interface SpellDefinition {
  id: string;
  name: string;
  color: BeadColor;
  baseCost: number;
  baseDamage: number;
  range: number;
  targetType: 'enemy' | 'ally' | 'any';
  enhancements?: Record<string, SpellEnhancement>;
}
