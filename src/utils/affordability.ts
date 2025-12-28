import type { ActionCost } from '@src/types/ActionCost';
import type { BeadCounts } from '@src/types/Beads';

/**
 * Checks if available resources can cover the required cost.
 * Missing resource types are treated as 0.
 *
 * @param available - Resources the player has (time + beads)
 * @param required - Cost of the action
 * @returns true if all resource requirements are met
 */
export function canAfford(available: ActionCost, required: ActionCost): boolean {
  if (available.time < required.time) return false;
  if ((available.red ?? 0) < (required.red ?? 0)) return false;
  if ((available.blue ?? 0) < (required.blue ?? 0)) return false;
  if ((available.green ?? 0) < (required.green ?? 0)) return false;
  if ((available.white ?? 0) < (required.white ?? 0)) return false;
  return true;
}

/**
 * Convert BeadCounts plus available time into ActionCost for affordability checks.
 *
 * @param beads - Counts of beads by color
 * @param availableTime - Available time units
 * @returns ActionCost representation of the beads and time
 */
export function beadCountsToActionCost(beads: BeadCounts, availableTime: number): ActionCost {
  return {
    time: availableTime,
    red: beads.red,
    blue: beads.blue,
    green: beads.green,
    white: beads.white,
  };
}
