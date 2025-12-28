import type { Effect } from '@src/types/Effect';

/**
 * EffectRegistry manages Effect implementations by type.
 * Simple registry for looking up effect classes during action execution.
 */
export class EffectRegistry {
  private registry = new Map<string, Effect>();

  /**
   * Register an effect under a type name.
   * @param type Unique effect type identifier
   * @param effect Effect instance to register
   */
  register(type: string, effect: Effect): void {
    this.registry.set(type, effect);
  }

  /**
   * Get an effect by type.
   * @param type Effect type identifier
   * @returns Effect instance or undefined if not registered
   */
  get(type: string): Effect | undefined {
    return this.registry.get(type);
  }
}
