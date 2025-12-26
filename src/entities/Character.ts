import { BattleGrid } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';
import type { IEntityRegistry } from '@src/types/EntityRegistry';
import type { ActionDefinition, ActionParams, ActionResult } from '@src/types/Action';
import type { EquipmentDefinition, EquipmentSlot } from '@src/types/Equipment';
import type { ActionRegistry } from '@src/systems/ActionRegistry';

// Re-export for backwards compatibility
export type { ActionParams, ActionResult } from '@src/types/Action';

/**
 * Legacy action definition for backwards compatibility.
 */
interface LegacyActionDefinition {
  cost: number;
  handler: (params: ActionParams) => ActionResult;
}

/**
 * Character represents a player-controlled entity.
 * It knows what actions it can take and resolves them when requested.
 * Actions are granted by equipment and innate abilities.
 */
export class Character extends Entity {
  private beadHand?: PlayerBeadSystem;
  private readonly entityRegistry: IEntityRegistry;
  private readonly actionRegistry?: ActionRegistry;

  /** Equipment currently worn by this character */
  private equipment: Map<EquipmentSlot, EquipmentDefinition> = new Map();

  /** Action IDs that are always available (base actions any character can do) */
  private innateActions: string[] = ['move', 'run', 'attack', 'rest'];

  /** Legacy action handlers for backwards compatibility */
  private readonly legacyHandlers: Map<string, LegacyActionDefinition>;

  constructor(
    id: string,
    maxHealth: number,
    grid: BattleGrid,
    entityRegistry: IEntityRegistry,
    actionRegistry?: ActionRegistry
  ) {
    super(id, maxHealth, grid);
    this.entityRegistry = entityRegistry;
    this.actionRegistry = actionRegistry;

    // Legacy handlers for backwards compatibility
    this.legacyHandlers = new Map<string, LegacyActionDefinition>([
      ['move', { cost: 1, handler: this.executeMove.bind(this) }],
      ['run', { cost: 2, handler: this.executeRun.bind(this) }],
      ['attack', { cost: 2, handler: this.executeAttack.bind(this) }],
      ['rest', { cost: 2, handler: this.executeRest.bind(this) }],
    ]);
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
   * Returns ActionDefinition objects if actionRegistry is available,
   * otherwise returns legacy-style definitions.
   */
  getAvailableActions(): ActionDefinition[] {
    const actionIds = this.getAvailableActionIds();

    if (this.actionRegistry) {
      return this.actionRegistry.getMultiple(actionIds);
    }

    // Fallback: create ActionDefinition from legacy handlers
    const actions: ActionDefinition[] = [];
    for (const id of actionIds) {
      const legacy = this.legacyHandlers.get(id);
      if (legacy) {
        actions.push({
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          cost: legacy.cost,
          handlerId: id,
        });
      }
    }
    return actions;
  }

  /**
   * Get a specific action definition by ID.
   */
  getAction(actionId: string): ActionDefinition | undefined {
    if (this.actionRegistry) {
      return this.actionRegistry.get(actionId);
    }

    const legacy = this.legacyHandlers.get(actionId);
    if (legacy) {
      return {
        id: actionId,
        name: actionId.charAt(0).toUpperCase() + actionId.slice(1),
        cost: legacy.cost,
        handlerId: actionId,
      };
    }
    return undefined;
  }

  /**
   * Resolve an action by its ID.
   * Validates the character has access to the action, then executes it.
   * @throws Error if action is not available
   */
  resolveAction(actionId: string, params: ActionParams): ActionResult {
    const availableIds = this.getAvailableActionIds();
    if (!availableIds.includes(actionId)) {
      throw new Error(`Character does not have action: ${actionId}`);
    }

    // Use legacy handler for execution
    const legacy = this.legacyHandlers.get(actionId);
    if (!legacy) {
      throw new Error(`No handler for action: ${actionId}`);
    }

    return legacy.handler(params);
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

  // Legacy Action Handlers

  private executeMove(params: ActionParams): ActionResult {
    if (!params.target) {
      return { success: false, reason: 'no target', wheelCost: 1, events: [] };
    }

    const from = this.getPosition();
    const moveResult = this.moveTo(params.target);
    if (!moveResult.success) {
      return {
        success: false,
        reason: moveResult.reason,
        wheelCost: 1,
        events: [],
      };
    }

    return {
      success: true,
      wheelCost: 1,
      events: [{ type: 'move', entityId: this.id, from: from!, to: params.target }],
    };
  }

  private executeRun(params: ActionParams): ActionResult {
    if (!params.target) {
      return { success: false, reason: 'no target', wheelCost: 2, events: [] };
    }

    const from = this.getPosition();
    const moveResult = this.moveTo(params.target);
    if (!moveResult.success) {
      return {
        success: false,
        reason: moveResult.reason,
        wheelCost: 2,
        events: [],
      };
    }

    return {
      success: true,
      wheelCost: 2,
      events: [{ type: 'move', entityId: this.id, from: from!, to: params.target }],
    };
  }

  private executeAttack(params: ActionParams): ActionResult {
    const targetId = params.targetEntityId ?? 'monster';
    const target = this.entityRegistry.get(targetId);

    if (!target) {
      return { success: false, reason: 'target not found', wheelCost: 2, events: [] };
    }

    if (!this.grid.isAdjacent(this.id, targetId)) {
      return { success: false, reason: 'target not adjacent', wheelCost: 2, events: [] };
    }

    target.receiveAttack(1);

    return {
      success: true,
      wheelCost: 2,
      events: [
        { type: 'attack', attackerId: this.id, targetId, damage: 1 },
        {
          type: 'damage',
          entityId: targetId,
          newHealth: target.currentHealth,
          maxHealth: target.maxHealth,
        },
      ],
    };
  }

  private executeRest(_params: ActionParams): ActionResult {
    let beadsDrawn: string[] = [];
    if (this.beadHand) {
      beadsDrawn = this.beadHand.drawToHand(2);
    }

    return {
      success: true,
      wheelCost: 2,
      events: [
        {
          type: 'rest',
          entityId: this.id,
          beadsDrawn: beadsDrawn as ('red' | 'blue' | 'green' | 'white')[],
        },
      ],
    };
  }
}
