import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import type { IEntityRegistry } from '@src/types/EntityRegistry';
import type { ActionDefinition } from '@src/types/ActionDefinition';
import type { EquipmentDefinition, EquipmentSlot } from '@src/types/Equipment';
import type { ActionRegistry } from '@src/systems/ActionRegistry';
import type { CharacterAttributes } from '@src/types/CharacterData';
import type { BeadCounts } from '@src/types/Beads';

/**
 * Character represents a player-controlled entity.
 * It knows what actions it can take and resolves them when requested.
 * Actions are granted by equipment and innate abilities.
 */
export class Character extends Entity {
  private beadHand?: PlayerBeadSystem;
  private readonly actionRegistry?: ActionRegistry;

  /** Equipment currently worn by this character */
  private equipment: Map<EquipmentSlot, EquipmentDefinition> = new Map();

  /** Character's name */
  private characterName?: string;

  /** Character's attributes (STR, DEX, CON, etc.) */
  private characterAttributes?: CharacterAttributes;

  /** ID of the equipped weapon */
  private weaponId?: string;

  /** Action IDs that are always available (base actions any character can do) */
  private innateActions: string[] = ['move', 'run', 'attack', 'rest'];

  constructor(
    id: string,
    maxHealth: number,
    grid: BattleGrid,
    _entityRegistry: IEntityRegistry,
    actionRegistry?: ActionRegistry
  ) {
    super(id, maxHealth, grid);
    this.actionRegistry = actionRegistry;
  }

  /**
   * Equip an item to this character.
   * Replaces any existing item in the same slot.
   */
  equip(equipment: EquipmentDefinition): void {
    this.equipment.set(equipment.slot, equipment);
  }

  /**
   * Unequip an item from a slot.
   */
  unequip(slot: EquipmentSlot): void {
    this.equipment.delete(slot);
  }

  /**
   * Get equipped item in a slot.
   */
  getEquipment(slot: EquipmentSlot): EquipmentDefinition | undefined {
    return this.equipment.get(slot);
  }

  /**
   * Set the innate actions for this character.
   */
  setInnateActions(actionIds: string[]): void {
    this.innateActions = actionIds;
  }

  /**
   * Get all action IDs available to this character.
   * Combines actions from equipment and innate abilities.
   */
  getAvailableActionIds(): string[] {
    const actionIds = new Set<string>(this.innateActions);

    // Add actions from all equipped items
    for (const equipment of this.equipment.values()) {
      for (const actionId of equipment.actions) {
        actionIds.add(actionId);
      }
    }

    return Array.from(actionIds);
  }

  /**
   * Get all available action definitions.
   * Requires actionRegistry to be configured.
   */
  getAvailableActions(): ActionDefinition[] {
    const actionIds = this.getAvailableActionIds();

    if (!this.actionRegistry) {
      throw new Error('ActionRegistry not configured');
    }

    return this.actionRegistry.getMultiple(actionIds);
  }

  /**
   * Get a specific action definition by ID.
   */
  getAction(actionId: string): ActionDefinition | undefined {
    if (!this.actionRegistry) {
      throw new Error('ActionRegistry not configured');
    }

    return this.actionRegistry.get(actionId);
  }

  /**
   * Set character data including name, attributes, and weapon.
   */
  setCharacterData(name: string, attributes: CharacterAttributes, weaponId?: string): void {
    this.characterName = name;
    this.characterAttributes = attributes;
    this.weaponId = weaponId;
  }

  /**
   * Get the character's name.
   * Falls back to ID if name is not set.
   */
  getName(): string {
    return this.characterName ?? this.id;
  }

  /**
   * Get the character's attributes.
   */
  getAttributes(): CharacterAttributes | undefined {
    return this.characterAttributes;
  }

  /**
   * Get the equipped weapon ID.
   */
  getWeaponId(): string | undefined {
    return this.weaponId;
  }

  /**
   * Initialize the player bead hand system.
   */
  initializeBeadHand(initial?: BeadCounts): void {
    this.beadHand = new PlayerBeadSystem(initial);
  }

  /**
   * Check if this character has a bead hand system initialized.
   */
  hasBeadHand(): boolean {
    return this.beadHand !== undefined;
  }

  /**
   * Get the bead hand instance.
   */
  getBeadHand(): PlayerBeadSystem | undefined {
    return this.beadHand;
  }

  /**
   * Draw beads to hand.
   * @param count Number of beads to draw
   * @returns Array of drawn bead colors
   */
  drawBeadsToHand(count: number): string[] {
    if (!this.beadHand) {
      return [];
    }
    return this.beadHand.drawToHand(count);
  }

  /**
   * Get the current bead counts in hand.
   */
  getHandCounts(): { red: number; blue: number; green: number; white: number } | undefined {
    return this.beadHand?.getHandCounts();
  }

  /**
   * Set the bead hand to specific counts (for testing).
   * @param counts - Desired bead counts in hand
   */
  setBeadHand(counts: { red: number; blue: number; green: number; white: number }): void {
    if (this.beadHand) {
      this.beadHand.setHand(counts);
    }
  }
}
