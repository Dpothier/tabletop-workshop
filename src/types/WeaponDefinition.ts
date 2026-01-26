/**
 * Definition of a weapon loaded from YAML.
 * Weapons define combat stats that apply to attacks.
 */
export interface WeaponDefinition {
  /** Unique identifier for the weapon */
  id: string;
  /** Display name */
  name: string;
  /** Weapon category (e.g., "melee") */
  category: string;
  /** Power stat bonus */
  power: number;
  /** Agility stat bonus */
  agility: number;
  /** Range in tiles (number for single range, string like "1-2" for variable) */
  range: number | string;
}
