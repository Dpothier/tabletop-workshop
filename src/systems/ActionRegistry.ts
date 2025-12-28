import type { ActionDefinition } from '@src/types/ActionDefinition';

/**
 * Registry for action definitions loaded from YAML.
 * Provides lookup of actions by ID.
 */
export class ActionRegistry {
  private actions: Map<string, ActionDefinition> = new Map();

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
   * Get an action by ID.
   */
  get(id: string): ActionDefinition | undefined {
    return this.actions.get(id);
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
