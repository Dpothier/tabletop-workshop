import type { ActionDefinition, ActionResult } from '@src/types/ActionDefinition';
import type { ParameterPrompt } from '@src/types/ParameterPrompt';
import type { ActionCost } from '@src/types/ActionCost';
import type { EffectResult, GameContext } from '@src/types/Effect';
import { EffectRegistry } from '@src/systems/EffectRegistry';

/**
 * ActionResolution orchestrates the complete action execution flow:
 * 1. Parametrize - yield prompts for user input
 * 2. Provide values - collect and store parameter values
 * 3. Get total cost - calculate cost including options
 * 4. Resolve - execute effects with reference resolution and modifier application
 */
export class ActionResolution {
  private collectedValues: Map<string, unknown> = new Map();
  private skippedParameters: Set<string> = new Set();
  private chainResults: Map<string, EffectResult> = new Map();

  constructor(
    private entityId: string,
    private definition: ActionDefinition,
    private context: GameContext,
    private effectRegistry: EffectRegistry
  ) {}

  /**
   * Get the entity ID for which this action is being resolved.
   */
  getEntityId(): string {
    return this.entityId;
  }

  /**
   * Generator that yields parameter prompts in order from the action definition.
   * Each prompt describes what input is needed from the user.
   */
  *parametrize(): Generator<ParameterPrompt> {
    for (const param of this.definition.parameters) {
      yield param;
    }
  }

  /**
   * Provide a value for a parameter identified by key.
   * Returns success/failure with optional reason.
   */
  provideValue(key: string, value: unknown): { accepted: boolean; reason?: string } {
    const param = this.definition.parameters.find((p) => p.key === key);
    if (!param) {
      return { accepted: false, reason: `Unknown parameter: ${key}` };
    }

    this.collectedValues.set(key, value);
    return { accepted: true };
  }

  /**
   * Skip an optional parameter.
   * Returns success/failure with optional reason.
   */
  skip(key: string): { accepted: boolean; reason?: string } {
    const param = this.definition.parameters.find((p) => p.key === key);
    if (!param) {
      return { accepted: false, reason: `Unknown parameter: ${key}` };
    }

    if (!param.optional) {
      return { accepted: false, reason: `Parameter ${key} is required` };
    }

    this.skippedParameters.add(key);
    return { accepted: true };
  }

  /**
   * Calculate the total cost including the base cost plus any option costs.
   */
  getTotalCost(): ActionCost {
    const total: ActionCost = {
      time: this.definition.cost.time,
      red: this.definition.cost.red,
      blue: this.definition.cost.blue,
      green: this.definition.cost.green,
      white: this.definition.cost.white,
    };

    const selectedOptions = this.collectedValues.get('options') as string[] | undefined;
    if (selectedOptions && Array.isArray(selectedOptions)) {
      // Look for option costs in parameter definitions
      for (const param of this.definition.parameters) {
        if (param.type === 'option' && 'options' in param) {
          for (const optionId of selectedOptions) {
            const choice = param.options.find((opt) => opt.id === optionId);
            if (choice && choice.cost) {
              this.addCost(total, choice.cost);
            }
          }
        }
      }
    }

    return total;
  }

  /**
   * Execute the action - apply modifiers, run effects in sequence, return result.
   */
  resolve(): ActionResult {
    const events: any[] = [];
    let success = true;
    let reason: string | undefined;
    const resultData: Record<string, unknown> = {};

    // Resolve effect definitions with references and modifiers
    const resolvedEffects = this.resolveEffects();

    // Execute effects in sequence, passing chain results
    for (const { id, type, resolvedParams, modifiers } of resolvedEffects) {
      const effectClass = this.effectRegistry.get(type);
      if (!effectClass) {
        success = false;
        reason = `Unknown effect type: ${type}`;
        break;
      }

      const result: EffectResult = effectClass.execute(
        this.context,
        resolvedParams,
        modifiers,
        this.chainResults
      );

      // Store chain result for subsequent effects
      this.chainResults.set(id, result);

      if (result.success) {
        events.push(...result.events);
        resultData[id] = result.data;
      } else {
        success = false;
        reason = `Effect ${id} failed`;
        events.push(...result.events);
        break;
      }
    }

    return {
      success,
      reason,
      cost: this.getTotalCost(),
      events,
      data: resultData,
    };
  }

  /**
   * Resolve all effect definitions by:
   * 1. Resolving $parameter and $effectId.field references
   * 2. Applying modifiers from selected options
   */
  private resolveEffects(): Array<{
    id: string;
    type: string;
    resolvedParams: Record<string, unknown>;
    modifiers: Record<string, unknown>;
  }> {
    const selectedOptions = this.collectedValues.get('options') as string[] | undefined;
    const selectedOptionsSet: Set<string> = selectedOptions ? new Set(selectedOptions) : new Set();

    return this.definition.effects.map((effect) => {
      // Resolve parameters (replace $references)
      const resolvedParams = this.resolveReferences(effect.params);

      // Collect modifiers from selected options that affect this effect
      const modifiers: Record<string, unknown> = {};
      if (this.definition.options) {
        for (const optionId of selectedOptionsSet) {
          const optionDef = this.definition.options[optionId];
          if (optionDef) {
            // Check if this option modifies the current effect
            const modifiesTarget = optionDef.modifies;
            if (modifiesTarget) {
              const targets = Array.isArray(modifiesTarget) ? modifiesTarget : [modifiesTarget];
              if (targets.includes(effect.id) && optionDef.modifier) {
                Object.assign(modifiers, optionDef.modifier);
              }
            }
          }
        }
      }

      return {
        id: effect.id,
        type: effect.type,
        resolvedParams,
        modifiers,
      };
    });
  }

  /**
   * Resolve $references in a params object:
   * - $paramName -> look up in collectedValues
   * - $effectId.field -> look up in chainResults
   */
  private resolveReferences(params: Record<string, unknown>): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params)) {
      resolved[key] = this.resolveValue(value);
    }

    return resolved;
  }

  /**
   * Recursively resolve a value that may contain $references.
   */
  private resolveValue(value: unknown): unknown {
    if (typeof value === 'string' && value.startsWith('$')) {
      const refPath = value.substring(1);

      // Check for $effectId.field pattern
      if (refPath.includes('.')) {
        const [effectId, field] = refPath.split('.');
        const effectResult = this.chainResults.get(effectId);
        if (effectResult) {
          return (effectResult.data as Record<string, unknown>)[field];
        }
        return value;
      }

      // Look up in collected values
      return this.collectedValues.get(refPath) ?? value;
    }

    // Recursively resolve nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      const resolved: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        resolved[k] = this.resolveValue(v);
      }
      return resolved;
    }

    // Arrays stay as-is
    if (Array.isArray(value)) {
      return value.map((v) => this.resolveValue(v));
    }

    return value;
  }

  /**
   * Add a cost to a total, merging all bead colors.
   */
  private addCost(total: ActionCost, toAdd: Partial<ActionCost>): void {
    if (toAdd.time) {
      total.time += toAdd.time;
    }
    if (toAdd.red) {
      total.red = (total.red ?? 0) + toAdd.red;
    }
    if (toAdd.blue) {
      total.blue = (total.blue ?? 0) + toAdd.blue;
    }
    if (toAdd.green) {
      total.green = (total.green ?? 0) + toAdd.green;
    }
    if (toAdd.white) {
      total.white = (total.white ?? 0) + toAdd.white;
    }
  }
}
