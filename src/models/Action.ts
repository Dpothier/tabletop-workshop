import type { ActionDefinition } from '@src/types/ActionDefinition';
import type { ParameterPrompt } from '@src/types/ParameterPrompt';
import type { GameContext, Effect, EffectResult } from '@src/types/Effect';
import type { ActionCost } from '@src/types/ActionCost';
import type { AnimationEvent } from '@src/types/AnimationEvent';
import type { BattleAdapter } from '@src/types/BattleAdapter';

/**
 * HydratedEffect combines an EffectDefinition with its Effect implementation.
 * This allows Action to execute effects without runtime EffectRegistry lookups.
 */
export interface HydratedEffect {
  id: string;
  type: string;
  params: Record<string, unknown>;
  effect: Effect;
}

/**
 * Action is a complete business object representing an executable action.
 * Contains hydrated effects (with implementations attached) and can execute
 * them in sequence with parameter resolution and effect chaining.
 */
export class Action {
  private adapter?: BattleAdapter;

  constructor(
    private definition: ActionDefinition,
    private effects: HydratedEffect[],
    private contextFactory: (actorId: string) => GameContext
  ) {}

  /**
   * Create a GameContext for the given actor.
   * Used by ActionResolution when resolving actions.
   */
  createContext(actorId: string): GameContext {
    return this.contextFactory(actorId);
  }

  /**
   * Create an ActionResolution to execute this action with the given adapter.
   * Note: Returns ActionResolution but typed as Promise since we use dynamic import
   * to avoid circular dependencies (ActionResolution imports Action).
   */
  async resolve(
    actorId: string,
    adapter: BattleAdapter
  ): Promise<{ execute: () => Promise<import('@src/types/ActionDefinition').ActionResult> }> {
    // Store adapter for use in applyEffects
    this.adapter = adapter;
    // Dynamic import to avoid circular dependencies
    const { ActionResolution } = await import('@src/systems/ActionResolution');
    return new ActionResolution(this, actorId, this.createContext(actorId), adapter);
  }

  get id(): string {
    return this.definition.id;
  }

  get name(): string {
    return this.definition.name;
  }

  get cost(): ActionCost {
    return this.definition.cost;
  }

  /**
   * Generator that yields parameter prompts in order from the action definition.
   * Used by ActionResolution to collect parameter values from the user.
   */
  *parametrize(): Generator<ParameterPrompt> {
    for (const param of this.definition.parameters) {
      yield param;
    }
  }

  /**
   * Apply all effects in sequence with the given parameters and context.
   *
   * @param params - Resolved parameter values from ActionResolution
   * @param context - Game context for effect execution
   * @returns Combined result with all events
   */
  async applyEffects(params: Map<string, unknown>, context: GameContext): Promise<EffectResult> {
    const chainResults = new Map<string, EffectResult>();
    const allEvents: AnimationEvent[] = [];

    // Add adapter to context if available
    const contextWithAdapter: GameContext = {
      ...context,
      adapter: this.adapter,
    };

    for (const hydrated of this.effects) {
      const resolvedParams = this.resolveParams(hydrated.params, params, chainResults);

      // Collect modifiers from selected options
      const modifiers: Record<string, unknown> = {};
      const selectedOptions = params.get('options') as string[] | undefined;
      if (selectedOptions && this.definition.options) {
        for (const optionId of selectedOptions) {
          const optionDef = this.definition.options[optionId];
          if (optionDef?.modifies && optionDef.modifier) {
            const targets = Array.isArray(optionDef.modifies)
              ? optionDef.modifies
              : [optionDef.modifies];
            if (targets.includes(hydrated.id)) {
              Object.assign(modifiers, optionDef.modifier);
            }
          }
        }
      }

      // Execute effect (may be async) with collected modifiers
      const resultOrPromise = hydrated.effect.execute(
        contextWithAdapter,
        resolvedParams,
        modifiers,
        chainResults
      );

      // Await if it's a promise
      const result = resultOrPromise instanceof Promise ? await resultOrPromise : resultOrPromise;

      // Store result for subsequent effects
      chainResults.set(hydrated.id, result);
      allEvents.push(...result.events);

      // Early termination on failure
      if (!result.success) {
        return {
          success: false,
          reason: result.reason,
          data: {},
          events: allEvents,
        };
      }
    }

    // Return the last effect's data (if any) so callers can inspect outcome
    const lastResult = Array.from(chainResults.values()).pop();
    return {
      success: true,
      data: lastResult?.data ?? {},
      events: allEvents,
    };
  }

  /**
   * Resolve effect parameters by replacing $references.
   */
  private resolveParams(
    effectParams: Record<string, unknown>,
    collectedParams: Map<string, unknown>,
    chainResults: Map<string, EffectResult>
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(effectParams)) {
      resolved[key] = this.resolveValue(value, collectedParams, chainResults);
    }
    return resolved;
  }

  /**
   * Recursively resolve a value that may contain $references.
   * - $parameter -> lookup in collectedParams
   * - $effectId.field -> lookup in chainResults
   */
  private resolveValue(
    value: unknown,
    collectedParams: Map<string, unknown>,
    chainResults: Map<string, EffectResult>
  ): unknown {
    if (typeof value === 'string' && value.startsWith('$')) {
      const refPath = value.substring(1);

      // Check for $effectId.field pattern
      if (refPath.includes('.')) {
        const [effectId, field] = refPath.split('.');
        const effectResult = chainResults.get(effectId);
        if (effectResult) {
          return (effectResult.data as Record<string, unknown>)[field];
        }
        return value; // Leave unresolved if effect not found
      }

      // Look up in collected parameters
      return collectedParams.get(refPath) ?? value;
    }

    // Recursively resolve objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      const resolved: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        resolved[k] = this.resolveValue(v, collectedParams, chainResults);
      }
      return resolved;
    }

    // Recursively resolve arrays
    if (Array.isArray(value)) {
      return value.map((v) => this.resolveValue(v, collectedParams, chainResults));
    }

    return value;
  }
}
