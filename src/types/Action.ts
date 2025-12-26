import type { Position } from '@src/state/BattleGrid';
import type { AnimationEvent } from '@src/types/AnimationEvent';

/**
 * Definition of an action loaded from YAML.
 * Contains all data needed for both UI display and execution.
 */
export interface ActionDefinition {
  /** Unique identifier for the action */
  id: string;
  /** Display name shown in UI */
  name: string;
  /** Wheel cost to perform this action */
  cost: number;
  /** ID of the handler function to execute */
  handlerId: string;
  /** Optional description for tooltips */
  description?: string;
  /** Range in tiles (for movement/attacks) */
  range?: number;
  /** Damage dealt (for attack actions) */
  damage?: number;
}

/**
 * Parameters passed to action handlers.
 */
export interface ActionParams {
  /** Target position for movement actions */
  target?: Position;
  /** Target entity ID for combat actions */
  targetEntityId?: string;
}

/**
 * Result returned by action handlers.
 */
export interface ActionResult {
  /** Whether the action succeeded */
  success: boolean;
  /** Reason for failure if not successful */
  reason?: string;
  /** Wheel cost consumed */
  wheelCost: number;
  /** Animation events to play */
  events: AnimationEvent[];
}

/**
 * Function signature for action handlers.
 * Handlers are registered by handlerId and called during action resolution.
 */
export type ActionHandler = (
  entityId: string,
  params: ActionParams,
  definition: ActionDefinition
) => ActionResult;
