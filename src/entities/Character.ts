import { BattleGrid, Position } from '@src/state/BattleGrid';
import { Entity } from '@src/entities/Entity';
import { PlayerBeadHand } from '@src/systems/PlayerBeadHand';
import type { AnimationEvent } from '@src/types/AnimationEvent';
import type { IEntityRegistry } from '@src/types/EntityRegistry';

/**
 * Parameters for action resolution.
 */
export interface ActionParams {
  target?: Position;
  targetEntityId?: string;
}

/**
 * Result of an action resolution.
 */
export interface ActionResult {
  success: boolean;
  reason?: string;
  wheelCost: number;
  events: AnimationEvent[];
}

/**
 * Definition of an available action.
 */
interface ActionDefinition {
  cost: number;
  handler: (params: ActionParams) => ActionResult;
}

/**
 * Character represents a player-controlled entity.
 * It knows what actions it can take and resolves them when requested.
 */
export class Character extends Entity {
  private beadHand?: PlayerBeadHand;
  private readonly entityRegistry: IEntityRegistry;
  private readonly availableActions: Map<string, ActionDefinition>;

  constructor(id: string, maxHealth: number, grid: BattleGrid, entityRegistry: IEntityRegistry) {
    super(id, maxHealth, grid);
    this.entityRegistry = entityRegistry;

    // Define available actions with their wheel costs and handlers
    this.availableActions = new Map<string, ActionDefinition>([
      ['move', { cost: 1, handler: this.executeMove.bind(this) }],
      ['run', { cost: 2, handler: this.executeRun.bind(this) }],
      ['attack', { cost: 2, handler: this.executeAttack.bind(this) }],
      ['rest', { cost: 2, handler: this.executeRest.bind(this) }],
    ]);
  }

  /**
   * Resolve an action by its ID.
   * Validates the character has access to the action, then executes it.
   * @throws Error if action is not available
   */
  resolveAction(actionId: string, params: ActionParams): ActionResult {
    const action = this.availableActions.get(actionId);

    if (!action) {
      throw new Error(`Character does not have action: ${actionId}`);
    }

    return action.handler(params);
  }

  /**
   * Get list of available action IDs.
   */
  getAvailableActions(): string[] {
    return Array.from(this.availableActions.keys());
  }

  /**
   * Get the wheel cost for a specific action.
   */
  getActionWheelCost(actionId: string): number {
    const action = this.availableActions.get(actionId);
    if (!action) {
      throw new Error(`Unknown action: ${actionId}`);
    }
    return action.cost;
  }

  /**
   * Initialize the player bead hand system.
   */
  initializeBeadHand(): void {
    this.beadHand = new PlayerBeadHand();
  }

  /**
   * Check if this character has a bead hand system initialized.
   */
  hasBeadHand(): boolean {
    return this.beadHand !== undefined;
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

  // Action Handlers

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

    // Run allows moving up to 6 tiles (range check is in BattleScene)
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

    // Check adjacency
    if (!this.grid.isAdjacent(this.id, targetId)) {
      return { success: false, reason: 'target not adjacent', wheelCost: 2, events: [] };
    }

    // Deal 1 damage to target
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
      // Draw 2 beads when resting
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
