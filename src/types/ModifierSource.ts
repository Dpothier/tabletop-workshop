/**
 * Represents a source of modifiers - typically an equipped item.
 */
export interface ModifierSource {
  /** Unique identifier for the equipment */
  sourceId: string;
  /** Display name of the equipment */
  sourceName: string;
  /** Type of equipment that granted the modifier */
  sourceType: 'weapon' | 'shield' | 'item';
  /** Which equipment slot this source occupies */
  slot: 'main-hand' | 'off-hand' | 'accessory';
}

/**
 * An option with its equipment source paired together.
 * Used to track where modifiers come from and how many instances are available.
 */
export interface SourcedOption {
  /** The unique identifier of the option (e.g., "strength") */
  optionId: string;
  /** The option definition itself */
  option: any; // OptionDefinition type imported where needed to avoid circular deps
  /** The equipment source that grants this option */
  source: ModifierSource;
  /** Display label combining option name and source name (e.g., "Strength (Long Sword)") */
  displayLabel: string;
}

/**
 * Represents an equipped item that can grant modifiers.
 */
export interface EquipmentSource {
  /** Unique identifier for this equipment */
  id: string;
  /** Display name of the equipment */
  name: string;
  /** Type of equipment */
  type: 'weapon' | 'shield' | 'item';
  /** Which equipment slot this is in */
  slot: 'main-hand' | 'off-hand' | 'accessory';
  /** List of option IDs this equipment grants as modifiers */
  grantedModifiers: string[];
}
