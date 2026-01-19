import type { ActionCost } from '@src/types/ActionCost';
import type { ParameterPrompt } from '@src/types/ParameterPrompt';
import type { AnimationEvent } from '@src/types/AnimationEvent';

/**
 * Action category for grouping actions in the UI
 */
export type ActionCategory = 'movement' | 'attack' | 'other';

/**
 * EffectDefinition represents a single effect to be executed as part of an action.
 */
export interface EffectDefinition {
  id: string;
  type: string;
  params: Record<string, unknown>;
}

/**
 * OptionDefinition modifies one or more effects based on user selection.
 */
export interface OptionDefinition {
  modifies?: string | string[];
  modifier?: Record<string, unknown>;
  adds?: EffectDefinition[];
}

/**
 * ActionDefinition is the revised schema for action data loaded from YAML.
 * Contains all information needed for parameter collection, cost calculation, and execution.
 */
export interface ActionDefinition {
  /** Unique identifier for the action */
  id: string;
  /** Display name shown in UI */
  name: string;
  /** Category for grouping in UI tabs */
  category: ActionCategory;
  /** Optional description for tooltips */
  description?: string;
  /** Base cost to perform the action */
  cost: ActionCost;
  /** Parameters to collect from the user before execution */
  parameters: ParameterPrompt[];
  /** Effects to execute in sequence */
  effects: EffectDefinition[];
  /** Optional modifiers for effects based on user option selections */
  options?: Record<string, OptionDefinition>;
}

/**
 * ActionResult is the outcome of executing an action.
 */
export interface ActionResult {
  /** Whether user cancelled during parameter collection */
  cancelled: boolean;
  /** Whether the action succeeded */
  success: boolean;
  /** Reason for failure if not successful */
  reason?: string;
  /** Total cost consumed (including options) */
  cost: ActionCost;
  /** Animation events to play */
  events: AnimationEvent[];
  /** Result data from executed effects */
  data: Record<string, unknown>;
}
