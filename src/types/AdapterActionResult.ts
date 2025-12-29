import type { ActionCost } from '@src/types/ActionCost';
import type { AnimationEvent } from '@src/types/AnimationEvent';

/**
 * AdapterActionResult represents the outcome of executing an action through ActionResolution.
 * Includes cancellation status for user-initiated cancellations during parameter gathering.
 *
 * Named AdapterActionResult to distinguish from ActionResult in ActionDefinition.ts
 */
export interface AdapterActionResult {
  /** Whether the action was cancelled by the user during parameter collection */
  cancelled: boolean;

  /** Whether the action effects succeeded (only meaningful if !cancelled) */
  success: boolean;

  /** Total cost of the action (base + options) */
  cost: ActionCost;

  /** Animation events produced by effects */
  events: AnimationEvent[];

  /** Optional reason for failure if !success */
  reason?: string;
}
