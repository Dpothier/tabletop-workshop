/**
 * Equipment slot types.
 */
export type EquipmentSlot = 'main-hand' | 'off-hand' | 'accessory';

/**
 * Passive defensive and offensive stats granted by equipment.
 */
export interface PassiveStats {
  guard?: number;
  evasion?: number;
  ward?: number;
  armor?: number;
}

/**
 * Range band for ranged weapons.
 */
export interface RangeBand {
  name: string;
  min: number;
  max: number;
  modifier: number;
}

/**
 * Definition of equipment loaded from YAML.
 * Equipment grants actions and modifiers to characters.
 */
export interface EquipmentDefinition {
  /** Unique identifier for the equipment */
  id: string;
  /** Display name */
  name: string;
  /** Category of equipment (light, heavy, shield, etc.) */
  category: string;
  /** Which slot this equipment occupies */
  slot: EquipmentSlot;
  /** Power rating */
  power: number;
  /** Agility modifier */
  agility: number;
  /** Range (0 for melee, or number for ranged weapons) */
  range: number | string;
  /** Armor penetration */
  penetration: number;
  /** Tags for filtering and conditions */
  tags: string[];
  /** Number of inventory slots required */
  inventorySlots: number;
  /** Whether this is a two-handed weapon */
  twoHanded: boolean;
  /** Modifier IDs granted by this equipment */
  grantedModifiers: string[];
  /** Action IDs granted by this equipment */
  grantedActions: string[];
  /** Passive stats applied to character */
  passiveStats: PassiveStats;
  /** Range bands for ranged weapons */
  rangeBands: RangeBand[];
  /** Whether this weapon starts loaded */
  startsLoaded: boolean;
}
