/**
 * Applies a time cost modifier to a base time cost.
 * Ensures the result never drops below 1.
 */
export function applyTimeCostModifier(baseCost: number, modifier: number): number {
  return Math.max(1, baseCost + modifier);
}
