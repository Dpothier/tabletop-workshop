import type { ActionDefinition } from '@src/types/ActionDefinition';
import { Action, type HydratedEffect } from '@src/models/Action';
import type { EffectRegistry } from '@src/systems/EffectRegistry';
import type { GameContext } from '@src/types/Effect';

/**
 * Registry for action definitions loaded from YAML.
 * Provides lookup of actions by ID and optional hydration with effects.
 */
export class ActionRegistry {
  private actions: Map<string, ActionDefinition> = new Map();
  private actionCache: Map<string, Action> = new Map();
  private effectRegistry?: EffectRegistry;
  private contextFactory?: (actorId: string) => GameContext;

  constructor(effectRegistry?: EffectRegistry, contextFactory?: (actorId: string) => GameContext) {
    this.effectRegistry = effectRegistry;
    this.contextFactory = contextFactory;
  }

  /**
   * Register an action definition.
   */
  register(action: ActionDefinition): void {
    this.actions.set(action.id, action);
  }

  /**
   * Register multiple action definitions.
   */
  registerAll(actions: ActionDefinition[]): void {
    for (const action of actions) {
      this.register(action);
    }
  }

  /**
   * Get an action definition by ID.
   * Returns the raw ActionDefinition without hydration.
   */
  get(id: string): ActionDefinition | undefined {
    return this.actions.get(id);
  }

  /**
   * Get a hydrated Action by ID.
   * Requires effectRegistry and contextFactory to be configured.
   * Returns undefined if action not found or hydration dependencies missing.
   */
  getAction(id: string): Action | undefined {
    // Check cache first
    const cached = this.actionCache.get(id);
    if (cached) return cached;

    const definition = this.actions.get(id);
    if (!definition) return undefined;

    // If no hydration dependencies, return undefined (use get() instead)
    if (!this.effectRegistry || !this.contextFactory) {
      return undefined;
    }

    // Hydrate effects
    const hydratedEffects: HydratedEffect[] = [];
    for (const effectDef of definition.effects) {
      const effect = this.effectRegistry.get(effectDef.type);
      if (!effect) {
        // Missing effect type - return undefined
        return undefined;
      }
      hydratedEffects.push({
        id: effectDef.id,
        type: effectDef.type,
        params: effectDef.params,
        effect,
      });
    }

    // Create and cache hydrated Action
    const action = new Action(definition, hydratedEffects, this.contextFactory);
    this.actionCache.set(id, action);
    return action;
  }

  /**
   * Get all registered actions.
   */
  getAll(): ActionDefinition[] {
    return Array.from(this.actions.values());
  }

  /**
   * Check if an action exists.
   */
  has(id: string): boolean {
    return this.actions.has(id);
  }

  /**
   * Get multiple actions by their IDs.
   * Returns only actions that exist.
   */
  getMultiple(ids: string[]): ActionDefinition[] {
    const result: ActionDefinition[] = [];
    for (const id of ids) {
      const action = this.actions.get(id);
      if (action) {
        result.push(action);
      }
    }
    return result;
  }
}
