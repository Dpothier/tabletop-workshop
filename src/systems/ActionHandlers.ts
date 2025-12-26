import type {
  ActionHandler,
  ActionParams,
  ActionResult,
  ActionDefinition,
} from '@src/types/Action';
import type { BattleGrid } from '@src/state/BattleGrid';
import type { IEntityRegistry } from '@src/types/EntityRegistry';
import type { Entity } from '@src/entities/Entity';
import type { PlayerBeadSystem } from '@src/systems/PlayerBeadSystem';

/**
 * Context provided to action handlers.
 * Contains references to game systems needed for action execution.
 */
export interface ActionContext {
  grid: BattleGrid;
  entityRegistry: IEntityRegistry;
  getBeadHand: (entityId: string) => PlayerBeadSystem | undefined;
}

/**
 * Registry for action handler functions.
 * Maps handlerIds from YAML to TypeScript implementations.
 */
export class ActionHandlerRegistry {
  private handlers: Map<string, ActionHandler> = new Map();
  private context: ActionContext | null = null;

  /**
   * Set the context for action execution.
   * Must be called before executing any actions.
   */
  setContext(context: ActionContext): void {
    this.context = context;
  }

  /**
   * Register a handler function.
   */
  register(handlerId: string, handler: ActionHandler): void {
    this.handlers.set(handlerId, handler);
  }

  /**
   * Get a handler by ID.
   */
  get(handlerId: string): ActionHandler | undefined {
    return this.handlers.get(handlerId);
  }

  /**
   * Execute an action using its handler.
   */
  execute(entityId: string, params: ActionParams, definition: ActionDefinition): ActionResult {
    const handler = this.handlers.get(definition.handlerId);
    if (!handler) {
      return {
        success: false,
        reason: `Unknown handler: ${definition.handlerId}`,
        wheelCost: definition.cost,
        events: [],
      };
    }
    return handler(entityId, params, definition);
  }

  /**
   * Get the current context.
   */
  getContext(): ActionContext | null {
    return this.context;
  }
}

/**
 * Create default action handlers for core actions.
 */
export function createDefaultHandlers(registry: ActionHandlerRegistry): void {
  // Movement handler (for move and run)
  registry.register('movement', (entityId, params, definition) => {
    const context = registry.getContext();
    if (!context) {
      return { success: false, reason: 'No context', wheelCost: definition.cost, events: [] };
    }

    if (!params.target) {
      return { success: false, reason: 'No target', wheelCost: definition.cost, events: [] };
    }

    const entity = context.entityRegistry.get(entityId);
    if (!entity) {
      return { success: false, reason: 'Entity not found', wheelCost: definition.cost, events: [] };
    }

    const from = context.grid.getPosition(entityId);
    if (!from) {
      return {
        success: false,
        reason: 'Entity has no position',
        wheelCost: definition.cost,
        events: [],
      };
    }

    const moveResult = context.grid.moveEntity(entityId, params.target);
    if (!moveResult.success) {
      return {
        success: false,
        reason: moveResult.reason,
        wheelCost: definition.cost,
        events: [],
      };
    }

    return {
      success: true,
      wheelCost: definition.cost,
      events: [{ type: 'move', entityId, from, to: params.target }],
    };
  });

  // Melee attack handler
  registry.register('melee_attack', (entityId, params, definition) => {
    const context = registry.getContext();
    if (!context) {
      return { success: false, reason: 'No context', wheelCost: definition.cost, events: [] };
    }

    const targetId = params.targetEntityId ?? 'monster';
    const target = context.entityRegistry.get(targetId) as Entity | undefined;

    if (!target) {
      return { success: false, reason: 'Target not found', wheelCost: definition.cost, events: [] };
    }

    if (!context.grid.isAdjacent(entityId, targetId)) {
      return {
        success: false,
        reason: 'Target not adjacent',
        wheelCost: definition.cost,
        events: [],
      };
    }

    const damage = definition.damage ?? 1;
    target.receiveAttack(damage);

    return {
      success: true,
      wheelCost: definition.cost,
      events: [
        { type: 'attack', attackerId: entityId, targetId, damage },
        {
          type: 'damage',
          entityId: targetId,
          newHealth: target.currentHealth,
          maxHealth: target.maxHealth,
        },
      ],
    };
  });

  // Rest handler
  registry.register('rest', (entityId, _params, definition) => {
    const context = registry.getContext();
    if (!context) {
      return { success: false, reason: 'No context', wheelCost: definition.cost, events: [] };
    }

    const beadHand = context.getBeadHand(entityId);
    let beadsDrawn: string[] = [];

    if (beadHand) {
      beadsDrawn = beadHand.drawToHand(2);
    }

    return {
      success: true,
      wheelCost: definition.cost,
      events: [
        {
          type: 'rest',
          entityId,
          beadsDrawn: beadsDrawn as ('red' | 'blue' | 'green' | 'white')[],
        },
      ],
    };
  });
}
