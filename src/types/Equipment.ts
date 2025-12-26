/**
 * Equipment slot types.
 */
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory' | 'trinket';

/**
 * Definition of equipment loaded from YAML.
 * Equipment grants actions to characters.
 */
export interface EquipmentDefinition {
  /** Unique identifier for the equipment */
  id: string;
  /** Display name */
  name: string;
  /** Which slot this equipment occupies */
  slot: EquipmentSlot;
  /** Action IDs granted by this equipment */
  actions: string[];
  /** Optional description */
  description?: string;
}
