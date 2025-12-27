import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import type { IEntityRegistry } from '@src/types/EntityRegistry';
import type { ActionDefinition, ActionParams, ActionResult } from '@src/types/Action';
import type { EquipmentDefinition, EquipmentSlot } from '@src/types/Equipment';
import type { ActionRegistry } from '@src/systems/ActionRegistry';
import type { ActionHandlerRegistry } from '@src/systems/ActionHandlers';

// Re-export for backwards compatibility
export type { ActionParams, ActionResult } from '@src/types/Action';

/**
 * Character represents a player-controlled entity.
 * It knows what actions it can take and resolves them when requested.
 * Actions are granted by equipment and innate abilities.
 */
export class Character extends Entity {
  private beadHand?: PlayerBeadSystem;
  private readonly actionRegistry?: ActionRegistry;
  private readonly actionHandlerRegistry?: ActionHandlerRegistry;

  /** Equipment currently worn by this character */
  private equipment: Map<EquipmentSlot, EquipmentDefinition> = new Map();

  /** Action IDs that are always available (base actions any character can do) */
  private innateActions: string[] = ['move', 'run', 'attack', 'rest'];

  constructor(
    id: string,
    maxHealth: number,
    grid: BattleGrid,
    _entityRegistry: IEntityRegistry,
    actionRegistry?: ActionRegistry,
    actionHandlerRegistry?: ActionHandlerRegistry
  ) {
    super(id, maxHealth, grid);
    this.actionRegistry = actionRegistry;
    this.actionHandlerRegistry = actionHandlerRegistry;
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
   * Resolve an action by its ID.
   * Validates the character has access to the action, then executes it.
   * @throws Error if action is not available or registries not configured
   */
  resolveAction(actionId: string, params: ActionParams): ActionResult {
    const availableIds = this.getAvailableActionIds();
    if (!availableIds.includes(actionId)) {
      throw new Error(`Character does not have action: ${actionId}`);
    }

    if (!this.actionHandlerRegistry) {
      throw new Error('ActionHandlerRegistry not configured');
    }

    const definition = this.getAction(actionId);
    if (!definition) {
      throw new Error(`No definition for action: ${actionId}`);
    }

    return this.actionHandlerRegistry.execute(this.id, params, definition);
  }

  /**
   * Get the wheel cost for a specific action.
   */
  getActionWheelCost(actionId: string): number {
    const action = this.getAction(actionId);
    if (!action) {
      throw new Error(`Unknown action: ${actionId}`);
    }
    return action.cost;
  }

  /**
   * Initialize the player bead hand system.
   */
  initializeBeadHand(): void {
    this.beadHand = new PlayerBeadSystem();
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
}
