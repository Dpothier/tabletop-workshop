/**
 * Ranged weapon definitions for the ranged combat system.
 */

export interface RangeBand {
  min: number;
  max: number; // Infinity for long range
  modifier: number; // Added to precision
}

export interface RangedWeaponDefinition {
  id: string;
  name: string;
  penetration: number;
  rangeBands: {
    short: RangeBand;
    medium: RangeBand;
    long: RangeBand;
  };
}
