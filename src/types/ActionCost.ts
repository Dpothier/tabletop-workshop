/**
 * ActionCost represents the resource cost to perform an action.
 * Includes time cost and optional colored bead costs.
 */
export interface ActionCost {
  /** Required time cost (wheel units) */
  time: number;
  /** Optional red bead cost */
  red?: number;
  /** Optional blue bead cost */
  blue?: number;
  /** Optional green bead cost */
  green?: number;
  /** Optional white bead cost */
  white?: number;
}
